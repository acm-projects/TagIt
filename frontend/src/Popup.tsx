import React, { useState } from "react";

const BACKEND_BASE = "http://localhost:3000";

const Popup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [calLoading, setCalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [calStatus, setCalStatus] = useState<string | null>(null);

  async function showLatestEmail() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setSubject(null);
    setCalStatus(null);
    try {
      const listResp = await fetch(`${BACKEND_BASE}/messages?maxResults=1`);
      if (!listResp.ok) {
        const authUrlResp = await fetch(`${BACKEND_BASE}/auth/url`);
        if (authUrlResp.ok) {
          const { url } = await authUrlResp.json();
          window.open(url, "_blank", "width=500,height=700");
          setError("Opened Google sign-in in a new window. After granting access, close it and click the button again.");
        } else {
          setError(`Auth URL error: ${listResp.status}`);
        }
        return;
      }

      const listData = await listResp.json();
      if (!listData?.messages?.length) {
        setError("No messages found.");
        return;
      }

      const id = listData.messages[0].id;
      const msgResp = await fetch(`${BACKEND_BASE}/message/${id}`);
      if (!msgResp.ok) {
        setError(`Failed to fetch message: ${msgResp.status}`);
        return;
      }
      const msgData = await msgResp.json();
      const body = msgData.plainBody || msgData.message?.snippet || JSON.stringify(msgData.message, null, 2);
      setMessage(body);
      setSubject(msgData.subject || msgData.message?.snippet || null);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function addToCalendar() {
    if (!subject) return;
    setCalLoading(true);
    setCalStatus(null);
    setError(null);
    try {
      const resp = await fetch(`${BACKEND_BASE}/calendar/add-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: subject }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        // If it's an auth error, prompt re-auth (Calendar scope may not be granted yet)
        if (resp.status === 500 && data.error?.includes('invalid_grant')) {
          const authUrlResp = await fetch(`${BACKEND_BASE}/auth/url`);
          if (authUrlResp.ok) {
            const { url } = await authUrlResp.json();
            window.open(url, "_blank", "width=500,height=700");
            setError("Re-authorization needed for Calendar access. Sign in again, then retry.");
          }
        } else {
          setError(`Calendar error: ${data.error}`);
        }
        return;
      }
      setCalStatus(`Added to today's calendar! `);
      // Optionally open the event
      if (data.htmlLink) {
        setCalStatus(`Added! `);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setCalLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">TagIt</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={showLatestEmail}
        disabled={loading}
      >
        {loading ? "Loading…" : "Show latest email"}
      </button>

      {error && (
        <div className="mt-4 text-red-600 whitespace-pre-wrap">{error}</div>
      )}

      {message && (
        <>
          {subject && (
            <div className="mt-3 text-sm font-semibold text-gray-700">
              Subject: {subject}
            </div>
          )}
          <div className="mt-2 p-3 border rounded bg-gray-50 max-h-64 overflow-auto whitespace-pre-wrap">
            {message}
          </div>

          <button
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={addToCalendar}
            disabled={calLoading || !subject}
          >
            {calLoading ? "Adding…" : "Add email title to today's calendar"}
          </button>

          {calStatus && (
            <div className="mt-2 text-green-700 font-medium">{calStatus}</div>
          )}
        </>
      )}
    </div>
  );
};

export default Popup;