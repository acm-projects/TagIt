import React, { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import WeekHeader from "../components/WeekHeader";
import {
  getTaskProgress,
  loadTasks,
  subscribeToTaskUpdates,
} from "../services/taskProgress";
// TEMP: remove after backend integration. Hardcoded color map for visual check.
import { getTempCategoryColor } from "../services/tempCategoryColors";

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
  tagCategoryId?: string;
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  title: string;
  tagCategoryId?: string;
};

const IMPORTANT_EMAILS_FILLER: ImportantEmailPreview[] = [
  {
    id: "mail-1",
    sender: "Internship Application Update @Amazon",
    source: "gmail",
    tone: "urgent",
    summary: "Recruiter requested availability for next round; check attached timeline and confirm slots.",
    priority: "urgent",
    tagCategoryId: "urgent",
  },
  {
    id: "mail-2",
    sender: "Club meeting today",
    source: "gmail",
    tone: "soon",
    summary: "Agenda covers officer elections, budget approval, and venue change for next semester events.",
    tagCategoryId: "personal",
  },
  {
    id: "mail-3",
    sender: "Tution deadline reminder",
    source: "gmail",
    tone: "done",
    summary: "Billing portal shows outstanding balance due Friday; late fee applies after 5 PM CST.",
    tagCategoryId: "school",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
    tone: "soon",
    summary: "Project checkpoint moved to next Monday; submit design doc draft before lab session.",
    priority: "urgent",
    tagCategoryId: "work",
  },
];

const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep", tagCategoryId: "school" },
  { time: "04:00 - 05:30", title: "Government Class", tagCategoryId: "school" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC", tagCategoryId: "work" },
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

  const DEFAULT_COLOR = "#E5E7EB"; // TEMP: pastel fallback

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-4 py-2 shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
                <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    workspace_premium
                  </span>
                  <span>Weekly Progress</span>
                </div>

                <div className="mt-0 flex items-center justify-end gap-2 text-xs text-[#6B7280]">
                  <span className="text-right">Tasks Completed</span>
                  <span className="text-sm text-right">
                    <span className="font-semibold text-[#f9ab7b]">
                      {progress.completedTasks}
                    </span>
                    <span className="text-[#9CA3AF]">/{progress.totalTasks}</span>
                  </span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-[#fde6d7]">
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
                        className="tagged-item group flex items-start gap-3 py-2"
                        style={{ borderBottom: index === importantEmails.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <div
                          aria-hidden="true"
                          className="color-line h-full w-[4px] self-stretch rounded-full"
                          style={{
                            backgroundColor: getTempCategoryColor(mail.tagCategoryId) ?? DEFAULT_COLOR,
                          }}
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

                <div className="mt-3 space-y-1">
                  {EVENTS.map((event, index) => {
                    return (
                      <div
                        key={event.title}
                        className="tagged-item group flex items-start gap-3 py-1 text-sm text-[#1F2933]"
                        style={{ borderBottom: index === EVENTS.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <div
                          aria-hidden="true"
                          className="color-line h-full w-[4px] self-stretch rounded-full"
                          style={{ backgroundColor: getTempCategoryColor(event.tagCategoryId) ?? DEFAULT_COLOR }}
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#111827]">
                              {event.title}
                            </span>
                            <span className="text-xs font-medium text-[#6B7280] whitespace-nowrap">
                              {event.time}
                            </span>
                          </div>
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
