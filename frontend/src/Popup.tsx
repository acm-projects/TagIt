import React, { useState } from "react";

const BACKEND_BASE = "http://localhost:3000"; // adjust if your backend runs elsewhere

const Popup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function showLatestEmail() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      // Try listing messages (1)
      const listResp = await fetch(`${BACKEND_BASE}/messages?maxResults=1`);
      if (!listResp.ok) {
        // If backend isn't authorized, request auth URL and open it
        const authUrlResp = await fetch(`${BACKEND_BASE}/auth/url`);
        if (authUrlResp.ok) {
          const { url } = await authUrlResp.json();
          // Open the Google consent screen in a new window/tab
          window.open(url, "_blank", "width=500,height=700");
          setError(
            "Opened Google sign-in in a new window. After granting access, close it and click the button again."
          );
        } else {
          const text = await authUrlResp.text();
          setError(`Auth URL error: ${authUrlResp.status} ${text}`);
        }
        return;
      }

      const listData = await listResp.json();
      if (!listData || !listData.messages || listData.messages.length === 0) {
        setError("No messages found for the account or authorization required.");
        return;
      }

      const id = listData.messages[0].id;
      const msgResp = await fetch(`${BACKEND_BASE}/message/${id}`);
      if (!msgResp.ok) {
        setError(`Failed to fetch message: ${msgResp.status}`);
        return;
      }
      const msgData = await msgResp.json();
      const body = msgData.plainBody || (msgData.message && msgData.message.snippet) || JSON.stringify(msgData.message, null, 2);
      setMessage(body);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
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
        <div className="mt-4 p-3 border rounded bg-gray-50 max-h-64 overflow-auto whitespace-pre-wrap">
          {message}
        </div>
      )}
    </div>
  );
};

export default Popup;