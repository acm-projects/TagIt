import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import WeekHeader from "../components/WeekHeader";
import {
  getTaskProgress,
  loadTasks,
  subscribeToTaskUpdates,
} from "../services/taskProgress";
import TagiWeeklyProgressMascot from "../components/TagiWeeklyProgressMascot";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import FilterMenuButton, { type FilterOption } from "../components/FilterMenuButton";
import { loadConnectedEmails } from "../services/connectedUser";

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
  /** Email account the message belongs to (user can have multiple accounts). */
  accountEmail: string;
  priority?: "urgent";
  tagCategoryId?: string;
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  date: string;
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
    accountEmail: "primary@university.edu",
    priority: "urgent",
    tagCategoryId: "priority-3",
  },
  {
    id: "mail-2",
    sender: "Club meeting today",
    source: "gmail",
    tone: "soon",
    summary: "Agenda covers officer elections, budget approval, and venue change for next semester events.",
    accountEmail: "primary@university.edu",
    tagCategoryId: "priority-1",
  },
  {
    id: "mail-3",
    sender: "Tution deadline reminder",
    source: "gmail",
    tone: "done",
    summary: "Billing portal shows outstanding balance due Friday; late fee applies after 5 PM CST.",
    accountEmail: "finance@university.edu",
    tagCategoryId: "priority-4",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
    tone: "soon",
    summary: "Project checkpoint moved to next Monday; submit design doc draft before lab session.",
    accountEmail: "primary@university.edu",
    priority: "urgent",
    tagCategoryId: "priority-2",
  },
  {
    id: "mail-5",
    sender: "Career Center Digest",
    source: "gmail",
    tone: "soon",
    summary: "Two on-campus career fairs open registration this week; RSVP to reserve an early slot.",
    accountEmail: "career@university.edu",
    tagCategoryId: "priority-3",
  },
];

const assignAccountsToEmails = (emails: string[]): ImportantEmailPreview[] => {
  if (emails.length === 0) return IMPORTANT_EMAILS_FILLER;
  return IMPORTANT_EMAILS_FILLER.map((mail, index) => ({
    ...mail,
    accountEmail: emails[index % emails.length],
  }));
};

const EVENTS: TodayEvent[] = [
  { date: "Tue, Apr 01", time: "03:00 - 03:30", title: "Exam Prep", tagCategoryId: "priority-2" },
  { date: "Tue, Apr 01", time: "04:00 - 05:30", title: "Government Class", tagCategoryId: "priority-2" },
  { date: "Wed, Apr 02", time: "08:30 - 10:00", title: "ACM Meeting @ SLC", tagCategoryId: "priority-1" },
  { date: "Thu, Apr 03", time: "12:15 - 01:00", title: "Resume Review Drop-In", tagCategoryId: "priority-3" },
];

const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => getTaskProgress(loadTasks()));
  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());
  const [importantEmails, setImportantEmails] = useState<ImportantEmailPreview[]>(() =>
    assignAccountsToEmails(loadConnectedEmails())
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [slidingEmailIds, setSlidingEmailIds] = useState<Set<string>>(new Set());
  const [closingEmailIds, setClosingEmailIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ email: ImportantEmailPreview; index: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categories = useUserCategories();
  const tagiWeeklyLine = "Hello there!";

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  // Reset important emails to the placeholder set on mount (helps restore if any were dismissed previously)
  useEffect(() => {
    setImportantEmails(assignAccountsToEmails(connectedEmails));
  }, []);

  useEffect(() => {
    const emails = loadConnectedEmails();
    setConnectedEmails(emails);
    setImportantEmails(assignAccountsToEmails(emails));
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

  const availableAccounts =
    connectedEmails.length > 0
      ? connectedEmails
      : Array.from(new Set(importantEmails.map((mail) => mail.accountEmail || "Unknown account")));

  const filteredEmails =
    selectedFilter === "all"
      ? importantEmails
      : importantEmails.filter(
          (mail) => (mail.accountEmail || "Unknown account") === selectedFilter
        );

  const filterOptions: FilterOption[] = [{ value: "all", label: "All" }].concat(
    availableAccounts.map((account) => ({
      value: account,
      label: account,
    }))
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined shrink-0 text-[18px] text-[#f9ab7b]">
                    workspace_premium
                  </span>
                  <div className="min-w-0 flex-1 pr-16 sm:pr-20">
                    <div className="text-[15px] font-semibold leading-tight text-[#1F2933]">
                      Weekly Progress
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs leading-tight text-[#6B7280]">
                      <span>Tasks Completed</span>
                      <span className="text-sm">
                        <span className="font-semibold text-[#f9ab7b]">
                          {progress.completedTasks}
                        </span>
                        <span className="text-[#9CA3AF]">/{progress.totalTasks}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-[5px]">
                  <TagiWeeklyProgressMascot
                    progressPercentage={progress.progressPercentage}
                    message={tagiWeeklyLine}
                    onClick={() => navigate("/chatbot")}
                  />
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                      star
                    </span>
                    <span>Important Emails</span>
                  </div>
                  <div className="flex items-center gap-2 pr-1">
                    <FilterMenuButton
                      options={filterOptions}
                      selectedValue={selectedFilter}
                      onSelect={setSelectedFilter}
                      ariaLabel="Filter important emails"
                      emptyMessage="No accounts yet"
                    />
                  </div>
                </div>

                <div className="mt-3 pl-2.5 sm:pl-3.5 space-y-0.5">
                  {filteredEmails.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#6B7280]">
                      <span className="material-symbols-outlined text-base text-[#34d399]">task_alt</span>
                      <span>That’s everything!</span>
                    </div>
                  ) : (
                    filteredEmails.map((mail, index) => {
                      const isSliding = slidingEmailIds.has(mail.id);
                      const isClosing = closingEmailIds.has(mail.id);
                      const visualStyle: React.CSSProperties = {
                        borderBottom: index === filteredEmails.length - 1 ? "none" : "0.5px solid #E5E7EB",
                      };
                      if (isSliding || isClosing) {
                        visualStyle.boxShadow = isClosing
                          ? "0 8px 14px rgba(34, 197, 94, 0.12)"
                          : "0 10px 18px rgba(34, 197, 94, 0.16)";
                        visualStyle.borderBottom = "1px solid rgba(34, 197, 94, 0.45)";
                        visualStyle.backgroundColor = "transparent";
                      }

                      return (
                        <div
                          key={mail.id}
                          className={`tagged-item group flex items-start gap-2.5 py-1.5 text-[13px] email-row ${isSliding ? "email-row--slide-up" : ""} ${isClosing ? "email-row--closing" : ""}`}
                          style={visualStyle}
                        >
                          <div
                            aria-hidden="true"
                            className="color-line h-10 w-[6px] self-center rounded-full"
                            style={{
                              backgroundColor: getCategoryColorById(categories, mail.tagCategoryId),
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => handleOpenEmail(mail)}
                            className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-[#111827]">
                                {mail.sender}
                              </span>
                            </div>
                            <p className="w-full truncate text-[12px] text-[#6B7280] leading-tight">
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

                <div className="mt-3 space-y-0.5 pl-2.5 sm:pl-3.5">
                  {EVENTS.map((event, index) => {
                    return (
                      <div
                        key={event.title}
                        className="tagged-item group flex items-start gap-2.5 py-0.5 text-sm text-[#1F2933]"
                        style={{ borderBottom: index === EVENTS.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <div
                          aria-hidden="true"
                          className="color-line h-9 w-[6px] self-center rounded-full"
                          style={{ backgroundColor: getCategoryColorById(categories, event.tagCategoryId) }}
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                          <div className="flex items-center justify-between gap-3 pr-4">
                            <span className="text-sm font-semibold text-[#111827] truncate">
                              {event.title}
                            </span>
                            <div className="flex items-center gap-2 whitespace-nowrap text-[12px] font-medium text-[#6B7280]">
                              <span>{event.date}</span>
                              <span className="text-[#D1D5DB]">•</span>
                              <span>{event.time}</span>
                            </div>
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
              <span>Marked as read </span>
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
