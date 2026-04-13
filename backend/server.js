// set CLIENT_ID, CLIENT_SECRET for Google in environment
// set MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID for Microsoft/Outlook
// (.env supported)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const {
    CLIENT_ID,
    CLIENT_SECRET,
    // Must match the redirect URI registered in Google Cloud Console.
    // For Chrome extensions using launchWebAuthFlow, this must be:
    //   https://<extension-id>.chromiumapp.org/oauth2callback
    // Set CHROME_EXTENSION_ID in your .env file.
    CHROME_EXTENSION_ID,
    // Microsoft / Outlook
    MS_CLIENT_ID,
    MS_CLIENT_SECRET,
    MS_TENANT_ID = 'common',
    FLASK_API_URL = 'http://localhost:8000/api/emails',
    FLASK_BASE_URL = 'http://localhost:8000',
    PORT = 3000,
} = process.env;

if (!CHROME_EXTENSION_ID) {
    console.warn('[WARN] CHROME_EXTENSION_ID not set in .env — OAuth will fail until you add it. Find it at chrome://extensions.');
}

// Chrome intercepts these redirect URIs via launchWebAuthFlow — they never hit this server.
// Both must also be registered in Google Cloud Console / Azure AD.
const REDIRECT_URI = CHROME_EXTENSION_ID
    ? `https://${CHROME_EXTENSION_ID}.chromiumapp.org/oauth2callback`
    : 'http://localhost:3000/oauth2callback'; // fallback so server boots without the ID

const MS_REDIRECT_URI = CHROME_EXTENSION_ID
    ? `https://${CHROME_EXTENSION_ID}.chromiumapp.org/auth/microsoft/callback`
    : 'http://localhost:3000/auth/microsoft/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Please set CLIENT_ID and CLIENT_SECRET in environment.');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware 

/**
 * Reads the Bearer token from Authorization header.
 * Attaches req.userToken for downstream use.
 */
function requireAuth(req, res, next) {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ error: 'Missing Authorization header.' });
    req.userToken = token;
    next();
}

// Per-user OAuth token helpers

/**
 * Fetch this user's stored OAuth refresh tokens from the Python backend.
 */
async function getUserOAuthTokens(userToken) {
    const resp = await fetch(`${FLASK_BASE_URL}/auth/oauth-tokens`, {
        headers: { Authorization: `Bearer ${userToken}` },
    });
    if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch tokens: ${resp.status}`);
    }
    return resp.json(); // { googleRefreshToken, msRefreshToken }
}

/**
 * Save updated OAuth refresh tokens back to the Python backend for this user.
 */
async function saveUserOAuthTokens(userToken, tokens) {
    await fetch(`${FLASK_BASE_URL}/auth/oauth-tokens`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(tokens),
    });
}

/**
 * Build a Google OAuth2 client using this user's stored refresh token.
 */
async function getGoogleClientForUser(userToken) {
    const tokens = await getUserOAuthTokens(userToken);
    if (!tokens.googleRefreshToken) {
        throw new Error('NO_GOOGLE_TOKEN');
    }
    const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    client.setCredentials({ refresh_token: tokens.googleRefreshToken });
    return client;
}

// Microsoft OAuth helpers

const MS_SCOPES = [
    'offline_access',
    'https://graph.microsoft.com/Mail.Read',
].join(' ');

const MS_TOKEN_URL = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`;
const MS_AUTH_URL_BASE = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`;

// In-memory access token cache per user: { [userToken]: { accessToken, expiry } }
const msAccessTokenCache = {};

async function getMsAccessTokenForUser(userToken) {
    const cached = msAccessTokenCache[userToken];
    if (cached && Date.now() < cached.expiry - 30_000) return cached.accessToken;

    const tokens = await getUserOAuthTokens(userToken);
    if (!tokens.msRefreshToken) throw new Error('NO_MS_TOKEN');

    if (!MS_CLIENT_ID || !MS_CLIENT_SECRET) {
        throw new Error('MS_CLIENT_ID and MS_CLIENT_SECRET must be set in environment.');
    }

    const params = new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        refresh_token: tokens.msRefreshToken,
        grant_type: 'refresh_token',
        scope: MS_SCOPES,
    });

    const resp = await fetch(MS_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error_description || data.error || 'Failed to refresh MS token');

    msAccessTokenCache[userToken] = {
        accessToken: data.access_token,
        expiry: Date.now() + (data.expires_in || 3600) * 1000,
    };

    // If Microsoft rotated the refresh token, save the new one
    if (data.refresh_token) {
        await saveUserOAuthTokens(userToken, { msRefreshToken: data.refresh_token });
    }

    return data.access_token;
}

async function graphGet(path, token) {
    const resp = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `Graph error ${resp.status}`);
    return data;
}

// Helper: forward a parsed email to Flask to ai to mongodb

async function forwardToFlask(payload, userToken = '') {
    const resp = await fetch(FLASK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify(payload),
    });

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await resp.text();
        throw new Error(`Flask returned non-JSON (status ${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `Flask error ${resp.status}`);
    return data;
}

// Google Auth routes

/**
 * GET /auth/url
 * Returns the Google OAuth URL. Frontend passes its JWT so we can
 * tie the callback back to this user via a short-lived `state` param.
 * For simplicity we encode the userToken directly in state —
 * in production use a signed, expiring state value instead.
 */
// Preferences routes — proxy through to Flask so the JWT is forwarded correctly

app.get('/auth/preferences', requireAuth, async (req, res) => {
    try {
        const resp = await fetch(`${FLASK_BASE_URL}/auth/preferences`, {
            headers: { Authorization: `Bearer ${req.userToken}` },
        });
        const data = await resp.json();
        res.status(resp.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/auth/preferences', requireAuth, async (req, res) => {
    try {
        const resp = await fetch(`${FLASK_BASE_URL}/auth/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${req.userToken}`,
            },
            body: JSON.stringify(req.body),
        });
        const data = await resp.json();
        res.status(resp.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/url', requireAuth, (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: req.userToken, // carry userToken through OAuth round-trip
    });
    res.json({ url });
});

/**
 * POST /auth/google/exchange
 * Called by the Chrome extension background script after launchWebAuthFlow
 * resolves. The extension passes the full redirect URL it received; this
 * endpoint extracts the code, exchanges it for tokens, and stores them.
 *
 * Why POST instead of a browser redirect?
 * With chromiumapp.org as the redirect URI, Google sends the browser to
 * that URL — launchWebAuthFlow intercepts it and gives the URL back to the
 * extension. The server never receives a browser request; the extension must
 * forward the URL here manually.
 */
app.post('/auth/google/exchange', requireAuth, async (req, res) => {
    const { redirectUrl } = req.body;
    if (!redirectUrl) return res.status(400).json({ error: 'Missing redirectUrl' });

    let code;
    try {
        const parsed = new URL(redirectUrl);
        const error = parsed.searchParams.get('error');
        if (error) {
            return res.status(400).json({ error: `OAuth denied: ${error}` });
        }
        code = parsed.searchParams.get('code');
    } catch {
        return res.status(400).json({ error: 'Invalid redirectUrl' });
    }

    if (!code) return res.status(400).json({ error: 'Missing code in redirectUrl' });

    try {
        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        const { tokens } = await oauth2Client.getToken(code);

        const tokensToSave = {};

        if (tokens.refresh_token) {
            tokensToSave.googleRefreshToken = tokens.refresh_token;
        }

        // Fetch and store the user's Google email
        let email = null;
        if (tokens.access_token) {
            try {
                const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                });
                if (userInfoResp.ok) {
                    const userInfo = await userInfoResp.json();
                    if (userInfo.email) {
                        tokensToSave.googleEmail = userInfo.email;
                        email = userInfo.email;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch Google user email:', err);
            }
        }

        if (Object.keys(tokensToSave).length > 0) {
            await saveUserOAuthTokens(req.userToken, tokensToSave);
        }

        res.json({ success: true, email });
    } catch (err) {
        console.error('Google token exchange error:', err);
        res.status(500).json({ error: 'Failed to exchange code for tokens' });
    }
});

// Gmail routes

app.get('/latest', requireAuth, async (req, res) => {
    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const list = await gmail.users.messages.list({ userId: 'me', maxResults: 1 });
        if (!list.data?.messages?.length) return res.status(404).json({ error: 'No messages found' });

        const id = list.data.messages[0].id;
        const msgResp = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const message = msgResp.data;
        const plainBody = extractPlainBody(message);
        const subjectHeader = message.payload?.headers?.find(h => h.name.toLowerCase() === 'subject');

        const payload = {
            id,
            subject: subjectHeader?.value || '(no subject)',
            body: plainBody || message.snippet || '',
            snippet: message.snippet,
        };

        const flaskResult = await forwardToFlask(payload, req.userToken);
        res.json({ id, snippet: message.snippet, plainBody, flaskResult });
    } catch (err) {
        if (err.message === 'NO_GOOGLE_TOKEN') {
            return res.status(401).json({ error: 'NO_GOOGLE_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.get('/messages', requireAuth, async (req, res) => {
    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const { q, maxResults = 10 } = req.query;
        const resp = await gmail.users.messages.list({ userId: 'me', q, maxResults: parseInt(maxResults, 10) });
        res.json(resp.data);
    } catch (err) {
        if (err.message === 'NO_GOOGLE_TOKEN') {
            return res.status(401).json({ error: 'NO_GOOGLE_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.get('/message/:id', requireAuth, async (req, res) => {
    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const { id } = req.params;
        const { format = 'full' } = req.query;
        const resp = await gmail.users.messages.get({ userId: 'me', id, format });
        const message = resp.data;
        const plainBody = extractPlainBody(message);
        const subjectHeader = message.payload?.headers?.find(h => h.name.toLowerCase() === 'subject');
        const subject = subjectHeader?.value || message.snippet || '(no subject)';

        const payload = {
            id,
            subject,
            body: plainBody || message.snippet || '',
            snippet: message.snippet,
        };

        const flaskResult = await forwardToFlask(payload, req.userToken);
        res.json({ message, plainBody, subject, flaskResult });
    } catch (err) {
        if (err.message === 'NO_GOOGLE_TOKEN') {
            return res.status(401).json({ error: 'NO_GOOGLE_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.post('/fetch-and-process', requireAuth, async (req, res) => {
    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const { maxResults = 10, q } = req.body;
        const list = await gmail.users.messages.list({
            userId: 'me',
            maxResults: parseInt(maxResults, 10),
            ...(q && { q }),
        });

        if (!list.data?.messages?.length) {
            return res.status(404).json({ error: 'No messages found' });
        }

        const results = [];
        for (const { id } of list.data.messages) {
            const msgResp = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
            const message = msgResp.data;
            const plainBody = extractPlainBody(message);
            const subjectHeader = message.payload?.headers?.find(h => h.name.toLowerCase() === 'subject');

            const payload = {
                id,
                subject: subjectHeader?.value || '(no subject)',
                body: plainBody || message.snippet || '',
                snippet: message.snippet,
            };

            try {
                const flaskResult = await forwardToFlask(payload, req.userToken);
                results.push({ id, status: 'ok', flaskResult });
            } catch (flaskErr) {
                results.push({ id, status: 'error', error: flaskErr.message });
            }
        }

        res.json({ processed: results.length, results });
    } catch (err) {
        if (err.message === 'NO_GOOGLE_TOKEN') {
            return res.status(401).json({ error: 'NO_GOOGLE_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// Helper: forward a batch of emails to Flask in one request

async function forwardBatchToFlask(emails, userToken = '') {
    const resp = await fetch(`${FLASK_BASE_URL}/api/emails/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify(emails),
    });

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await resp.text();
        throw new Error(`Flask returned non-JSON (status ${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `Flask error ${resp.status}`);
    return data; // { message, count, results: [...25 summaries] }
}

// Gmail: fetch last 25 emails and process them in one batch prompt

app.post('/fetch-and-process-batch', requireAuth, async (req, res) => {
    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const { q } = req.body;
        const list = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 25,
            ...(q && { q }),
        });

        if (!list.data?.messages?.length) {
            return res.status(404).json({ error: 'No messages found' });
        }

        // Fetch all message details in parallel
        const messageDetails = await Promise.all(
            list.data.messages.map(({ id }) =>
                gmail.users.messages.get({ userId: 'me', id, format: 'full' }).then(r => ({ id, data: r.data }))
            )
        );

        const emails = messageDetails.map(({ id, data }) => {
            const plainBody = extractPlainBody(data);
            const subjectHeader = data.payload?.headers?.find(h => h.name.toLowerCase() === 'subject');
            return {
                id,
                subject: subjectHeader?.value || '(no subject)',
                body: plainBody || data.snippet || '',
                snippet: data.snippet,
            };
        });

        const batchResult = await forwardBatchToFlask(emails, req.userToken);
        res.json(batchResult);
    } catch (err) {
        if (err.message === 'NO_GOOGLE_TOKEN') {
            return res.status(401).json({ error: 'NO_GOOGLE_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});



app.get('/auth/microsoft/url', requireAuth, (req, res) => {
    if (!MS_CLIENT_ID) return res.status(500).json({ error: 'MS_CLIENT_ID not configured on server.' });
    const params = new URLSearchParams({
        client_id: MS_CLIENT_ID,
        response_type: 'code',
        redirect_uri: MS_REDIRECT_URI,
        scope: MS_SCOPES,
        response_mode: 'query',
        prompt: 'consent',
        state: req.userToken, // carry userToken through OAuth round-trip
    });
    res.json({ url: `${MS_AUTH_URL_BASE}?${params.toString()}` });
});

/**
 * POST /auth/microsoft/exchange
 * Same pattern as /auth/google/exchange — the Chrome extension calls this
 * after launchWebAuthFlow resolves with the chromiumapp.org redirect URL.
 */
app.post('/auth/microsoft/exchange', requireAuth, async (req, res) => {
    const { redirectUrl } = req.body;
    if (!redirectUrl) return res.status(400).json({ error: 'Missing redirectUrl' });

    let code;
    try {
        const parsed = new URL(redirectUrl);
        const error = parsed.searchParams.get('error');
        if (error) {
            const desc = parsed.searchParams.get('error_description') || error;
            return res.status(400).json({ error: `OAuth denied: ${desc}` });
        }
        code = parsed.searchParams.get('code');
    } catch {
        return res.status(400).json({ error: 'Invalid redirectUrl' });
    }

    if (!code) return res.status(400).json({ error: 'Missing code in redirectUrl' });

    const params = new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        code,
        redirect_uri: MS_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: MS_SCOPES,
    });

    try {
        const resp = await fetch(MS_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error_description || data.error || 'Token exchange failed');

        const tokensToSave = {};
        if (data.refresh_token) {
            tokensToSave.msRefreshToken = data.refresh_token;
        }

        let email = null;
        if (data.access_token) {
            // Cache the access token for this user right away
            msAccessTokenCache[req.userToken] = {
                accessToken: data.access_token,
                expiry: Date.now() + (data.expires_in || 3600) * 1000,
            };

            try {
                const graphResp = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: { Authorization: `Bearer ${data.access_token}` },
                });
                if (graphResp.ok) {
                    const userInfo = await graphResp.json();
                    email = userInfo.userPrincipalName || userInfo.mail || null;
                    if (email) tokensToSave.msEmail = email;
                }
            } catch (err) {
                console.error('Failed to fetch Microsoft user email:', err);
            }
        }

        if (Object.keys(tokensToSave).length > 0) {
            await saveUserOAuthTokens(req.userToken, tokensToSave);
        }

        res.json({ success: true, email });
    } catch (err) {
        console.error('Microsoft token exchange error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/microsoft/status', requireAuth, async (req, res) => {
    try {
        const tokens = await getUserOAuthTokens(req.userToken);
        const cached = msAccessTokenCache[req.userToken];
        const hasLiveToken = cached && Date.now() < cached.expiry - 30_000;
        res.json({ authenticated: !!tokens.msRefreshToken || hasLiveToken });
    } catch {
        res.json({ authenticated: false });
    }
});

// Endpoints to retrieve authenticated emails after OAuth
app.get('/auth/google-email', requireAuth, async (req, res) => {
    try {
        const tokens = await getUserOAuthTokens(req.userToken);
        res.json({ email: tokens.googleEmail || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/microsoft-email', requireAuth, async (req, res) => {
    try {
        const tokens = await getUserOAuthTokens(req.userToken);
        res.json({ email: tokens.msEmail || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/outlook/messages', requireAuth, async (req, res) => {
    try {
        const token = await getMsAccessTokenForUser(req.userToken);
        const { maxResults = 10, q } = req.query;
        let url = `/me/messages?$top=${maxResults}&$select=id,subject,bodyPreview,receivedDateTime`;
        if (q) url += `&$search="${encodeURIComponent(q)}"`;
        const data = await graphGet(url, token);
        res.json({ messages: (data.value || []).map(m => ({ id: m.id, subject: m.subject, snippet: m.bodyPreview })) });
    } catch (err) {
        if (err.message === 'NO_MS_TOKEN') {
            return res.status(401).json({ error: 'NO_MS_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.get('/outlook/message/:id', requireAuth, async (req, res) => {
    try {
        const token = await getMsAccessTokenForUser(req.userToken);
        const { id } = req.params;
        const msg = await graphGet(`/me/messages/${encodeURIComponent(id)}?$select=id,subject,bodyPreview,body,receivedDateTime,from`, token);
        const plainBody = msg.body?.contentType === 'text' ? msg.body.content : msg.bodyPreview || '';
        const subject = msg.subject || msg.bodyPreview || '(no subject)';

        const payload = { id, subject, body: plainBody, snippet: msg.bodyPreview || '' };
        const flaskResult = await forwardToFlask(payload, req.userToken);
        res.json({ message: msg, plainBody, subject, flaskResult });
    } catch (err) {
        if (err.message === 'NO_MS_TOKEN') {
            return res.status(401).json({ error: 'NO_MS_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.post('/outlook/fetch-and-process', requireAuth, async (req, res) => {
    try {
        const token = await getMsAccessTokenForUser(req.userToken);
        const { maxResults = 10, q } = req.body;
        let url = `/me/messages?$top=${maxResults}&$select=id,subject,bodyPreview,body,receivedDateTime`;
        if (q) url += `&$search="${encodeURIComponent(q)}"`;
        const data = await graphGet(url, token);

        if (!data.value?.length) return res.status(404).json({ error: 'No messages found' });

        const results = [];
        for (const msg of data.value) {
            const plainBody = msg.body?.contentType === 'text' ? msg.body.content : msg.bodyPreview || '';
            const payload = {
                id: msg.id,
                subject: msg.subject || '(no subject)',
                body: plainBody,
                snippet: msg.bodyPreview || '',
            };
            try {
                const flaskResult = await forwardToFlask(payload, req.userToken);
                results.push({ id: msg.id, status: 'ok', flaskResult });
            } catch (flaskErr) {
                results.push({ id: msg.id, status: 'error', error: flaskErr.message });
            }
        }

        res.json({ processed: results.length, results });
    } catch (err) {
        if (err.message === 'NO_MS_TOKEN') {
            return res.status(401).json({ error: 'NO_MS_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.post('/outlook/fetch-and-process-batch', requireAuth, async (req, res) => {
    try {
        const token = await getMsAccessTokenForUser(req.userToken);
        const { q } = req.body;
        let url = `/me/messages?$top=25&$select=id,subject,bodyPreview,body,receivedDateTime`;
        if (q) url += `&$search="${encodeURIComponent(q)}"`;
        const data = await graphGet(url, token);

        if (!data.value?.length) return res.status(404).json({ error: 'No messages found' });

        const emails = data.value.map(msg => {
            const plainBody = msg.body?.contentType === 'text' ? msg.body.content : msg.bodyPreview || '';
            return {
                id: msg.id,
                subject: msg.subject || '(no subject)',
                body: plainBody,
                snippet: msg.bodyPreview || '',
            };
        });

        const batchResult = await forwardBatchToFlask(emails, req.userToken);
        res.json(batchResult);
    } catch (err) {
        if (err.message === 'NO_MS_TOKEN') {
            return res.status(401).json({ error: 'NO_MS_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});



app.post('/calendar/add-event', requireAuth, async (req, res) => {
    const { title, date, location } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        const eventDate = date || new Date().toISOString().split('T')[0];
        const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: title,
                location: location || '',
                start: { date: eventDate },
                end: { date: eventDate },
            },
        });
        res.json({ success: true, eventId: event.data.id, htmlLink: event.data.htmlLink });
    } catch (err) {
        if (err.message === 'NO_GOOGLE_TOKEN') {
            return res.status(401).json({ error: 'NO_GOOGLE_TOKEN' });
        }
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// Helpers

function extractPlainBody(message) {
    function findPlain(parts = []) {
        for (const p of parts) {
            if (p.mimeType === 'text/plain' && p.body?.data) return base64UrlToUtf8(p.body.data);
            if (p.parts) { const found = findPlain(p.parts); if (found) return found; }
        }
        return null;
    }
    if (!message.payload) return null;
    if (message.payload.body?.data) return base64UrlToUtf8(message.payload.body.data);
    if (message.payload.parts) return findPlain(message.payload.parts);
    return null;
}

function base64UrlToUtf8(b64url = '') {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf8');
}

function successHtml() {
    return `<!doctype html><html><body>
        <p>Auth successful. You can close this window.</p>
        <script>
            try { window.opener && window.opener.postMessage('oauth_success','*'); } catch(e){}
            setTimeout(()=>{ window.close(); }, 1000);
        </script>
        </body></html>`;
}

// ——— Sync emails: fetch last 50 from each connected provider ———

app.post('/sync-emails', requireAuth, async (req, res) => {
    const allEmails = [];

    // — Gmail —
    try {
        const authClient = await getGoogleClientForUser(req.userToken);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const list = await gmail.users.messages.list({ userId: 'me', maxResults: 50 });
        if (list.data?.messages?.length) {
            const details = await Promise.all(
                list.data.messages.map(({ id }) =>
                    gmail.users.messages.get({ userId: 'me', id, format: 'full' })
                        .then(r => ({ id, data: r.data }))
                )
            );

            for (const { id, data } of details) {
                const plainBody = extractPlainBody(data);
                const headers = data.payload?.headers || [];
                const getH = (name) => (headers.find(h => h.name.toLowerCase() === name.toLowerCase()) || {}).value || '';

                allEmails.push({
                    id,
                    subject: getH('subject') || '(no subject)',
                    body: plainBody || data.snippet || '',
                    snippet: data.snippet || '',
                    sender: getH('from'),
                    receivedAt: data.internalDate
                        ? new Date(parseInt(data.internalDate, 10)).toISOString()
                        : getH('date'),
                    source: 'google',
                });
            }
        }
    } catch (err) {
        if (err.message !== 'NO_GOOGLE_TOKEN') {
            console.error('[sync] Gmail error:', err.message);
        }
    }

    // — Outlook —
    try {
        const token = await getMsAccessTokenForUser(req.userToken);
        const data = await graphGet(
            '/me/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,bodyPreview,body,receivedDateTime,from',
            token,
        );

        if (data.value?.length) {
            for (const msg of data.value) {
                const plainBody = msg.body?.contentType === 'text' ? msg.body.content : msg.bodyPreview || '';
                const fromAddr = msg.from?.emailAddress;
                allEmails.push({
                    id: msg.id,
                    subject: msg.subject || '(no subject)',
                    body: plainBody,
                    snippet: msg.bodyPreview || '',
                    sender: fromAddr ? `${fromAddr.name || ''} <${fromAddr.address || ''}>`.trim() : '',
                    receivedAt: msg.receivedDateTime || '',
                    source: 'outlook',
                });
            }
        }
    } catch (err) {
        if (err.message !== 'NO_MS_TOKEN') {
            console.error('[sync] Outlook error:', err.message);
        }
    }

    if (allEmails.length === 0) {
        return res.json({ message: 'No connected email accounts or no messages found.', count: 0, results: [] });
    }

    // Forward ALL emails to Flask in a single request — Flask handles
    // deduplication first, then sends only truly-new emails to AI in one prompt.
    try {
        const batchResult = await forwardBatchToFlask(allEmails, req.userToken);
        const results = batchResult.results || [];
        res.json({ message: `Synced ${results.length} emails.`, count: results.length, results });
    } catch (err) {
        console.error('[sync] Batch error:', err.message);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));