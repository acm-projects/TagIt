import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import SectionHeader from "../components/SectionHeader";
import WeekHeader from "../components/WeekHeader";
import { removeToken } from "../services/auth/tokenStorage";

const STORAGE_KEY_PRIORITIES = "tagit-settings-priorities";
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

const DEFAULT_PRIORITIES: PriorityRule[] = [
  { id: 1, label: "Club Events" },
  { id: 2, label: "Class/Assignment Notifications" },
  { id: 3, label: "Class/Assignment Notifications" },
  { id: 4, label: "Deadlines" },
];

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

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

  // Persist priorities to localStorage whenever they change (reorder, add, remove, edit).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRIORITIES, JSON.stringify(priorities));
    } catch {
      /* ignore */
    }
  }, [priorities]);

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

  const handleLogout = async () => {
    await Promise.all([removeToken("google"), removeToken("microsoft")]);
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          {/* Connected user and linked emails */}
          <div className="mt-2.5 space-y-4 sm:mt-3">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <SectionHeader
                    title="Users"
                    icon={<span className="material-symbols-outlined text-[18px]">person</span>}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(true)}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-[#F3E6D9] px-3 text-xs font-semibold text-[#f9ab7b] transition-colors hover:bg-[#FFF4EC]"
                    aria-label="Connect another email account"
                  >
                    Add account
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
                    <div className="max-w-md rounded-2xl border border-[#EFE7DC] bg-white p-6 shadow-xl">
                      <h2
                        id="connect-email-title"
                        className="text-lg font-semibold text-[#111827]"
                      >
                        Connect your email
                      </h2>
                      <p className="mt-2 text-sm text-[#6B7280]">
                        Add an account so the app can prioritize mail, extract tasks,
                        and surface deadlines.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowConnectModal(false);
                            setConnectedUser((u) => ({
                              ...u,
                              emails: [...u.emails, "your@gmail.com"],
                            }));
                          }}
                          className="rounded-lg bg-[#f9ab7b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ef9967]"
                        >
                          Connect Gmail
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowConnectModal(false);
                            setConnectedUser((u) => ({
                              ...u,
                              emails: [...u.emails, "your@outlook.com"],
                            }));
                          }}
                          className="rounded-lg bg-[#DBEAFE] px-4 py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#bfdbfe]"
                        >
                          Connect Outlook
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConnectModal(false)}
                        className="mt-4 text-sm text-[#6B7280] hover:text-[#111827]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-3 text-sm">
                  <div className="rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF]">
                      Username
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      {connectedUser.username}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {connectedUser.emails.map((email, index) => (
                      <div
                        key={email}
                        className="flex items-center gap-3 rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-3 text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)]"
                      >
                        <span className="text-xs font-semibold text-[#9CA3AF]">
                          {index + 1}.
                        </span>
                        <span className="font-medium text-[#111827]">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Priorities configuration: order and labels are persisted (localStorage). */}
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <SectionHeader
                    title="Priorities"
                    icon={<span className="material-symbols-outlined text-[18px]">tune</span>}
                  />
                  <button
                    type="button"
                    onClick={addPriority}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-[#F3E6D9] px-3 text-xs font-semibold text-[#f9ab7b] transition-colors hover:bg-[#FFF4EC]"
                  >
                    Add priority
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {priorities.map((rule, index) => {
                    const isEditing = editingPriorityId === rule.id;

                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-3 text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="text-xs font-semibold text-[#9CA3AF]">
                            {index + 1}.
                          </span>

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
                              className="min-w-[160px] rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-normal text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#fde6d7]"
                              aria-label="Edit priority label"
                            />
                          ) : (
                            <span className="truncate font-medium text-[#111827]">
                              {rule.label}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => movePriority(rule.id, "up")}
                            disabled={index === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#f9ab7b] disabled:opacity-40"
                            aria-label="Move priority up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => movePriority(rule.id, "down")}
                            disabled={index === priorities.length - 1}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#f9ab7b] disabled:opacity-40"
                            aria-label="Move priority down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditingPriority(rule)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#f9ab7b]"
                            aria-label="Edit priority"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => removePriority(rule.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#f9ab7b]"
                            aria-label="Delete priority"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <SectionHeader
                    title="Account"
                    icon={<span className="material-symbols-outlined text-[18px]">logout</span>}
                  />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[#FAD3D3] bg-[#FFF5F5] px-4 text-sm font-semibold text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

        <AppNavbar />
      </div>
    </div>
  );
};

export default SettingsPage;
