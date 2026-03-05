import React, { useState } from "react";

type Priority = {
  id: string;
  label: string;
};

function TrashIcon({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </span>
  );
}

const initialPriorities: Priority[] = [
  { id: "1", label: "Club Events" },
  { id: "2", label: "Class/Assignment Notifications" },
  { id: "3", label: "Job/Internship Opportunities" },
  { id: "4", label: "Deadlines" },
];

const SetupPage: React.FC = () => {
  const [priorities, setPriorities] = useState<Priority[]>(initialPriorities);
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDragStart = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    setDragId(id);
    // Remove default drag preview (non-rounded box) and green plus by using a transparent image
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, overId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
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

  const handleRemovePriority = (id: string) => {
    setPriorities((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FFF9F4] px-8">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <h1 className="mb-4 font-instrument text-5xl font-normal text-[#A34712]">Setup</h1>

          <div className="text-left">
            <p className="mb-4 text-lg font-medium text-[#A34712]">Order Priorities:</p>
            <div className="space-y-2.5">
              {priorities.map((priority) => (
                <div
                  key={priority.id}
                  draggable
                  onDragStart={(e) => handleDragStart(priority.id, e)}
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
                    className="shrink-0 rounded-full p-2 text-[#7A4A2D] hover:bg-[#F7C9AA]/50 transition-colors"
                    aria-label={`Remove ${priority.label}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <button className="flex w-full items-center justify-center rounded-[24px] border border-dashed border-[#7A4A2D] bg-[#FFF9F4] px-4 py-4 text-lg font-medium text-[#3F2A1E] shadow-sm">
              + Add Priorities
            </button>

            <button className="mx-auto block w-52 rounded-md bg-[#A34712] py-3 text-base font-medium text-white">
              Finish setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
