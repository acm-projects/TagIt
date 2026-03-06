import React, { useCallback, useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";

const STORAGE_KEY_PRIORITIES = "tagit-settings-priorities";
const STORAGE_KEY_HIGHLIGHTS = "tagit-settings-highlights";

/**
 * Represents the currently connected user account and emails.
 * Connected accounts are authenticated via the backend; the AI backend
 * will read and process these inboxes.
 */
type ConnectedUser = {
  username: string;
  emails: string[];
};

/**
 * A single priority rule describing what the user cares about.
 *
 * Order matters: items at lower indices are treated as more important.
 * When emails are read, the backend / AI pipeline can walk this list in
 * order and match messages against each rule.
 */
type PriorityRule = {
  id: number;
  label: string;
};

/**
 * Extra "hint" phrases the user can add under the Add section to help
 * steer how emails are grouped or highlighted (e.g. "Scholarships").
 * These are meant to be small, user-defined keywords consumed by AI.
 */
type HighlightChip = {
  id: number;
  label: string;
  active: boolean;
};

const DEFAULT_PRIORITIES: PriorityRule[] = [
  { id: 1, label: "Club Events" },
  { id: 2, label: "Class/Assignment Notifications" },
  { id: 3, label: "Class/Assignment Notifications" },
  { id: 4, label: "Deadlines" },
];

const DEFAULT_HIGHLIGHTS: HighlightChip[] = [
  { id: 1, label: "Turn tables", active: false },
  { id: 2, label: "Financial Aid", active: true },
  { id: 3, label: "Scholarships", active: true },
  { id: 4, label: "Jobs", active: true },
  { id: 5, label: "Internships", active: true },
  { id: 6, label: "Other", active: false },
];

const SettingsPage: React.FC = () => {
  // Connected user and emails; updated when user authenticates new accounts.
  // Backend will use these to connect and read inboxes for the AI pipeline.
  const [connectedUser, setConnectedUser] = useState<ConnectedUser>(() => ({
    username: "username",
    emails: ["email1@gmail.com", "email2@outlook.com", "email3@utdallas.edu"],
  }));

  // Priorities: load from localStorage so changes are permanent across sessions.
  const [priorities, setPriorities] = useState<PriorityRule[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRIORITIES);
      if (raw) {
        const parsed = JSON.parse(raw) as PriorityRule[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_PRIORITIES;
  });

  // Track which priority (if any) is currently being edited inline.
  const [editingPriorityId, setEditingPriorityId] = useState<number | null>(
    null,
  );
  const [editingPriorityValue, setEditingPriorityValue] = useState<string>("");

  const [highlightChips, setHighlightChips] = useState<HighlightChip[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      if (raw) {
        const parsed = JSON.parse(raw) as HighlightChip[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_HIGHLIGHTS;
  });

  // Persist priorities to localStorage whenever they change (reorder, add, remove, edit).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRIORITIES, JSON.stringify(priorities));
    } catch {
      /* ignore */
    }
  }, [priorities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlightChips));
    } catch {
      /* ignore */
    }
  }, [highlightChips]);

  // Connect-email modal: user can add Gmail/Outlook etc.; backend will authenticate and read.
  const [showConnectModal, setShowConnectModal] = useState(false);

  /**
   * Move a priority one position up or down in the list.
   * This directly controls the order in which AI will apply rules.
   */
  const movePriority = (id: number, direction: "up" | "down") => {
    setPriorities((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      if (index === -1) return previous;

      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= previous.length) return previous;

      const next = [...previous];
      const temp = next[index];
      next[index] = next[swapWith];
      next[swapWith] = temp;
      return next;
    });
  };

  /**
   * Remove a priority rule entirely.
   * Backend integration could mirror this change by updating the user's
   * saved preference document.
   */
  const removePriority = (id: number) => {
    setPriorities((previous) => previous.filter((item) => item.id !== id));

    if (editingPriorityId === id) {
      setEditingPriorityId(null);
      setEditingPriorityValue("");
    }
  };

  /**
   * Begin inline editing for the selected priority label.
   * This is triggered when the user clicks the pencil icon.
   */
  const startEditingPriority = (rule: PriorityRule) => {
    setEditingPriorityId(rule.id);
    setEditingPriorityValue(rule.label);
  };

  /**
   * Commit text changes to a priority label and exit edit mode.
   */
  const saveEditedPriority = () => {
    if (editingPriorityId === null) return;

    const trimmed = editingPriorityValue.trim();
    if (!trimmed) {
      // Ignore empty values; keep the previous label.
      setEditingPriorityId(null);
      setEditingPriorityValue("");
      return;
    }

    setPriorities((previous) =>
      previous.map((item) =>
        item.id === editingPriorityId ? { ...item, label: trimmed } : item,
      ),
    );

    setEditingPriorityId(null);
    setEditingPriorityValue("");
  };

  /**
   * Add a new priority rule at the end of the list and open it for editing.
   * Persistence is handled by the priorities useEffect.
   */
  const addPriority = useCallback(() => {
    const nextId =
      priorities.length === 0
        ? 1
        : Math.max(...priorities.map((p) => p.id), 0) + 1;
    const newRule: PriorityRule = { id: nextId, label: "New priority" };
    setPriorities((prev) => [...prev, newRule]);
    setEditingPriorityId(nextId);
    setEditingPriorityValue(newRule.label);
  }, [priorities]);

  /**
   * Toggle whether a highlight chip is active.
   * Active chips represent the phrases the user wants AI to pay
   * special attention to when scanning emails.
   */
  const toggleHighlightChip = (id: number) => {
    setHighlightChips((previous) =>
      previous.map((chip) =>
        chip.id === id ? { ...chip, active: !chip.active } : chip,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF2E9] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        {/* Left-hand navigation rail shared with the rest of the app */}
        <AppNavbar />

        {/* Main settings column */}
        <main className="flex-1 overflow-auto px-8 py-6 text-[#A34712]">
          {/* Same header strip as other pages so title aligns with date header */}
          <header className="page-header flex flex-col items-center justify-center border-b border-[#F3C5A5] px-8 pb-4 pt-6 text-center">
            <h1 className="text-4xl font-semibold tracking-[0.12em] text-[#913c14]">
              SETTINGS
            </h1>
          </header>

          {/* Connected user and linked emails */}
          <section className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span>Users</span>
              </div>

              {/* Opens connect-email modal; backend will handle OAuth and then
                  read/process these inboxes with the AI pipeline. */}
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="text-lg font-semibold leading-none text-[#A34712] hover:underline"
                aria-label="Connect another email account"
              >
                +
              </button>
            </div>

            {/* Modal: authenticate a new email account for the AI backend */}
            {showConnectModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                role="dialog"
                aria-modal="true"
                aria-labelledby="connect-email-title"
              >
                <div className="max-w-md rounded-2xl bg-[#FFFBF8] p-6 shadow-xl border border-[#F3C5A5]">
                  <h2
                    id="connect-email-title"
                    className="text-lg font-semibold text-[#913c14]"
                  >
                    Connect your email
                  </h2>
                  <p className="mt-2 text-sm text-[#5A3A2A]">
                    Add an account so our AI backend can connect and read your
                    inbox to prioritize mail, extract tasks, and surface
                    deadlines. You can connect Gmail, Outlook, or other
                    providers.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConnectModal(false);
                        /* Backend: replace with Gmail OAuth; then setConnectedUser with returned email */
                        setConnectedUser((u) => ({
                          ...u,
                          emails: [...u.emails, "your@gmail.com"],
                        }));
                      }}
                      className="rounded-lg bg-[#D3753D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A34712]"
                    >
                      Connect Gmail
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowConnectModal(false);
                        /* Backend: replace with Outlook OAuth; then setConnectedUser with returned email */
                        setConnectedUser((u) => ({
                          ...u,
                          emails: [...u.emails, "your@outlook.com"],
                        }));
                      }}
                      className="rounded-lg bg-[#0078D4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#106EBE]"
                    >
                      Connect Outlook
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="mt-4 text-sm text-[#7A4A2D] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm text-[#5A3A2A]">
              {/* Username row */}
              <div className="flex items-center gap-3 text-base">
                <span>name:</span>
                <div className="inline-flex min-w-[200px] items-center rounded-lg bg-[#F8E0CE] px-3 py-2 font-semibold text-[#7A4A2D]">
                  {connectedUser.username}
                </div>
              </div>

              {/* Connected email addresses listed in order */}
              <div className="space-y-2">
                {connectedUser.emails.map((email, index) => (
                  <div
                    key={email}
                    className="flex items-center rounded-lg bg-[#F8E0CE] px-3 py-2 text-base font-semibold text-[#5A3A2A]"
                  >
                    <span className="mr-3">{index + 1}.</span>
                    <span>{email}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Priorities configuration: order and labels are persisted (localStorage). */}
          <section className="mt-10 space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-base">🧩</span>
                <span>Priorities</span>
              </div>
              <button
                type="button"
                onClick={addPriority}
                className="rounded-lg bg-[#F8E0CE] px-3 py-1.5 text-xs font-semibold text-[#A34712] hover:bg-[#FFD6B8]"
              >
                Add priority
              </button>
            </div>

            {/* Each pill row is an ordered priority rule with drag handle,
                editable label, and controls for reordering and deletion. */}
            <div className="space-y-3">
              {priorities.map((rule, index) => {
                const isEditing = editingPriorityId === rule.id;

                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-full bg-[#F8E0CE] px-4 py-2 text-sm font-semibold text-[#5A3A2A]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag handle icon (visual only for now) */}
                      <span className="text-lg text-[#7A4A2D]">⋮⋮</span>

                      {/* Numbered label to reinforce ordering */}
                      <span className="text-xs text-[#7A4A2D]">
                        {index + 1}.
                      </span>

                      {/* Inline editable text field for the rule label */}
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingPriorityValue}
                          onChange={(event) =>
                            setEditingPriorityValue(event.target.value)
                          }
                          onBlur={saveEditedPriority}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              saveEditedPriority();
                            }
                          }}
                          className="min-w-[160px] rounded-md border border-[#E6C7B3] bg-[#FFF9F4] px-2 py-1 text-xs font-normal text-[#5A3A2A] focus:outline-none focus:ring-2 focus:ring-[#D3753D]"
                          aria-label="Edit priority label"
                        />
                      ) : (
                        <span>{rule.label}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {/* Move up / down buttons to change order */}
                      <button
                        type="button"
                        onClick={() => movePriority(rule.id, "up")}
                        disabled={index === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFEFEB] text-[11px] text-[#7A4A2D] disabled:opacity-40"
                        aria-label="Move priority up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => movePriority(rule.id, "down")}
                        disabled={index === priorities.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFEFEB] text-[11px] text-[#7A4A2D] disabled:opacity-40"
                        aria-label="Move priority down"
                      >
                        ▼
                      </button>

                      {/* Pencil to edit the rule label text */}
                      <button
                        type="button"
                        onClick={() => startEditingPriority(rule)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFEFEB] text-[13px] text-[#7A4A2D]"
                        aria-label="Edit priority"
                      >
                        ✏️
                      </button>

                      {/* Trash to remove the rule */}
                      <button
                        type="button"
                        onClick={() => removePriority(rule.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFEFEB] text-[13px] text-[#7A4A2D]"
                        aria-label="Delete priority"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Additional highlight hints (persisted to localStorage) */}
          <section className="mt-10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">+</span>
              <span>Add</span>
            </div>

            {/* These chips express extra phrases the user wants surfaced.
                When integrated, the backend / AI can treat all `active`
                chips as high-value patterns to look for in email text. */}
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#5A3A2A]">
              {highlightChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => toggleHighlightChip(chip.id)}
                  className={`rounded-md px-3 py-1 shadow-sm ${
                    chip.active ? "bg-[#F8BE93]" : "bg-[#F8E0CE]"
                  }`}
                  aria-pressed={chip.active}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
