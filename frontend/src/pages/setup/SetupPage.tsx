import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<Priority[]>(initialPriorities);
  const [dragId, setDragId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  
  const handleFinishSetup = async () => {
    setLoading(true);
    try {
      // TODO: Save priorities to backend if needed
      // For now, just navigate to the main dashboard
      navigate("/today");
    } catch (err) {
      console.error("Error finishing setup:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FFF9F4] px-8">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <h1 className="text-4xl font-semibold tracking-wide text-[#A34712]">Setup</h1>

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
                  <span className="text-lg text-[#3F2A1E]" aria-hidden>
                    🗑️
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <button className="flex w-full items-center justify-center rounded-[24px] border border-dashed border-[#7A4A2D] bg-[#FFF9F4] px-4 py-4 text-lg font-medium text-[#3F2A1E] shadow-sm">
              + Add Priorities
            </button>

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
