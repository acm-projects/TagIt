import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import SectionHeader from "../components/SectionHeader";
import { removeToken } from "../services/auth/tokenStorage";
import {
  getCategoryIdForPriority,
  loadUserPriorities,
  saveUserPriorities,
} from "../services/priorities";
import {
  getCategoryColorById,
  setUserCategoryColor,
  useUserCategories,
} from "../services/categories";
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
type PriorityRule = ReturnType<typeof loadUserPriorities>[number];

type SortablePriorityRowProps = {
  rule: PriorityRule;
  index: number;
  isEditing: boolean;
  isDragging: boolean;
  editingPriorityValue: string;
  onEditingPriorityValueChange: (value: string) => void;
  onSaveEditedPriority: () => void;
  onStartEditingPriority: (rule: PriorityRule) => void;
  onRemovePriority: (id: number) => void;
  onDragStart: (id: number, event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (id: number, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  categories: ReturnType<typeof useUserCategories>;
};

const SortablePriorityRow: React.FC<SortablePriorityRowProps> = ({
  rule,
  index,
  isEditing,
  isDragging,
  editingPriorityValue,
  onEditingPriorityValueChange,
  onSaveEditedPriority,
  onStartEditingPriority,
  onRemovePriority,
  onDragStart,
  onDragOver,
  onDragEnd,
  categories,
}) => {
  const colorValue = getCategoryColorById(
    categories,
    getCategoryIdForPriority(rule.id),
  );

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(rule.id, event)}
      onDragOver={(event) => onDragOver(rule.id, event)}
      onDragEnd={onDragEnd}
      className={`flex items-center justify-between gap-3 rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-3 text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)] ${
        isDragging
          ? "scale-[1.01] opacity-90 shadow-[0_12px_26px_rgba(17,24,39,0.12)]"
          : "transition-[transform,box-shadow] duration-200 ease-out"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-7 w-7 cursor-grab items-center justify-center text-[#f9ab7b] active:cursor-grabbing"
          aria-label={`Drag to reorder ${rule.label}`}
        >
          <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
        </button>
        <span className="text-xs font-semibold text-[#9CA3AF]">{index + 1}.</span>

        {isEditing ? (
          <input
            autoFocus
            value={editingPriorityValue}
            onChange={(event) => onEditingPriorityValueChange(event.target.value)}
            onBlur={onSaveEditedPriority}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSaveEditedPriority();
              }
            }}
            className="min-w-[160px] rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-normal text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#fde6d7]"
            aria-label="Edit priority label"
          />
        ) : (
          <span className="truncate font-medium text-[#111827]">{rule.label}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-xs">
        <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-white shadow-[0_6px_14px_rgba(17,24,39,0.08)] ring-1 ring-[#efe7dc]" />
          <span
            className="relative h-5 w-5 rounded-full"
            style={{ backgroundColor: colorValue }}
          />
          <input
            type="color"
            value={colorValue}
            onChange={(event) =>
              setUserCategoryColor(getCategoryIdForPriority(rule.id), event.target.value)
            }
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`Change color for ${rule.label}`}
          />
        </label>
        <button
          type="button"
          onClick={() => onStartEditingPriority(rule)}
          className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b]"
          aria-label="Edit priority"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button
          type="button"
          onClick={() => onRemovePriority(rule.id)}
          className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b]"
          aria-label="Delete priority"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Connected user and emails; updated when user authenticates new accounts.
  // Backend will use these to connect and read inboxes for the AI pipeline.
  const [connectedUser, setConnectedUser] = useState<ConnectedUser>(() => ({
    username: "username",
    emails: ["email1@gmail.com", "email2@outlook.com", "email3@utdallas.edu"],
  }));

  // Priorities: load from localStorage so changes are permanent across sessions.
  const [priorities, setPriorities] = useState<PriorityRule[]>(() => loadUserPriorities());
  const categories = useUserCategories();

  // Track which priority (if any) is currently being edited inline.
  const [editingPriorityId, setEditingPriorityId] = useState<number | null>(
    null,
  );
  const [editingPriorityValue, setEditingPriorityValue] = useState<string>("");
  const [dragId, setDragId] = useState<number | null>(null);

  // Persist priorities to localStorage whenever they change (reorder, add, remove, edit).
  useEffect(() => {
    saveUserPriorities(priorities);
  }, [priorities]);

  // Connect-email modal: user can add Gmail/Outlook etc.; backend will authenticate and read.
  const [showConnectModal, setShowConnectModal] = useState(false);

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

  const handlePriorityDragStart = (id: number, event: React.DragEvent<HTMLDivElement>) => {
    setDragId(id);
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    event.dataTransfer.setDragImage(img, 0, 0);
    event.dataTransfer.effectAllowed = "move";
  };

  const handlePriorityDragOver = (overId: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragId === null || dragId === overId) return;

    setPriorities((previous) => {
      const oldIndex = previous.findIndex((item) => item.id === dragId);
      const newIndex = previous.findIndex((item) => item.id === overId);

      if (oldIndex === -1 || newIndex === -1) return previous;

      const next = [...previous];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  };

  const handlePriorityDragEnd = () => {
    setDragId(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          {/* Same outer + row height as WeekHeader/DateHeader so content below aligns with Mail/Calendar */}
          <header className="page-header w-full shrink-0 px-0 pb-3 pt-4 text-[#1F2933]">
            <div className="relative flex min-h-16 items-center justify-center">
              <h1 className="min-w-0 w-full max-w-full truncate px-2 text-center text-2xl font-semibold leading-tight tracking-[0.12em] text-[#111827] sm:text-3xl">
                SETTINGS
              </h1>
            </div>
          </header>

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
                  {priorities.map((rule, index) => (
                    <SortablePriorityRow
                      key={rule.id}
                      rule={rule}
                      index={index}
                      isEditing={editingPriorityId === rule.id}
                      isDragging={dragId === rule.id}
                      editingPriorityValue={editingPriorityValue}
                      onEditingPriorityValueChange={setEditingPriorityValue}
                      onSaveEditedPriority={saveEditedPriority}
                      onStartEditingPriority={startEditingPriority}
                      onRemovePriority={removePriority}
                      onDragStart={handlePriorityDragStart}
                      onDragOver={handlePriorityDragOver}
                      onDragEnd={handlePriorityDragEnd}
                      categories={categories}
                    />
                  ))}
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
