import React, { useState, useEffect } from "react";

const BACKEND_BASE = "http://localhost:3000";

type Provider = "gmail" | "outlook";

interface EmailResult {
  id: string;
  subject: string;
  summary: string;
  assignedCategory: string;
  priorityLevel: number;
  uiBadges: string[];
  tasks: string[];
  deadlines: string[];
  events: string[];
  location: string;
  time: string;
  isSpam?: boolean;
  spamReason?: string;
  mongo_id?: string;
  cached?: boolean;
}

function getToken(): string {
  return localStorage.getItem("tagit_token") || "";
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getToken()}` };
}

const PRIORITY_CONFIG: Record<number, { label: string; color: string; dot: string }> = {
  1: { label: "Critical", color: "text-red-600 bg-red-50 border-red-200",   dot: "bg-red-500" },
  2: { label: "High",     color: "text-orange-600 bg-orange-50 border-orange-200", dot: "bg-orange-400" },
  3: { label: "Medium",   color: "text-yellow-700 bg-yellow-50 border-yellow-200", dot: "bg-yellow-400" },
  4: { label: "Low",      color: "text-gray-500 bg-gray-50 border-gray-200", dot: "bg-gray-300" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Internship":           "bg-violet-100 text-violet-700 border-violet-200",
  "Job Offer":            "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Meeting Request":      "bg-blue-100 text-blue-700 border-blue-200",
  "Assigments/Deadlines": "bg-rose-100 text-rose-700 border-rose-200",
  "Newsletter":           "bg-amber-100 text-amber-700 border-amber-200",
  "Spam":                 "bg-red-100 text-red-700 border-red-200",
  "Other":                "bg-gray-100 text-gray-600 border-gray-200",
};

const EmailCard: React.FC<{ email: EmailResult; index: number; onAddCalendar: (e: EmailResult) => void }> = ({
  email, index, onAddCalendar,
}) => {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_CONFIG[email.priorityLevel] ?? PRIORITY_CONFIG[4];
  const catColor = CATEGORY_COLORS[email.assignedCategory] ?? CATEGORY_COLORS["Other"];
  const hasDetails = email.tasks.length > 0 || email.deadlines.length > 0 || email.events.length > 0 || email.location || email.time;

  return (
    <div
      className="group border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Priority stripe */}
      <div className={`h-0.5 w-full ${priority.dot}`} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Index number */}
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>

          <div className="flex-1 min-w-0">
            {/* Subject + cached pill */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-800 truncate leading-snug flex-1" title={email.subject}>
                {email.subject}
              </p>
              {email.cached && (
                <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium border border-gray-200" title="Loaded from database cache">
                  cached
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${catColor}`}>
                {email.assignedCategory}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${priority.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
              {email.uiBadges.filter(b => b !== email.assignedCategory).map((badge, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  {badge}
                </span>
              ))}
            </div>

            {/* Summary */}
            <p className="mt-2 text-xs text-gray-600 leading-relaxed line-clamp-2">
              {email.summary}
            </p>
          </div>
        </div>

        {/* Expand / collapse */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-3 ml-9 text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            {expanded ? "▲ Less" : "▼ Details"}
          </button>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 ml-9 space-y-2 border-t border-gray-100 pt-3">
            {email.tasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tasks</p>
                <ul className="space-y-0.5">
                  {email.tasks.map((t, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-2">
                      <span className="text-blue-400 mt-0.5">›</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {email.deadlines.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Deadlines</p>
                <ul className="space-y-0.5">
                  {email.deadlines.map((d, i) => (
                    <li key={i} className="text-xs text-rose-600 flex gap-2">
                      <span>⏰</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {email.events.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Events</p>
                <ul className="space-y-0.5">
                  {email.events.map((ev, i) => (
                    <li key={i} className="text-xs text-gray-700 flex gap-2">
                      <span>📅</span>{ev}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(email.location || email.time) && (
              <div className="flex flex-wrap gap-3">
                {email.location && (
                  <span className="text-xs text-gray-600">📍 {email.location}</span>
                )}
                {email.time && (
                  <span className="text-xs text-gray-600">🕐 {new Date(email.time).toLocaleString()}</span>
                )}
              </div>
            )}
            {(email.events.length > 0 || email.time) && (
              <button
                onClick={() => onAddCalendar(email)}
                className="mt-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                + Add to Calendar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Popup: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [provider, setProvider] = useState<Provider>("gmail");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msAuthed, setMsAuthed] = useState(false);
  const [emails, setEmails] = useState<EmailResult[]>([]);
  const [calStatus, setCalStatus] = useState<Record<string, string>>({});
  const [filterCat, setFilterCat] = useState<string>("All");
  const [filterPri, setFilterPri] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"inbox" | "spam" | "settings">("inbox");

  // Settings state
  const [settingsSchool, setSettingsSchool] = useState<string>("");
  const [settingsTopics, setSettingsTopics] = useState<string[]>([]);
  const [settingsTopicInput, setSettingsTopicInput] = useState("");
  const [settingsDragIdx, setSettingsDragIdx] = useState<number | null>(null);
  const [settingsDragOverIdx, setSettingsDragOverIdx] = useState<number | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (provider === "outlook") {
      fetch(`${BACKEND_BASE}/auth/microsoft/status`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setMsAuthed(!!d.authenticated))
        .catch(() => setMsAuthed(false));
    }
  }, [provider]);

  // Load user preferences whenever the settings tab is opened
  useEffect(() => {
    if (activeTab === "settings") {
      fetch(`${BACKEND_BASE}/auth/preferences`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
          setSettingsSchool(data.school || "");
          setSettingsTopics(data.priorityTopics || []);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  function resetState() {
    setError(null);
    setEmails([]);
    setCalStatus({});
    setFilterCat("All");
    setFilterPri(0);
  }

  function switchProvider(p: Provider) {
    setProvider(p);
    resetState();
  }

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
    try {
      const resp = await fetch(`${BACKEND_BASE}/auth/microsoft/url`, { headers: authHeaders() });
      if (!resp.ok) { setError("Could not get Microsoft auth URL."); return; }
      const { url } = await resp.json();
      await openAuthPopup(url);
      setMsAuthed(true);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatch() {
    setLoading(true);
    resetState();
    try {
      const endpoint = provider === "gmail"
        ? `${BACKEND_BASE}/fetch-and-process-batch`
        : `${BACKEND_BASE}/outlook/fetch-and-process-batch`;

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({}),
      });

      if (resp.status === 401) {
        const data = await resp.json().catch(() => ({}));
        const errCode = data.error;
        if (errCode === "NO_GOOGLE_TOKEN") {
          const authUrlResp = await fetch(`${BACKEND_BASE}/auth/url`, { headers: authHeaders() });
          if (authUrlResp.ok) {
            const { url } = await authUrlResp.json();
            await openAuthPopup(url);
            setError("Google account linked! Click the button again to load your emails.");
          }
          return;
        }
        if (errCode === "NO_MS_TOKEN") {
          await signInMicrosoft();
          setError("Signed in! Click the button again to load your emails.");
          return;
        }
        setError("Session expired. Please log in again.");
        return;
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data.error || `Error ${resp.status}`);
        return;
      }

      const data = await resp.json();
      setEmails(data.results ?? []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function addToCalendar(email: EmailResult) {
    try {
      const resp = await fetch(`${BACKEND_BASE}/calendar/add-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: email.subject, date: email.time?.split("T")[0] || undefined, location: email.location || undefined }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setCalStatus(prev => ({ ...prev, [email.id]: data.htmlLink ? "Added!" : "Added to calendar!" }));
      } else {
        setCalStatus(prev => ({ ...prev, [email.id]: `Error: ${data.error}` }));
      }
    } catch (err: any) {
      setCalStatus(prev => ({ ...prev, [email.id]: "Failed to add." }));
    }
  }

  function addSettingsTopic() {
    const t = settingsTopicInput.trim();
    if (!t || settingsTopics.includes(t)) { setSettingsTopicInput(""); return; }
    setSettingsTopics(prev => [...prev, t]);
    setSettingsTopicInput("");
  }

  function removeSettingsTopic(i: number) {
    setSettingsTopics(prev => prev.filter((_, idx) => idx !== i));
  }

  function onSettingsDragStart(i: number) { setSettingsDragIdx(i); }
  function onSettingsDragEnter(i: number) { setSettingsDragOverIdx(i); }
  function onSettingsDragEnd() {
    if (settingsDragIdx === null || settingsDragOverIdx === null || settingsDragIdx === settingsDragOverIdx) {
      setSettingsDragIdx(null); setSettingsDragOverIdx(null); return;
    }
    const reordered = [...settingsTopics];
    const [moved] = reordered.splice(settingsDragIdx, 1);
    reordered.splice(settingsDragOverIdx, 0, moved);
    setSettingsTopics(reordered);
    setSettingsDragIdx(null); setSettingsDragOverIdx(null);
  }

  async function savePreferences() {
    setSettingsLoading(true);
    setSettingsSaved(false);
    try {
      await fetch(`${BACKEND_BASE}/auth/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ school: settingsSchool, priorityTopics: settingsTopics }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch {
      // silent fail — user will just not see confirmation
    } finally {
      setSettingsLoading(false);
    }
  }

  // Derived filtered list
  const inboxEmails = emails.filter(e => !e.isSpam);
  const spamEmails = emails.filter(e => e.isSpam);
  const categories = ["All", ...Array.from(new Set(inboxEmails.map(e => e.assignedCategory)))];
  const filtered = inboxEmails.filter(e => {
    if (filterCat !== "All" && e.assignedCategory !== filterCat) return false;
    if (filterPri > 0 && e.priorityLevel !== filterPri) return false;
    return true;
  });

  const priorityCounts = [1,2,3,4].map(p => ({ p, count: inboxEmails.filter(e => e.priorityLevel === p).length }));
  const cachedCount = emails.filter(e => e.cached).length;
  const newCount = emails.length - cachedCount;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top nav bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-gray-900">TagIt</span>
            {emails.length > 0 && (
              <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {emails.length} emails
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Provider toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {(["gmail", "outlook"] as Provider[]).map(p => (
                <button
                  key={p}
                  onClick={() => switchProvider(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    provider === p
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p === "gmail" ? "Gmail" : "Outlook"}
                </button>
              ))}
            </div>

            {onLogout && (
              <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
                Log out
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1 pb-0">
          {(["inbox", "spam", "settings"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "spam"
                ? `Spam${spamEmails.length > 0 ? ` (${spamEmails.length})` : ""}`
                : tab === "inbox" ? "Inbox"
                : "Settings"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Outlook sign-in */}
        {provider === "outlook" && !msAuthed && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-center justify-between">
            <span className="font-medium">Sign in to Microsoft to access Outlook.</span>
            <button
              onClick={signInMicrosoft}
              disabled={loading}
              className="bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 text-xs font-semibold"
            >
              {loading ? "Opening..." : "Sign in"}
            </button>
          </div>
        )}

        {/* Outlook connected indicator */}
        {provider === "outlook" && msAuthed && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="font-medium">Connected to Microsoft</span>
            <button onClick={signInMicrosoft} className="ml-auto text-xs text-gray-500 underline hover:text-gray-700">
              Switch account
            </button>
          </div>
        )}

        {/* Spam tab */}
        {activeTab === "spam" && (
          <div>
            {spamEmails.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-12">
                {emails.length === 0 ? "Fetch your emails first." : "No spam detected in your last batch."}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{spamEmails.length} email{spamEmails.length !== 1 ? "s" : ""} flagged as spam or phishing.</p>
                {spamEmails.map((email, i) => (
                  <div key={email.id} className="border border-red-100 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-red-400 text-sm mt-0.5">🚫</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{email.subject}</p>
                        {email.spamReason && (
                          <p className="text-xs text-red-600 mt-1">{email.spamReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="space-y-5">
            {/* School */}
            <div>
              <label className="block text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Your school at UTD</label>
              <div className="flex gap-2">
                {["ECS", "JSOM", "Other"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSettingsSchool(prev => prev === s ? "" : s)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                      settingsSchool === s
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {settingsSchool === "ECS" && <p className="text-xs text-gray-400 mt-1">Engineering & Computer Science</p>}
              {settingsSchool === "JSOM" && <p className="text-xs text-gray-400 mt-1">Jindal School of Management</p>}
            </div>

            {/* Priority topics */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Priority topics</label>
              <p className="text-xs text-gray-400 mb-2">Drag to reorder — top = most important. Emails matching these topics get boosted priority.</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={settingsTopicInput}
                  onChange={e => setSettingsTopicInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addSettingsTopic()}
                  placeholder='e.g. Research'
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <button onClick={addSettingsTopic} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
                  Add
                </button>
              </div>
              {settingsTopics.length === 0 && (
                <p className="text-xs text-gray-400 py-2">No topics added yet.</p>
              )}
              {settingsTopics.length > 0 && (
                <ul className="space-y-1">
                  {settingsTopics.map((t, i) => (
                    <li
                      key={t}
                      draggable
                      onDragStart={() => onSettingsDragStart(i)}
                      onDragEnter={() => onSettingsDragEnter(i)}
                      onDragEnd={onSettingsDragEnd}
                      onDragOver={e => e.preventDefault()}
                      className={`flex items-center gap-2 px-3 py-2 rounded border bg-white text-sm cursor-grab select-none transition-all ${
                        settingsDragOverIdx === i ? "border-blue-400 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <span className="text-gray-300 text-xs">☰</span>
                      <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}.</span>
                      <span className="flex-1 text-gray-800">{t}</span>
                      <button onClick={() => removeSettingsTopic(i)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={savePreferences}
                disabled={settingsLoading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {settingsLoading ? "Saving..." : "Save preferences"}
              </button>
              {settingsSaved && <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>}
            </div>
          </div>
        )}

        {/* Inbox tab */}
        {activeTab === "inbox" && (
          <>
            {/* Fetch button */}
            <button
              onClick={fetchBatch}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-sm transition-all text-sm tracking-wide"
            >
              {loading
                ? "Analysing emails…"
                : `Fetch & Analyse Last 25 ${provider === "gmail" ? "Gmail" : "Outlook"} Emails`}
            </button>

            {/* Loading skeleton */}
            {loading && (
              <div className="mt-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl bg-white p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-full" />
                        <div className="h-2 bg-gray-100 rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* Results */}
            {!loading && inboxEmails.length > 0 && (
              <>
                {/* Cache info */}
                <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {newCount} newly analysed
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    {cachedCount} from cache
                  </span>
                  {spamEmails.length > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <button
                        onClick={() => setActiveTab("spam")}
                        className="flex items-center gap-1 text-red-500 hover:underline"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        {spamEmails.length} spam
                      </button>
                    </>
                  )}
                </div>

                {/* Stats bar */}
                <div className="mt-3 mb-4 grid grid-cols-4 gap-2">
                  {priorityCounts.map(({ p, count }) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setFilterPri(prev => prev === p ? 0 : p)}
                        className={`rounded-xl border p-3 text-center transition-all ${
                          filterPri === p ? cfg.color + " ring-2 ring-offset-1 ring-current" : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`text-xl font-black ${filterPri === p ? "" : "text-gray-800"}`}>{count}</div>
                        <div className={`text-xs font-medium mt-0.5 ${filterPri === p ? "" : "text-gray-500"}`}>{cfg.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Category filter pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        filterCat === cat
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {cat}
                      {cat !== "All" && (
                        <span className="ml-1.5 opacity-60">
                          {inboxEmails.filter(e => e.assignedCategory === cat).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Email cards */}
                <div className="space-y-3">
                  {filtered.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-12">No emails match this filter.</div>
                  ) : (
                    filtered.map((email, i) => (
                      <div key={email.id}>
                        <EmailCard
                          email={email}
                          index={inboxEmails.indexOf(email)}
                          onAddCalendar={addToCalendar}
                        />
                        {calStatus[email.id] && (
                          <p className="text-xs text-emerald-600 font-medium mt-1 ml-4">{calStatus[email.id]}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {!loading && emails.length === 0 && !error && (
              <div className="text-center text-gray-400 text-sm py-12">Click the button above to load your emails.</div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Popup;