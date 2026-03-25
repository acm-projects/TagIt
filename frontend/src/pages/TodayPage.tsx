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
  summary: string;
  priority?: "urgent";
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
    summary: "Recruiter requested availability for next round; check attached timeline and confirm slots.",
    priority: "urgent",
  },
  {
    id: "mail-2",
    sender: "Club meeting today",
    source: "gmail",
    tone: "soon",
    summary: "Agenda covers officer elections, budget approval, and venue change for next semester events.",
  },
  {
    id: "mail-3",
    sender: "Tution deadline reminder",
    source: "gmail",
    tone: "done",
    summary: "Billing portal shows outstanding balance due Friday; late fee applies after 5 PM CST.",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
    tone: "soon",
    summary: "Project checkpoint moved to next Monday; submit design doc draft before lab session.",
    priority: "urgent",
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
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-5 space-y-4 sm:mt-6">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    workspace_premium
                  </span>
                  <span>Weekly Progress</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Tasks Completed</span>
                  <span className="text-sm">
                    <span className="font-semibold text-[#f9ab7b]">
                      {progress.completedTasks}
                    </span>
                    <span className="text-[#9CA3AF]">/{progress.totalTasks}</span>
                  </span>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-[#fde6d7]">
                  <div
                    className="h-2 rounded-full bg-[#f9ab7b] transition-[width] duration-200 ease-out"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
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
                          className="mt-0.5 h-full w-1 self-stretch rounded-full bg-[#f9ab7b]"
                        />

                        <button
                          type="button"
                          onClick={() => handleOpenEmail(mail)}
                          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#111827]">
                              {mail.sender}
                            </span>
                            {mail.priority && (
                              <span
                                className="rounded-full border border-[#fecdd3] bg-[#fee2e2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ef4444]"
                              >
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="w-full truncate text-[12px] text-[#6B7280]">
                            {mail.summary}
                          </p>
                          {mail.source !== "gmail" && (
                            <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                              {getSourceIcon(mail.source)}
                              <span className="capitalize">{mail.source}</span>
                            </div>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(mail)}
                            className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
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
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    event_note
                  </span>
                  <span>Upcoming Events</span>
                </div>

                <div className="mt-3 space-y-3">
                  {EVENTS.map((event, index) => {
                    const chipStyles =
                      index === 0
                        ? "bg-[#DBEAFE] text-[#1D4ED8]"
                        : index === 1
                        ? "bg-[#fde6d7] text-[#f9ab7b]"
                        : "bg-[#E7F6EA] text-[#22A06B]";

                    return (
                      <div
                        key={event.title}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-2 text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)]"
                      >
                        <div className="flex flex-1 items-center gap-3 sm:gap-4">
                          <span className="text-[14px] font-semibold text-[#111827]">
                            {event.title}
                          </span>
                          <span className="text-xs font-medium text-[#6B7280] whitespace-nowrap">
                            {event.time}
                          </span>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${chipStyles}`}>
                          {index === 0 ? "meeting" : index === 1 ? "presentation" : "workshop"}
                        </span>
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
