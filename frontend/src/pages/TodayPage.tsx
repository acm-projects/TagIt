import React, { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import WeekHeader from "../components/WeekHeader";
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
  tone: "urgent" | "soon" | "done";
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
    sender: "Internship Application Update @Amazon",
    source: "gmail",
    tone: "urgent",
  },
  {
    id: "mail-2",
    sender: "Club meeting today",
    source: "gmail",
    tone: "soon",
  },
  {
    id: "mail-3",
    sender: "Tution deadline reminder",
    source: "gmail",
    tone: "done",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
    tone: "soon",
  },
];

const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep" },
  { time: "04:00 - 05:30", title: "Government Class" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC" },
];

const TodayPage: React.FC = () => {
  const [progress, setProgress] = useState(() => getTaskProgress(loadTasks()));
  const [importantEmails] = useState<ImportantEmailPreview[]>(() => IMPORTANT_EMAILS_FILLER);

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  const getSourceIcon = (source: ImportantEmailPreview["source"]) => {
    if (source === "gmail") {
      return null;
    }

    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#5C9BFF] text-[10px] font-bold text-white">
        H
      </span>
    );
  };

  const handleOpenEmail = (_email: ImportantEmailPreview) => {
    // Placeholder until mail detail/open workflow is wired.
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader />

          <div className="mt-5 space-y-4 sm:mt-6">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#FFAB87]">
                    workspace_premium
                  </span>
                  <span>Weekly Progress</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Tasks Completed</span>
                  <span className="text-sm">
                    <span className="font-semibold text-[#FFAB87]">
                      {progress.completedTasks}
                    </span>
                    <span className="text-[#9CA3AF]">/{progress.totalTasks}</span>
                  </span>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-[#FFE7DC]">
                  <div
                    className="h-2 rounded-full bg-[#FFAB87] transition-[width] duration-200 ease-out"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#FFAB87]">
                    star
                  </span>
                  <span>Important Emails</span>
                </div>

                <div className="mt-3">
                  {importantEmails.map((mail, index) => {
                    return (
                      <div
                        key={mail.id}
                        className="group flex items-start gap-3 py-2"
                        style={{ borderBottom: index === importantEmails.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 h-full w-1 self-stretch rounded-full bg-[#FFAB87]"
                        />

                        <button
                          type="button"
                          onClick={() => handleOpenEmail(mail)}
                          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                        >
                          <span className="text-sm font-semibold text-[#111827]">
                            {mail.sender}
                          </span>
                          <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                            {getSourceIcon(mail.source)}
                            <span className="capitalize">{mail.source}</span>
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(mail)}
                            className="inline-flex h-7 w-7 items-center justify-center text-[#FFAB87] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label={`Open email from ${mail.sender}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
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
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#FFAB87]">
                    event_note
                  </span>
                  <span>Upcoming Events</span>
                </div>

                <div className="mt-3 space-y-3">
                  {EVENTS.map((event, index) => {
                    const chipStyles =
                      index === 0
                        ? "bg-[#E8F0FF] text-[#3B82F6]"
                        : index === 1
                        ? "bg-[#F6E5DE] text-[#C46F41]"
                        : "bg-[#E7F6EA] text-[#22A06B]";

                    return (
                      <div
                        key={event.title}
                        className="flex flex-col gap-1 rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-3 text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="text-xs font-medium text-[#6B7280]">
                          {event.time}
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-3 sm:justify-start">
                          <span className="text-[14px] font-semibold text-[#111827]">
                            {event.title}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${chipStyles}`}>
                            {index === 0 ? "meeting" : index === 1 ? "presentation" : "workshop"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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

export default TodayPage;
