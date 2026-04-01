import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  ConnectedDaysFilter,
  getDateForWeekdayInAnchorWeek,
  isSameLocalDay,
  useDayFilter,
  useWeekAnchorWithSharedDayFilter,
} from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import {
  getTaskProgress,
  loadTasks,
  subscribeToTaskUpdates,
} from "../services/taskProgress";
import filterIcon from "../assets/page_buttons/filter.png";
import {
  getCategoryById,
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import {
  getUserEmails,
  syncEmails,
  type ProcessedEmail,
} from "../services/api";

/**
 * Important email preview shown on Today.
 * Backend can map directly into this shape once endpoint is ready.
 */
type ImportantEmailPreview = {
  id: string;
  sender: string;
  source: "gmail" | "outlook";
  tone: "urgent" | "soon" | "done";
  summary: string;
  priority?: "urgent";
  tagCategoryId?: string;
  date: string;
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  title: string;
  tagCategoryId?: string;
  date: string;
};

const extractSenderName = (raw: string): string => {
  if (!raw) return "Unknown sender";
  const match = raw.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : raw.replace(/<[^>]+>/, "").trim() || raw;
};

const mapEmailToPreview = (e: ProcessedEmail): ImportantEmailPreview => {
  const dateStr = e.receivedAt ? e.receivedAt.slice(0, 10) : "";
  const tone: ImportantEmailPreview["tone"] =
    e.priorityLevel === 1 ? "urgent" : e.priorityLevel <= 3 ? "soon" : "done";
  return {
    id: e.id,
    sender: extractSenderName(e.sender),
    source: e.source === "outlook" ? "outlook" : "gmail",
    tone,
    summary: e.summary || e.subject,
    priority: e.priorityLevel === 1 ? "urgent" : undefined,
    tagCategoryId: `priority-${e.priorityLevel}`,
    date: dateStr,
  };
};

const extractEventsFromEmails = (emails: ProcessedEmail[]): TodayEvent[] => {
  const events: TodayEvent[] = [];
  for (const e of emails) {
    if (e.events?.length) {
      const dateStr = e.receivedAt ? e.receivedAt.slice(0, 10) : "";
      for (const ev of e.events) {
        events.push({
          time: e.time || "",
          title: ev,
          tagCategoryId: `priority-${e.priorityLevel}`,
          date: dateStr,
        });
      }
    }
  }
  return events;
};

const parseIsoDate = (value?: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const TodayPage: React.FC = () => {
  const { selectedDay } = useDayFilter();
  const { weekAnchor, handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();

  const selectedCalendarDate = useMemo(
    () => getDateForWeekdayInAnchorWeek(weekAnchor, selectedDay),
    [weekAnchor, selectedDay],
  );

  const [progress, setProgress] = useState(() => getTaskProgress(loadTasks()));
  const [importantEmails, setImportantEmails] = useState<ImportantEmailPreview[]>([]);
  const [events, setEvents] = useState<TodayEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [slidingEmailIds, setSlidingEmailIds] = useState<Set<string>>(new Set());
  const [closingEmailIds, setClosingEmailIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ email: ImportantEmailPreview; index: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const categories = useUserCategories();

  const loadEmails = useCallback(async () => {
    const resp = await getUserEmails();
    if (resp.success && resp.data?.emails) {
      setImportantEmails(resp.data.emails.map(mapEmailToPreview));
      setEvents(extractEventsFromEmails(resp.data.emails));
    }
  }, []);

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  useEffect(() => {
    void loadEmails();

    setIsSyncing(true);
    syncEmails()
      .then(() => loadEmails())
      .finally(() => setIsSyncing(false));
  }, [loadEmails]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  const getSourceIcon = (source: ImportantEmailPreview["source"]) => {
    if (source === "gmail") {
      return null;
    }

    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#5C9BFF] text-[10px] font-bold text-white">
        O
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

  const dateFilteredEmails = useMemo(
    () =>
      importantEmails.filter((mail) => {
        const d = parseIsoDate(mail.date);
        return d ? isSameLocalDay(d, selectedCalendarDate) : true;
      }),
    [importantEmails, selectedCalendarDate],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const d = parseIsoDate(event.date);
        return d ? isSameLocalDay(d, selectedCalendarDate) : true;
      }),
    [events, selectedCalendarDate],
  );

  const availableCategories = Array.from(
    new Set(dateFilteredEmails.map((mail) => mail.tagCategoryId).filter(Boolean))
  ) as string[];
  const filteredEmails =
    selectedFilter === "all"
      ? dateFilteredEmails
      : dateFilteredEmails.filter((mail) => mail.tagCategoryId === selectedFilter);

  const formatCategoryLabel = (id?: string) => {
    if (!id) return "Uncategorized";
    return getCategoryById(categories, id)?.name ?? id;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <ConnectedDaysFilter className="!mt-0" />

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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                      star
                    </span>
                    <span>Important Emails</span>
                    {isSyncing && (
                      <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">syncing…</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pr-1">
                    <div className="relative" ref={filterMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen((o) => !o)}
                        className="inline-flex items-center justify-center rounded-full border border-transparent bg-transparent px-0.5 py-0.5 transition hover:opacity-80 focus:outline-none focus:ring-0"
                        aria-haspopup="listbox"
                        aria-expanded={isFilterOpen}
                        aria-label="Filter important emails"
                      >
                        <img
                          src={filterIcon}
                          alt=""
                          className="h-6 w-6"
                          style={{
                            filter:
                              "invert(81%) sepia(52%) saturate(1330%) hue-rotate(324deg) brightness(99%) contrast(98%)",
                          }}
                        />
                      </button>
                      {isFilterOpen && (
                        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition hover:bg-[#f8fafc] ${selectedFilter === "all" ? "bg-[#f0fdf4] font-semibold text-[#065f46]" : "text-[#111827]"}`}
                            onClick={() => {
                              setSelectedFilter("all");
                              setIsFilterOpen(false);
                            }}
                          >
                            <span>All</span>
                            {selectedFilter === "all" && (
                              <span className="material-symbols-outlined text-[14px] text-[#10b981] opacity-80">done</span>
                            )}
                          </button>
                          {availableCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition hover:bg-[#f8fafc] ${selectedFilter === category ? "bg-[#f0fdf4] font-semibold text-[#065f46]" : "text-[#111827]"}`}
                              onClick={() => {
                                setSelectedFilter(category);
                                setIsFilterOpen(false);
                              }}
                            >
                              <span className="capitalize">{formatCategoryLabel(category)}</span>
                              {selectedFilter === category && (
                                <span className="material-symbols-outlined text-[14px] text-[#10b981] opacity-80">done</span>
                              )}
                            </button>
                          ))}
                          {availableCategories.length === 0 && (
                            <div className="px-2.5 py-1.5 text-xs text-[#6B7280]">No categories yet</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pl-2.5 sm:pl-3.5">
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
                          className={`tagged-item group flex items-start gap-3 py-2 email-row ${isSliding ? "email-row--slide-up" : ""} ${isClosing ? "email-row--closing" : ""}`}
                          style={visualStyle}
                        >
                          <div
                            aria-hidden="true"
                            className="color-line h-12 w-[6px] self-center rounded-full"
                            style={{
                              backgroundColor: getCategoryColorById(categories, mail.tagCategoryId),
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
                  {filteredEvents.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No events on this day.</p>
                  ) : (
                  filteredEvents.map((event, index) => {
                    return (
                      <div
                        key={event.title}
                        className="tagged-item group flex items-start gap-3 py-1 text-sm text-[#1F2933]"
                        style={{ borderBottom: index === filteredEvents.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <div
                          aria-hidden="true"
                          className="color-line h-10 w-[6px] self-center rounded-full"
                          style={{ backgroundColor: getCategoryColorById(categories, event.tagCategoryId) }}
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                          <div className="flex items-center justify-between gap-3 pr-4">
                            <span className="text-sm font-semibold text-[#111827] truncate">
                              {event.title}
                            </span>
                            <span className="text-xs font-medium text-[#6B7280] whitespace-nowrap">
                              {event.time}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                  )}
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
