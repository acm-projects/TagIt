// set CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN in environment for Google
// set MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID, MS_REFRESH_TOKEN for Microsoft/Outlook
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
    REDIRECT_URI = 'http://localhost:3000/oauth2callback',
    REFRESH_TOKEN,
    // Microsoft / Outlook
    MS_CLIENT_ID,
    MS_CLIENT_SECRET,
    MS_TENANT_ID = 'common',
    MS_REDIRECT_URI = 'http://localhost:3000/auth/microsoft/callback',
    FLASK_API_URL = 'http://localhost:8000/api/emails',
    PORT = 3000,
} = process.env;

let MS_REFRESH_TOKEN = process.env.MS_REFRESH_TOKEN || null;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Please set CLIENT_ID and CLIENT_SECRET in environment.');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// ─── Google OAuth ────────────────────────────────────────────────────────────

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
if (REFRESH_TOKEN) oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

function base64UrlToUtf8(b64url = '') {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf8');
}

function writeEnvKey(key, value) {
    const envPath = path.join(__dirname, '.env');  // ← __dirname instead of relative path
    console.log('Writing token to:', envPath);
    let content = '';
    try { content = fs.readFileSync(envPath, 'utf8'); } catch (_) {}
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    content = regex.test(content) ? content.replace(regex, line) : content + `\n${line}\n`;
    fs.writeFileSync(envPath, content, 'utf8');
}

// ─── Microsoft OAuth helpers ─────────────────────────────────────────────────

const MS_SCOPES = [
    'offline_access',
    'https://graph.microsoft.com/Mail.Read',
].join(' ');

const MS_TOKEN_URL = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`;
const MS_AUTH_URL_BASE = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`;

let msAccessToken = null;
let msTokenExpiry = 0;

async function getMsAccessToken() {
    if (msAccessToken && Date.now() < msTokenExpiry - 30_000) return msAccessToken;
    if (!MS_REFRESH_TOKEN) throw new Error('MS_REFRESH_TOKEN not set. Please authenticate with Microsoft first.');

    if (!MS_CLIENT_ID || !MS_CLIENT_SECRET) {
        throw new Error('MS_CLIENT_ID and MS_CLIENT_SECRET must be set in environment.');
    }

    const params = new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        refresh_token: MS_REFRESH_TOKEN,
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

    msAccessToken = data.access_token;
    msTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
    if (data.refresh_token) {
        MS_REFRESH_TOKEN = data.refresh_token;
        writeEnvKey('MS_REFRESH_TOKEN', data.refresh_token);
    }
    return msAccessToken;
}

async function graphGet(path, token) {
    const resp = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `Graph error ${resp.status}`);
    return data;
}

// ─── Helper: forward a parsed email to Flask → AI → MongoDB ─────────────────

async function forwardToFlask(payload) {
    const resp = await fetch(FLASK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    // Check content type before parsing JSON
    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await resp.text();
        throw new Error(`Flask returned non-JSON (status ${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `Flask error ${resp.status}`);
    return data;
}

// ─── Google Auth routes ───────────────────────────────────────────────────────

app.get('/auth/url', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];
    const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'select_account' });
    res.json({ url });
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        if (tokens.refresh_token) {
            writeEnvKey('REFRESH_TOKEN', tokens.refresh_token);
            process.env.REFRESH_TOKEN = tokens.refresh_token; 
        }
        res.send(successHtml());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to exchange code for tokens' });
    }
});

// ─── Gmail routes ─────────────────────────────────────────────────────────────

// GET /latest — fetch the single most recent Gmail message and forward to Flask
app.get('/latest', async (req, res) => {
    if (!REFRESH_TOKEN) return res.status(400).json({ error: 'REFRESH_TOKEN not set.' });
    try {
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

        // Forward to Flask → Gemini → MongoDB
        const flaskResult = await forwardToFlask(payload);

        res.json({ id, snippet: message.snippet, plainBody, flaskResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// GET /messages — list Gmail messages (no forwarding, listing only)
app.get('/messages', async (req, res) => {
    try {
        const { q, maxResults = 10 } = req.query;
        const resp = await gmail.users.messages.list({ userId: 'me', q, maxResults: parseInt(maxResults, 10) });
        res.json(resp.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// GET /message/:id — fetch a single Gmail message and forward to Flask
app.get('/message/:id', async (req, res) => {
    try {
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

        // Forward to Flask → Gemini → MongoDB
        const flaskResult = await forwardToFlask(payload);

        res.json({ message, plainBody, subject, flaskResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// POST /fetch-and-process — bulk fetch Gmail messages and forward each to Flask
app.post('/fetch-and-process', async (req, res) => {
    try {
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
                const flaskResult = await forwardToFlask(payload);
                results.push({ id, status: 'ok', flaskResult });
            } catch (flaskErr) {
                console.error(`Flask error for message ${id}:`, flaskErr.message);
                results.push({ id, status: 'error', error: flaskErr.message });
            }
        }

        res.json({ processed: results.length, results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// ─── Microsoft / Outlook routes ───────────────────────────────────────────────

app.get('/auth/microsoft/url', (req, res) => {
    if (!MS_CLIENT_ID) return res.status(500).json({ error: 'MS_CLIENT_ID not configured on server.' });
    const params = new URLSearchParams({
        client_id: MS_CLIENT_ID,
        response_type: 'code',
        redirect_uri: MS_REDIRECT_URI,
        scope: MS_SCOPES,
        response_mode: 'query',
        prompt: 'consent',
    });
    const url = `${MS_AUTH_URL_BASE}?${params.toString()}`;
    res.json({ url });
});

app.get('/auth/microsoft/callback', async (req, res) => {
    const { code, error, error_description } = req.query;
    if (error) return res.status(400).send(`Auth error: ${error_description || error}`);
    if (!code) return res.status(400).send('Missing code');

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

        msAccessToken = data.access_token;
        msTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
        if (data.refresh_token) {
            MS_REFRESH_TOKEN = data.refresh_token;
            writeEnvKey('MS_REFRESH_TOKEN', data.refresh_token);
        }
        res.send(successHtml());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/microsoft/status', (req, res) => {
    res.json({ authenticated: !!MS_REFRESH_TOKEN || (!!msAccessToken && Date.now() < msTokenExpiry - 30_000) });
});

// GET /outlook/messages — list Outlook messages (no forwarding, listing only)
app.get('/outlook/messages', async (req, res) => {
    try {
        const token = await getMsAccessToken();
        const { maxResults = 10, q } = req.query;
        let url = `/me/messages?$top=${maxResults}&$select=id,subject,snippet,bodyPreview,receivedDateTime`;
        if (q) url += `&$search="${encodeURIComponent(q)}"`;
        const data = await graphGet(url, token);
        res.json({ messages: (data.value || []).map(m => ({ id: m.id, subject: m.subject, snippet: m.bodyPreview })) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// GET /outlook/message/:id — fetch a single Outlook message and forward to Flask
app.get('/outlook/message/:id', async (req, res) => {
    try {
        const token = await getMsAccessToken();
        const { id } = req.params;
        const msg = await graphGet(`/me/messages/${encodeURIComponent(id)}?$select=id,subject,bodyPreview,body,receivedDateTime,from`, token);
        const plainBody = msg.body?.contentType === 'text'
            ? msg.body.content
            : msg.bodyPreview || '';
        const subject = msg.subject || msg.bodyPreview || '(no subject)';

        const payload = {
            id,
            subject,
            body: plainBody,
            snippet: msg.bodyPreview || '',
        };

        // Forward to Flask → Gemini → MongoDB
        const flaskResult = await forwardToFlask(payload);

        res.json({ message: msg, plainBody, subject, flaskResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// POST /outlook/fetch-and-process — bulk fetch Outlook messages and forward each to Flask
app.post('/outlook/fetch-and-process', async (req, res) => {
    try {
        const token = await getMsAccessToken();
        const { maxResults = 10, q } = req.body;

        let url = `/me/messages?$top=${maxResults}&$select=id,subject,bodyPreview,body,receivedDateTime`;
        if (q) url += `&$search="${encodeURIComponent(q)}"`;
        const data = await graphGet(url, token);

        if (!data.value?.length) {
            return res.status(404).json({ error: 'No messages found' });
        }

        const results = [];

        for (const msg of data.value) {
            const plainBody = msg.body?.contentType === 'text'
                ? msg.body.content
                : msg.bodyPreview || '';

            const payload = {
                id: msg.id,
                subject: msg.subject || '(no subject)',
                body: plainBody,
                snippet: msg.bodyPreview || '',
            };

            try {
                const flaskResult = await forwardToFlask(payload);
                results.push({ id: msg.id, status: 'ok', flaskResult });
            } catch (flaskErr) {
                console.error(`Flask error for message ${msg.id}:`, flaskErr.message);
                results.push({ id: msg.id, status: 'error', error: flaskErr.message });
            }
        }

        res.json({ processed: results.length, results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// ─── Google Calendar ──────────────────────────────────────────────────────────

app.post('/calendar/add-event', async (req, res) => {
    const { title, date } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const eventDate = date || new Date().toISOString().split('T')[0];
    try {
        const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: title,
                start: { date: eventDate },
                end: { date: eventDate },
            },
        });
        res.json({ success: true, eventId: event.data.id, htmlLink: event.data.htmlLink });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function successHtml() {
    return `<!doctype html><html><body>
        <p>Auth successful. You can close this window.</p>
        <script>
            try { window.opener && window.opener.postMessage('oauth_success','*'); } catch(e){}
            setTimeout(()=>{ window.close(); }, 1000);
        </script>
        </body></html>`;
}

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));