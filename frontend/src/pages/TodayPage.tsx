import React, { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";
import {
  getTaskProgress,
  loadTasks,
  subscribeToTaskUpdates,
} from "../services/taskProgress";

/**
 * Important email preview shown on Today.
 * Backend can map directly into this shape once endpoint is ready.
 */
type ImportantEmailPreview = {
  id: string;
  sender: string;
  source: "gmail" | "handshake";
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  title: string;
};

const IMPORTANT_EMAILS_FILLER: ImportantEmailPreview[] = [
  {
    id: "mail-1",
    sender: "John Mathew @Verizon @Handshake",
    source: "gmail",
  },
  {
    id: "mail-2",
    sender: "John Mathew @Toyota @Handshake",
    source: "handshake",
  },
  {
    id: "mail-3",
    sender: "John Mathew @ACM",
    source: "handshake",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
  },
];

const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep" },
  { time: "04:00 - 05:30", title: "Government Class" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC" },
];

const TodayPage: React.FC = () => {
  const [progress, setProgress] = useState(() => getTaskProgress(loadTasks()));

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  const getSourceIcon = (source: ImportantEmailPreview["source"]) => {
    if (source === "gmail") {
      return (
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#D14836] text-[10px] font-bold text-white">
          M
        </span>
      );
    }

    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#1E70C1] text-[10px] font-bold text-white">
        H
      </span>
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8E7DD] p-4">
      <div className="flex min-h-0 flex-1 w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-8 py-6 text-[#913c14]">
          <DateHeader date="02/18/2026" />

          <section className="mt-8 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                workspace_premium
              </span>
              <span>Progress</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-2 flex-1 rounded-full bg-[#FFF0E5]">
                <div
                  className="h-2 rounded-full bg-[#BA4500] transition-[width] duration-200 ease-out"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-[#BA4500]">
                {progress.progressPercentage}%
              </span>
            </div>

            <p className="mt-2 text-xs text-[#A34712]">
              {progress.completedTasks}/{progress.totalTasks} tasks completed
            </p>
          </section>

          <section className="mt-8 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                star
              </span>
              <span>Important Emails</span>
            </div>

            <div className="mt-3 space-y-3">
              {IMPORTANT_EMAILS_FILLER.map((mail, index) => {
                const background =
                  index === 0
                    ? "bg-[#FFF0E5]"
                    : index === 1
                    ? "bg-[#FAE6D9]"
                    : "bg-[#FED3B4]";

                return (
                  <button
                    key={mail.id}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-sm text-[#6D2F12] ${background}`}
                  >
                    <div className="flex items-center gap-3">
                      {getSourceIcon(mail.source)}
                      <span>{mail.sender}</span>
                    </div>

                    <span className="inline-flex h-7 min-w-[60px] items-center justify-center rounded-full bg-[#D75B00] px-4 text-sm font-semibold text-white">
                      Open
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-10 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                event_note
              </span>
              <span>Upcoming Events</span>
            </div>

            <div className="mt-3 space-y-3">
              {EVENTS.map((event, index) => {
                const background =
                  index === 0
                    ? "bg-[#FFF0E5]"
                    : index === 1
                    ? "bg-[#FAE6D9]"
                    : "bg-[#FED3B4]";

                return (
                  <div
                    key={event.title}
                    className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm text-[#6D2F12] ${background}`}
                  >
                    <span className="text-sm font-medium">{event.time}</span>
                    <span className="ml-6 flex-1 text-right md:text-left">
                      {event.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TodayPage;
