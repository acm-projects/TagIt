// set CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, and optionally PORT in environment (.env supported)
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
    PORT = 3000,
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Please set CLIENT_ID and CLIENT_SECRET in environment.');
    process.exit(1);
}

const app = express();
app.use(cors()); // allow cross-origin requests from frontend dev server
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
if (REFRESH_TOKEN) oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

function base64UrlToUtf8(b64url = '') {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(b64, 'base64').toString('utf8');
}

// GET /latest returns the most recent email's plain body or snippet
app.get('/latest', async (req, res) => {
    if (!REFRESH_TOKEN) {
        return res.status(400).json({ error: 'REFRESH_TOKEN not set. Set REFRESH_TOKEN in env to allow server-to-server access.' });
    }

    try {
        const list = await gmail.users.messages.list({ userId: 'me', maxResults: 1 });
        if (!list.data || !list.data.messages || list.data.messages.length === 0) {
            return res.status(404).json({ error: 'No messages found' });
        }

        const id = list.data.messages[0].id;
        const msgResp = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const message = msgResp.data;

        function findPlain(parts = []) {
            for (const p of parts) {
                if (p.mimeType === 'text/plain' && p.body && p.body.data) {
                    return base64UrlToUtf8(p.body.data);
                }
                if (p.parts) {
                    const found = findPlain(p.parts);
                    if (found) return found;
                }
            }
            return null;
        }

        let plainBody = null;
        if (message.payload) {
            if (message.payload.body && message.payload.body.data) {
                plainBody = base64UrlToUtf8(message.payload.body.data);
            } else if (message.payload.parts) {
                plainBody = findPlain(message.payload.parts);
            }
        }

        res.json({ id, snippet: message.snippet, plainBody });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

// Provide an auth URL so the frontend can open Google consent screen
app.get('/auth/url', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
    const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
    res.json({ url });
});

// OAuth2 callback: exchange code for tokens and persist refresh token to .env for local dev convenience
app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        if (tokens.refresh_token) {
            writeEnvKey('REFRESH_TOKEN', tokens.refresh_token);
        }
        // Close the window and notify opener if present
        const html = `<!doctype html><html><body>
            <p>Auth successful. You can close this window.</p>
            <script>
                try { window.opener && window.opener.postMessage('oauth_success','*'); } catch(e){}
                setTimeout(()=>{ window.close(); }, 1000);
            </script>
            </body></html>`;
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to exchange code for tokens' });
    }
});

// List message IDs (used by frontend)
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

// Get a full message by id (used by frontend)
app.get('/message/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'full' } = req.query;
        const resp = await gmail.users.messages.get({ userId: 'me', id, format });
        const message = resp.data;
        function findPlain(parts = []) {
            for (const p of parts) {
                if (p.mimeType === 'text/plain' && p.body && p.body.data) return base64UrlToUtf8(p.body.data);
                if (p.parts) {
                    const found = findPlain(p.parts);
                    if (found) return found;
                }
            }
            return null;
        }
        let plainBody = null;
        if (message.payload) {
            if (message.payload.body && message.payload.body.data) plainBody = base64UrlToUtf8(message.payload.body.data);
            else if (message.payload.parts) plainBody = findPlain(message.payload.parts);
        }
        res.json({ message, plainBody });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || String(err) });
    }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));