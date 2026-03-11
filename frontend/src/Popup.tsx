import React, { useState, useEffect } from "react";

const BACKEND_BASE = "http://localhost:3000";

type Provider = "gmail" | "outlook";

function getToken(): string {
  return localStorage.getItem("tagit_token") || "";
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getToken()}` };
}

const Popup: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [provider, setProvider] = useState<Provider>("gmail");
  const [loading, setLoading] = useState(false);
  const [calLoading, setCalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [calStatus, setCalStatus] = useState<string | null>(null);
  const [msAuthed, setMsAuthed] = useState(false);

  // Check Microsoft auth status on mount / provider switch
  useEffect(() => {
    if (provider === "outlook") {
      fetch(`${BACKEND_BASE}/auth/microsoft/status`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setMsAuthed(!!d.authenticated))
        .catch(() => setMsAuthed(false));
    }
  }, [provider]);

  function resetState() {
    setError(null);
    setMessage(null);
    setSubject(null);
    setCalStatus(null);
  }

  async function processWithAI(emailSubject: string, emailBody: string, emailId: string) {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          originalId: emailId,
        }),
      });
      if (!res.ok) throw new Error("Python server error");
      const data = await res.json();
      return data.ai_summary;
    } catch (err) {
      console.error("AI Pipeline error:", err);
      return "Failed to generate AI summary. Ensure Python server is running on port 8000.";
    }
  }

  function switchProvider(p: Provider) {
    setProvider(p);
    resetState();
  }

  // Open OAuth popup and wait for success message
  function openAuthPopup(url: string): Promise<void> {
    return new Promise((resolve) => {
      const win = window.open(url, "_blank", "width=500,height=700");
      const handler = (e: MessageEvent) => {
        if (e.data === "oauth_success") {
          window.removeEventListener("message", handler);
          win?.close();
          resolve();
        }
      };
      window.addEventListener("message", handler);
      setTimeout(() => { window.removeEventListener("message", handler); resolve(); }, 120_000);
    });
  }

  async function signInMicrosoft() {
    setLoading(true);
    resetState();
    try {
      const resp = await fetch(`${BACKEND_BASE}/auth/microsoft/url`, { headers: authHeaders() });
      if (!resp.ok) {
        setError("Could not get Microsoft auth URL. Is MS_CLIENT_ID set on the server?");
        return;
      }
      const { url } = await resp.json();
      await openAuthPopup(url);
      setMsAuthed(true);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function showLatestEmail() {
    setLoading(true);
    resetState();
    try {
      if (provider === "gmail") {
        await fetchGmailLatest();
      } else {
        await fetchOutlookLatest();
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchGmailLatest() {
    const listResp = await fetch(`${BACKEND_BASE}/messages?maxResults=1`, {
      headers: authHeaders(),
    });

    if (listResp.status === 401) {
      const data = await listResp.json().catch(() => ({}));
      if (data.error === "NO_GOOGLE_TOKEN") {
        // User hasn't linked Google yet — kick off OAuth
        const authUrlResp = await fetch(`${BACKEND_BASE}/auth/url`, { headers: authHeaders() });
        if (authUrlResp.ok) {
          const { url } = await authUrlResp.json();
          await openAuthPopup(url);
          setError("Google account linked! Click the button again to load your email.");
        } else {
          setError(`Could not get Google auth URL: ${authUrlResp.status}`);
        }
        return;
      }
      setError("Session expired. Please log in again.");
      return;
    }

    if (!listResp.ok) {
      setError(`Failed to list messages: ${listResp.status}`);
      return;
    }

    const listData = await listResp.json();
    if (!listData?.messages?.length) { setError("No messages found."); return; }

    const id = listData.messages[0].id;
    const msgResp = await fetch(`${BACKEND_BASE}/message/${id}`, { headers: authHeaders() });
    if (!msgResp.ok) { setError(`Failed to fetch message: ${msgResp.status}`); return; }
    const msgData = await msgResp.json();

    const rawSubject = msgData.subject || msgData.message?.snippet || "No Subject";
    const rawBody = msgData.plainBody || msgData.message?.snippet || "";

    setSubject(rawSubject);
    setMessage("Generating AI Summary...");
    const summary = await processWithAI(rawSubject, rawBody, id);
    setMessage(summary);
  }

  async function fetchOutlookLatest() {
    if (!msAuthed) {
      await signInMicrosoft();
      setError("Signed in! Click the button again to load your email.");
      return;
    }

    const listResp = await fetch(`${BACKEND_BASE}/outlook/messages?maxResults=1`, {
      headers: authHeaders(),
    });

    if (listResp.status === 401) {
      const data = await listResp.json().catch(() => ({}));
      if (data.error === "NO_MS_TOKEN") {
        setMsAuthed(false);
        await signInMicrosoft();
        setError("Signed in! Click the button again to load your email.");
      } else {
        setError("Session expired. Please log in again.");
      }
      return;
    }

    if (!listResp.ok) {
      const data = await listResp.json().catch(() => ({}));
      setError(`Outlook error: ${data.error || listResp.status}`);
      return;
    }

    const listData = await listResp.json();
    if (!listData?.messages?.length) { setError("No messages found."); return; }

    const id = listData.messages[0].id;
    const msgResp = await fetch(`${BACKEND_BASE}/outlook/message/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
    });
    if (!msgResp.ok) { setError(`Failed to fetch message: ${msgResp.status}`); return; }
    const msgData = await msgResp.json();

    const rawSubject = msgData.subject || msgData.message?.bodyPreview || "No Subject";
    const rawBody = msgData.plainBody || msgData.message?.bodyPreview || "";

    setSubject(rawSubject);
    setMessage("Generating AI Summary...");
    const summary = await processWithAI(rawSubject, rawBody, id);
    setMessage(summary);
  }

  async function addToCalendar() {
    if (!subject) return;
    setCalLoading(true);
    setCalStatus(null);
    setError(null);
    try {
      const resp = await fetch(`${BACKEND_BASE}/calendar/add-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: subject }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        if (resp.status === 401 && data.error === "NO_GOOGLE_TOKEN") {
          const authUrlResp = await fetch(`${BACKEND_BASE}/auth/url`, { headers: authHeaders() });
          if (authUrlResp.ok) {
            const { url } = await authUrlResp.json();
            await openAuthPopup(url);
            setError("Google account linked. Try adding to calendar again.");
          }
        } else {
          setError(`Calendar error: ${data.error}`);
        }
        return;
      }
      setCalStatus(data.htmlLink ? `Added! Open in Google Calendar` : "Added to today's calendar!");
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setCalLoading(false);
    }
  }

  return (
    <div className="p-4 min-w-[320px]">
      {/* Header with logout */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">TagIt</h1>
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Log out
          </button>
        )}
      </div>

      {/* Provider toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchProvider("gmail")}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
            provider === "gmail"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Gmail
        </button>
        <button
          onClick={() => switchProvider("outlook")}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
            provider === "outlook"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Outlook
        </button>
      </div>

      {/* Outlook sign-in button (shown when not authed) */}
      {provider === "outlook" && !msAuthed && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <p className="mb-2 font-medium">Sign in to your Microsoft account to access Outlook.</p>
          <button
            onClick={signInMicrosoft}
            disabled={loading}
            className="bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Opening sign-in..." : "Sign in with Microsoft"}
          </button>
        </div>
      )}

      {/* Authed Outlook indicator */}
      {provider === "outlook" && msAuthed && (
        <div className="mb-3 flex items-center gap-2 text-sm text-green-700">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          Connected to Microsoft
          <button
            onClick={signInMicrosoft}
            className="ml-auto text-xs text-gray-500 underline hover:text-gray-700"
          >
            Switch account
          </button>
        </div>
      )}

      {/* Main action button */}
      <button
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={showLatestEmail}
        disabled={loading}
      >
        {loading ? "Loading..." : `Show latest ${provider === "gmail" ? "Gmail" : "Outlook"} email`}
      </button>

      {error && (
        <div className="mt-4 text-red-600 whitespace-pre-wrap text-sm">{error}</div>
      )}

      {message && (
        <>
          {subject && (
            <div className="mt-3 text-sm font-semibold text-gray-700 truncate" title={subject}>
              Subject: {subject}
            </div>
          )}
          <div className="mt-2 p-3 border rounded bg-gray-50 max-h-64 overflow-auto whitespace-pre-wrap text-sm">
            {message}
          </div>

          <button
            className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            onClick={addToCalendar}
            disabled={calLoading || !subject}
          >
            {calLoading ? "Adding..." : "Add email title to today's calendar"}
          </button>

          {calStatus && (
            <div className="mt-2 text-green-700 font-medium text-sm">{calStatus}</div>
          )}
        </>
      )}
    </div>
  );
};

export default Popup;