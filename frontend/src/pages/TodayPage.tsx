import React, { useEffect, useRef, useState } from "react";
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
  const [importantEmails, setImportantEmails] = useState<ImportantEmailPreview[]>(() => [...IMPORTANT_EMAILS_FILLER]);
  const [slidingEmailIds, setSlidingEmailIds] = useState<Set<string>>(new Set());
  const [closingEmailIds, setClosingEmailIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ email: ImportantEmailPreview; index: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  // Reset important emails to the placeholder set on mount (helps restore if any were dismissed previously)
  useEffect(() => {
    setImportantEmails([...IMPORTANT_EMAILS_FILLER]);
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

  const triggerEmailSlide = (id: string) => {
    setSlidingEmailIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const completeEmail = (mail: ImportantEmailPreview, index: number) => {
    handleOpenEmail(mail);
    triggerEmailSlide(mail.id);

    // Start closing slightly after slide begins so glow is visible
    const closeTimer = setTimeout(() => {
      setClosingEmailIds((prev) => {
        const next = new Set(prev);
        next.add(mail.id);
        return next;
      });
    }, 220);

    const removeTimer = setTimeout(() => {
      setImportantEmails((prev) => prev.filter((m) => m.id !== mail.id));
      setSlidingEmailIds((prev) => {
        const next = new Set(prev);
        next.delete(mail.id);
        return next;
      });
      setClosingEmailIds((prev) => {
        const next = new Set(prev);
        next.delete(mail.id);
        return next;
      });
    }, 520);

    // Show undo toast
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ email: mail, index });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(removeTimer);
    };
  };

  const undoLastRemoval = () => {
    if (!toast) return;
    const { email, index } = toast;
    setImportantEmails((prev) => {
      const next = [...prev];
      next.splice(index, 0, email);
      return next;
    });
    setSlidingEmailIds((prev) => {
      const next = new Set(prev);
      next.delete(email.id);
      return next;
    });
    setClosingEmailIds((prev) => {
      const next = new Set(prev);
      next.delete(email.id);
      return next;
    });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  const resetImportantEmails = () => {
    setImportantEmails([...IMPORTANT_EMAILS_FILLER]);
    setSlidingEmailIds(new Set());
    setClosingEmailIds(new Set());
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  const DEFAULT_COLOR = "#E5E7EB"; // TEMP: pastel fallback

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                      workspace_premium
                    </span>
                    <span>Weekly Progress</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <span className="text-right">Tasks Completed</span>
                    <span className="text-sm text-right">
                      <span className="font-semibold text-[#f9ab7b]">
                        {progress.completedTasks}
                      </span>
                      <span className="text-[#9CA3AF]">/{progress.totalTasks}</span>
                    </span>
                  </div>
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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                      star
                    </span>
                    <span>Important Emails</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetImportantEmails}
                    className="text-xs font-semibold text-[#f9ab7b] underline underline-offset-4 transition-colors hover:text-[#f0a068]"
                  >
                    Reset (temp)
                  </button>
                </div>

                <div className="mt-3 pl-2.5 sm:pl-3.5">
                  {importantEmails.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#6B7280]">
                      <span className="material-symbols-outlined text-base text-[#34d399]">task_alt</span>
                      <span>That’s everything!</span>
                    </div>
                  ) : (
                    importantEmails.map((mail, index) => {
                      const isSliding = slidingEmailIds.has(mail.id);
                      const isClosing = closingEmailIds.has(mail.id);
                      const visualStyle: React.CSSProperties = {
                        borderBottom: index === importantEmails.length - 1 ? "none" : "0.5px solid #E5E7EB",
                      };
                      if (isSliding || isClosing) {
                        visualStyle.boxShadow = isClosing
                          ? "0 6px 18px rgba(34, 197, 94, 0.22), 0 0 0 1px rgba(34, 197, 94, 0.14)"
                          : "0 10px 26px rgba(34, 197, 94, 0.30), 0 0 0 1px rgba(34, 197, 94, 0.18)";
                        visualStyle.backgroundColor = "rgba(236, 253, 243, 0.9)";
                      }

                      return (
                        <div
                          key={mail.id}
                          className={`tagged-item group flex items-start gap-3 py-2 email-row ${isSliding ? "email-row--slide-up" : ""} ${isClosing ? "email-row--closing" : ""}`}
                          style={visualStyle}
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
                              onClick={() => completeEmail(mail, index)}
                              className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Mark email from ${mail.sender} complete`}
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
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

                <div className="mt-3 space-y-1 pl-2.5 sm:pl-3.5">
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

        {toast && (
          <div className="pointer-events-auto fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#111827] shadow-[0_12px_32px_rgba(0,0,0,0.18)] border border-[#E5E7EB]">
              <span>Marked as read —</span>
              <button
                type="button"
                onClick={undoLastRemoval}
                className="rounded-full border border-[#34d399] px-3 py-1 text-xs font-semibold text-[#047857] transition-colors hover:bg-[#ecfdf3] focus:outline-none focus:ring-2 focus:ring-[#34d399]"
              >
                Undo
              </button>
            </div>
          </div>
        )}

        <AppNavbar />
      </div>
    </div>
  );
};

export default TodayPage;
