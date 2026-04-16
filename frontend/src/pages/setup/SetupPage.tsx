import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePreferences } from "../../services/api";

type Priority = {
  id: string;
  label: string;
};

const initialPriorities: Priority[] = [
  { id: "1", label: "Club Events" },
  { id: "2", label: "Class/Assignment Notifications" },
  { id: "3", label: "Job/Internship Opportunities" },
  { id: "4", label: "Deadlines" },
  { id: "5", label: "High Priority" },
  { id: "6", label: "Medium Priority" },
  { id: "7", label: "Low Priority" },
];

let nextId = initialPriorities.length + 1;

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<Priority[]>(initialPriorities);
  const [dragId, setDragId] = useState<string | null>(null);
  const [newPriority, setNewPriority] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDragId(id);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, overId: string) => {
    event.preventDefault();
    if (dragId === null || dragId === overId) return;

    const draggedIndex = priorities.findIndex((p) => p.id === dragId);
    const overIndex = priorities.findIndex((p) => p.id === overId);
    if (draggedIndex === -1 || overIndex === -1) return;

    const updated = [...priorities];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(overIndex, 0, moved);
    setPriorities(updated);
  };

  const handleDrop = () => setDragId(null);

  const handleAddPriority = () => {
    const trimmed = newPriority.trim();
    if (!trimmed) return;
    if (priorities.some((p) => p.label.toLowerCase() === trimmed.toLowerCase())) {
      return; // duplicate
    }
    setPriorities((prev) => [...prev, { id: String(nextId++), label: trimmed }]);
    setNewPriority("");
    setShowInput(false);
  };

  const handleRemovePriority = (id: string) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id));
  };
  
  const handleFinishSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const topics = priorities.map((p) => p.label);
      const res = await updatePreferences(undefined, topics);
      if (!res.success) {
        setError(res.error ?? "Failed to save priorities.");
        return;
      }
      navigate("/today");
    } catch (err) {
      console.error("Error finishing setup:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FFF9F4] px-8">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <h1 className="text-4xl font-semibold tracking-wide text-[#A34712]">Setup</h1>

          {error && (
            <div className="rounded-xl border border-[#fecdd3] bg-[#fee2e2] px-4 py-3">
              <p className="text-sm font-medium text-[#ef4444]">{error}</p>
            </div>
          )}

          <div className="text-left">
            <p className="mb-4 text-lg font-medium text-[#A34712]">Order Priorities:</p>
            <div className="space-y-2.5">
              {priorities.map((priority) => (
                <div
                  key={priority.id}
                  draggable
                  onDragStart={() => handleDragStart(priority.id)}
                  onDragOver={(e) => handleDragOver(e, priority.id)}
                  onDrop={handleDrop}
                  className="flex items-center justify-between rounded-full bg-[#F8B98C] px-4 py-2.5 text-[#3F2A1E] shadow-sm"
                >
                  <div className="flex items-center gap-3 text-base leading-tight">
                    <span className="text-lg text-[#7A4A2D]" aria-label="drag handle">
                      ⋮⋮
                    </span>
                    <span>{priority.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePriority(priority.id)}
                    className="text-lg text-[#3F2A1E] hover:text-[#ef4444] transition-colors"
                    aria-label={`Remove ${priority.label}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {showInput ? (
              <div className="flex w-full items-center gap-2">
                <input
                  type="text"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddPriority();
                    if (e.key === "Escape") { setShowInput(false); setNewPriority(""); }
                  }}
                  placeholder="Type a priority name..."
                  autoFocus
                  className="flex-1 rounded-full border border-[#C86C2F] bg-white px-4 py-3 text-base text-[#3F2A1E] placeholder:text-[#9CA3AF] focus:border-[#A34712] focus:outline-none focus:ring-2 focus:ring-[#A34712]/25"
                />
                <button
                  type="button"
                  onClick={handleAddPriority}
                  disabled={!newPriority.trim()}
                  className="rounded-full bg-[#A34712] px-5 py-3 text-base font-medium text-white transition hover:bg-[#8B3A0F] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInput(false); setNewPriority(""); }}
                  className="rounded-full border border-[#C86C2F] bg-white px-4 py-3 text-base text-[#3F2A1E] transition hover:bg-[#FFF9F4]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowInput(true)}
                className="flex w-full items-center justify-center rounded-[24px] border border-dashed border-[#7A4A2D] bg-[#FFF9F4] px-4 py-4 text-lg font-medium text-[#3F2A1E] shadow-sm transition hover:bg-[#F8E7DD]"
              >
                + Add Priorities
              </button>
            )}

            <button
              onClick={handleFinishSetup}
              disabled={loading}
              className="mx-auto block w-52 rounded-md bg-[#A34712] py-3 text-base font-medium text-white transition-opacity disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Finish setup"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
