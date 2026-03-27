import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import deleteIcon from "../assets/page_buttons/delete.png";

const STORAGE_KEY_PRIORITIES = "tagit-settings-priorities";
import { loadUserPriorities, saveUserPriorities } from "../services/priorities";

type Priority = {
  id: number;
  label: string;
};

const DeleteIcon = ({ className }: { className?: string }) => (
  <img src={deleteIcon} alt="" className={className ?? ""} />
);

const initialPriorities: Priority[] = [
  { id: 1, label: "Club Events" },
  { id: 2, label: "Class/Assignment Notifications" },
  { id: 3, label: "Job/Internship Opportunities" },
  { id: 4, label: "Deadlines" },
];

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<Priority[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRIORITIES);
      if (raw) {
        const parsed = JSON.parse(raw) as Priority[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return initialPriorities;
  });
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [newPriority, setNewPriority] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleDragStart = (id: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragId(id);
    e.dataTransfer.setData("text/plain", String(id));
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, overId: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(overId);
    if (dragId === null || dragId === overId) return;

    const draggedIndex = priorities.findIndex((p) => p.id === dragId);
    const overIndex = priorities.findIndex((p) => p.id === overId);
    if (draggedIndex === -1 || overIndex === -1) return;

    const updated = [...priorities];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(overIndex, 0, moved);
    setPriorities(updated);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragId(null);
    setDragOverId(null);
  };

  const handleRemovePriority = (id: number) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddPriority = () => {
    const trimmed = newPriority.trim();
    if (!trimmed) return;
    setPriorities((prev) => {
      const nextId = prev.length === 0 ? 1 : Math.max(...prev.map((p) => p.id)) + 1;
      return [...prev, { id: nextId, label: trimmed }];
    });
    setNewPriority("");
    setShowInput(false);
  };

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRIORITIES, JSON.stringify(priorities));
    } catch {
      /* ignore */
    }
  }, [priorities]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col items-center overflow-auto px-3 py-2 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <div className="w-full max-w-3xl rounded-2xl border border-[#EFE7DC] bg-white px-6 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-instrument text-4xl font-normal text-[#1F2933]">Setup</h1>
              <p className="text-sm text-[#6B7280]">Tell us what to prioritize first.</p>
            </div>

            <div className="mt-6 text-left">
              <p className="mb-3 text-base font-semibold text-[#1F2933]">Order priorities</p>
              <div
                className="space-y-2.5"
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
              >
                {priorities.map((priority) => (
                  <div
                    key={priority.id}
                    draggable
                    onDragStart={(e) => handleDragStart(priority.id, e)}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragOver={(e) => handleDragOver(e, priority.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-[#1F2933] shadow-[0_4px_10px_rgba(15,23,42,0.04)] transition-all duration-150 ease-out
                    ${dragId === priority.id ? "border-[#f9ab7b] bg-[#fff3eb] cursor-grabbing -translate-y-1 shadow-[0_10px_24px_rgba(15,23,42,0.10)]" : ""}
                    ${dragOverId === priority.id && dragId !== priority.id ? "border-[#f9ab7b] bg-[#fff7f0] shadow-[0_8px_18px_rgba(15,23,42,0.08)] translate-y-1" : ""}
                    ${dragId !== priority.id && dragOverId !== priority.id ? "cursor-grab border-[#F1E7DD] bg-[#FFF7F0] hover:-translate-y-0.5" : ""}`}
                  >
                    <div className="flex items-center gap-3 text-sm font-medium leading-tight">
                      <span className="text-lg text-[#f9ab7b] select-none" aria-label="drag handle">
                        ⋮⋮
                      </span>
                      <span>{priority.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePriority(priority.id)}
                      className="shrink-0 rounded-full p-2 text-[#9CA3AF] transition-colors hover:bg-[#f3f4f6] hover:text-[#6B7280]"
                      aria-label={`Remove ${priority.label}`}
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {showInput && (
                <div className="flex w-full items-center gap-3 rounded-2xl border border-[#f9ab7b] bg-white px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
                  <input
                    type="text"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPriority();
                      }
                      if (e.key === "Escape") {
                        setShowInput(false);
                        setNewPriority("");
                      }
                    }}
                    autoFocus
                    placeholder="Type a priority..."
                    className="flex-1 border-none bg-transparent text-sm text-[#1F2933] focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddPriority}
                      className="rounded-lg bg-[#f9ab7b] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#f59c65]"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInput(false);
                        setNewPriority("");
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-[#6B7280] transition hover:text-[#111827]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!showInput && (
                <button
                  type="button"
                  onClick={() => setShowInput(true)}
                  className="flex w-full items-center justify-center rounded-2xl border border-dashed border-[#f9ab7b] bg-white px-4 py-4 text-sm font-semibold text-[#1F2933] shadow-[0_4px_10px_rgba(15,23,42,0.04)] transition hover:bg-[#fff3eb]"
                >
                  + Add priorities
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/today")}
                className="mx-auto block w-52 rounded-lg bg-[#f9ab7b] py-3 text-base font-semibold text-white shadow-[0_10px_24px_rgba(249,171,123,0.32)] transition hover:bg-[#f59c65]"
              >
                Finish setup
              </button>
            </div>
          </div>
        </main>

        <AppNavbar />
      </div>
    </div>
  );
};

export default SetupPage;
