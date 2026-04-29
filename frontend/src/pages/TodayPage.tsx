import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import { isSameLocalDay } from "../components/DaysFilter";
import {
  getTaskProgress,
  loadTasks,
  MASCOT_LAST_COMPLETED_TASKS_KEY,
  subscribeToTaskUpdates,
  type TaskProgress,
} from "../services/taskProgress";
import TagiWeeklyProgressMascot from "../components/TagiWeeklyProgressMascot";
import tagiMascotCopy from "../data/tagiMascotMessages.json";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import {
  getUserEmails,
  syncEmails,
  getUserTasks,
  type ProcessedEmail,
  type EmailTaskItem,
} from "../services/api";
import FilterMenuButton, { type FilterOption } from "../components/FilterMenuButton";
import { loadConnectedEmails } from "../services/connectedUser";
import { getCurrentUsername } from "../services/currentUser";
import {
  getCachedEmails,
  setCachedEmails,
  getCachedEmailItems,
  setCachedEmailItems,
} from "../services/dataCache";
import { loadCompletedEmailTasks } from "../services/completedEmailTasks";

const getDismissedEmailsKey = () => `tagit.dismissed-emails.v1.${getCurrentUsername()}`;

const loadDismissedEmailIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(getDismissedEmailsKey());
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
};

const saveDismissedEmailId = (id: string): void => {
  try {
    const ids = loadDismissedEmailIds();
    ids.add(id);
    localStorage.setItem(getDismissedEmailsKey(), JSON.stringify([...ids]));
  } catch { /* ignore */ }
};

const getFirstSyncSeenKey = () => `tagit.first-sync-seen.v1.${getCurrentUsername()}`;

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
  /** Email account the message belongs to (user can have multiple accounts). */
  accountEmail: string;
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
  date: string;
  title: string;
  tagCategoryId?: string;
};

const extractSenderName = (raw: string): string => {
  if (!raw) return "Unknown sender";
  const match = raw.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : raw.replace(/<[^>]+>/, "").trim() || raw;
};

const localDateFromIso = (receivedAt: string): string => {
  if (!receivedAt) return "";
  const d = new Date(receivedAt);
  if (isNaN(d.getTime())) return receivedAt.slice(0, 10);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dy}`;
};

const mapEmailToPreview = (e: ProcessedEmail): ImportantEmailPreview => {
  const dateStr = e.receivedAt ? localDateFromIso(e.receivedAt) : "";
  const tone: ImportantEmailPreview["tone"] =
    e.priorityLevel === 1 ? "urgent" : e.priorityLevel <= 3 ? "soon" : "done";
  return {
    id: e.id,
    sender: extractSenderName(e.sender),
    source: e.source === "outlook" ? "outlook" : "gmail",
    tone,
    summary: e.summary || e.subject,
    accountEmail: e.source || "",
    priority: e.priorityLevel === 1 ? "urgent" : undefined,
    tagCategoryId: `priority-${e.priorityLevel}`,
    date: dateStr,
  };
};

const extractEventsFromEmails = (emails: ProcessedEmail[]): TodayEvent[] => {
  const events: TodayEvent[] = [];
  for (const e of emails) {
    if (e.events?.length) {
      const dateStr = e.receivedAt ? localDateFromIso(e.receivedAt) : "";
      for (const ev of e.events) {
        let title: string;
        let time: string;
        if (typeof ev === "string") {
          title = ev;
          time = e.time || "";
        } else {
          title = ev.title || ev.location || "Event";
          time = ev.time || e.time || "";
        }
        events.push({
          time,
          title,
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

/** Static events used by the mascot timer for approaching-event messages. */
const EVENTS: TodayEvent[] = [
  { date: "Tue, Apr 01", time: "03:00 - 03:30", title: "Exam Prep", tagCategoryId: "priority-2" },
  { date: "Tue, Apr 01", time: "04:00 - 05:30", title: "Government Class", tagCategoryId: "priority-2" },
  { date: "Wed, Apr 02", time: "08:30 - 10:00", title: "ACM Meeting @ SLC", tagCategoryId: "priority-1" },
  { date: "Thu, Apr 03", time: "12:15 - 01:00", title: "Resume Review Drop-In", tagCategoryId: "priority-3" },
];

const EMAIL_ROW_LEAVE_COLLAPSE_MS = 160;
const EMAIL_EXPAND_AFTER_COLLAPSE_MS = 260;
const EMAIL_BODY_TRANSITION_MS = 320;

const TAGI_EXCITED_MS = 10_000;
const TAGI_NORMAL_ROTATE_MIN_MS = 12 * 60 * 1000;
const TAGI_NORMAL_ROTATE_MAX_MS = 18 * 60 * 1000;

const MONTH_ABBR: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseTodayEventStart(event: TodayEvent): Date | null {
  const parts = event.date.split(/,\s*/);
  const rest = parts[parts.length - 1]?.trim();
  if (!rest) return null;
  const [mon, dayStr] = rest.split(/\s+/);
  const day = parseInt(dayStr, 10);
  const month = MONTH_ABBR[mon ?? ""];
  if (month === undefined || Number.isNaN(day)) return null;
  const year = new Date().getFullYear();
  const startTime = event.time.split("-")[0]?.trim() || "09:00";
  const [h, m] = startTime.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return null;
  return new Date(year, month, day, h, Number.isNaN(m) ? 0 : m, 0, 0);
}

function interpolateMascotTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

function pickRandomLine(lines: string[]): string {
  if (lines.length === 0) return "";
  return lines[Math.floor(Math.random() * lines.length)] ?? "";
}

function getApproachingEventBubbleMessage(
  events: TodayEvent[],
  copy: typeof tagiMascotCopy
): string | null {
  const now = Date.now();
  const soonMs = 2 * 60 * 60 * 1000;
  let best: { start: number; title: string } | null = null;
  for (const e of events) {
    const d = parseTodayEventStart(e);
    if (!d) continue;
    const t = d.getTime();
    if (t < now || t > now + soonMs) continue;
    if (!best || t < best.start) best = { start: t, title: e.title };
  }
  if (!best) return null;
  const maxLen = copy.eventTitleMaxLength ?? 36;
  const title =
    best.title.length > maxLen ? `${best.title.slice(0, maxLen - 1)}…` : best.title;
  return interpolateMascotTemplate(copy.eventSoonTemplate, { title });
}

function pickNormalMascotMessage(
  p: TaskProgress,
  events: TodayEvent[],
  copy: typeof tagiMascotCopy
): string {
  const pool: string[] = [...copy.motivational];
  const eventMsg = getApproachingEventBubbleMessage(events, copy);
  if (eventMsg) pool.push(eventMsg);
  if (p.totalTasks > 0) {
    const remaining = p.totalTasks - p.completedTasks;
    if (remaining === 1) pool.push(...copy.tasksRemainingOne);
    else if (remaining > 1) {
      pool.push(
        interpolateMascotTemplate(copy.tasksRemainingManyTemplate, { count: remaining })
      );
    }
  }
  return pickRandomLine(pool);
}

const TODAY = new Date();

const formatTodayLabel = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  //const selectedCalendarDate = TODAY;

  const computeProgress = useCallback((): TaskProgress => {
    const userTasks = loadTasks();
    const userBase = getTaskProgress(userTasks);
    const completedEmailTasks = loadCompletedEmailTasks();
    const completedKeys = new Set(completedEmailTasks.map((t) => t.key));
    const activeEmailTaskCount = (getCachedEmailItems() ?? [])
      .filter((i) => i.type === "task" && !completedKeys.has(i.key))
      .length;
    const completedEmailCount = completedEmailTasks.length;
    const total = userBase.totalTasks + activeEmailTaskCount + completedEmailCount;
    const completed = userBase.completedTasks + completedEmailCount;
    return {
      totalTasks: total,
      completedTasks: completed,
      progressPercentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, []);

  const [progress, setProgress] = useState(() => computeProgress());
  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());
  const [importantEmails, setImportantEmails] = useState<ImportantEmailPreview[]>(() => {
    const cached = getCachedEmails();
    if (!cached) return [];
    const dismissed = loadDismissedEmailIds();
    const nonSpam = cached.filter((e) => !e.isSpam && !e.uiBadges?.includes("Error") && !dismissed.has(e.id));
    return nonSpam.map(mapEmailToPreview);
  });
  const [events, setEvents] = useState<TodayEvent[]>(() => {
    const cached = getCachedEmails();
    if (!cached) return [];
    const nonSpam = cached.filter((e) => !e.isSpam && !e.uiBadges?.includes("Error"));
    return extractEventsFromEmails(nonSpam);
  });
  const [todayDeadlines, setTodayDeadlines] = useState<EmailTaskItem[]>(() => {
    const cached = getCachedEmailItems();
    if (!cached) return [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 2); end.setHours(23, 59, 59, 999);
    return cached.filter((item) => {
      if (item.type !== "deadline") return false;
      if (item.time) {
        const datePart = item.time.split("T")[0];
        const parts = datePart.split("-").map(Number);
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          return d >= start && d <= end;
        }
      }
      return true;
    });
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFirstTimeUser] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(getFirstSyncSeenKey());
    } catch {
      return false;
    }
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [slidingEmailIds, setSlidingEmailIds] = useState<Set<string>>(new Set());
  const [closingEmailIds, setClosingEmailIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ email: ImportantEmailPreview; index: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const emailLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categories = useUserCategories();
  const [tagiBubble, setTagiBubble] = useState(() => ({
    message: pickNormalMascotMessage(getTaskProgress(loadTasks()), EVENTS, tagiMascotCopy),
    excited: false,
  }));
  const normalRotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excitedEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleNormalRotateRef = useRef<() => void>(() => {});

  const clearNormalRotateTimer = () => {
    if (normalRotateTimerRef.current) {
      clearTimeout(normalRotateTimerRef.current);
      normalRotateTimerRef.current = null;
    }
  };

  useEffect(() => {
    const scheduleNormalRotate = () => {
      clearNormalRotateTimer();
      const delay =
        TAGI_NORMAL_ROTATE_MIN_MS +
        Math.random() * (TAGI_NORMAL_ROTATE_MAX_MS - TAGI_NORMAL_ROTATE_MIN_MS);
      normalRotateTimerRef.current = setTimeout(() => {
        normalRotateTimerRef.current = null;
        setTagiBubble((b) => {
          if (b.excited) return b;
          return {
            message: pickNormalMascotMessage(getTaskProgress(loadTasks()), EVENTS, tagiMascotCopy),
            excited: false,
          };
        });
        scheduleNormalRotateRef.current();
      }, delay);
    };
    scheduleNormalRotateRef.current = scheduleNormalRotate;
    scheduleNormalRotate();
    return () => {
      clearNormalRotateTimer();
      if (excitedEndTimerRef.current) {
        clearTimeout(excitedEndTimerRef.current);
        excitedEndTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let lastSeen = progress.completedTasks;
    try {
      const raw = sessionStorage.getItem(MASCOT_LAST_COMPLETED_TASKS_KEY);
      if (raw != null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) lastSeen = n;
      }
    } catch {
      /* sessionStorage unavailable */
    }

    if (progress.completedTasks <= lastSeen) return;

    const praise = pickRandomLine(tagiMascotCopy.taskPraise);
    try {
      sessionStorage.setItem(MASCOT_LAST_COMPLETED_TASKS_KEY, String(progress.completedTasks));
    } catch {
      /* ignore */
    }

    clearNormalRotateTimer();
    if (excitedEndTimerRef.current) {
      clearTimeout(excitedEndTimerRef.current);
      excitedEndTimerRef.current = null;
    }

    setTagiBubble({ message: praise, excited: true });
    excitedEndTimerRef.current = setTimeout(() => {
      excitedEndTimerRef.current = null;
      setTagiBubble({
        message: pickNormalMascotMessage(getTaskProgress(loadTasks()), EVENTS, tagiMascotCopy),
        excited: false,
      });
      scheduleNormalRotateRef.current();
    }, TAGI_EXCITED_MS);
  }, [progress.completedTasks]);

  const loadEmails = useCallback(async () => {
    const resp = await getUserEmails();
    if (resp.success && resp.data?.emails) {
      setCachedEmails(resp.data.emails);
      const dismissed = loadDismissedEmailIds();
      const nonSpam = resp.data.emails.filter((e) => !e.isSpam && !e.uiBadges?.includes("Error") && !dismissed.has(e.id));
      setImportantEmails(nonSpam.map(mapEmailToPreview));
      setEvents(extractEventsFromEmails(nonSpam));
    }
  }, []);

  const loadDeadlines = useCallback(async () => {
    const resp = await getUserTasks();
    if (resp.success && resp.data?.items) {
      const items = resp.data.items;
      setCachedEmailItems(items);
      const dlStart = new Date(); dlStart.setHours(0, 0, 0, 0);
      const dlEnd = new Date(dlStart); dlEnd.setDate(dlStart.getDate() + 2); dlEnd.setHours(23, 59, 59, 999);
      setTodayDeadlines(items.filter((item) => {
        if (item.type !== "deadline") return false;
        if (item.time) {
          const datePart = item.time.split("T")[0];
          const parts = datePart.split("-").map(Number);
          if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d >= dlStart && d <= dlEnd;
          }
        }
        return true;
      }));
      setProgress(computeProgress());
    }
  }, [computeProgress]);

  useEffect(() => {
    const refreshProgress = () => setProgress(computeProgress());
    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, [computeProgress]);

  useEffect(() => {
    void loadEmails();
    void loadDeadlines();

    setIsSyncing(true);
    syncEmails()
      .then(() => Promise.all([loadEmails(), loadDeadlines()]))
      .finally(() => {
        setIsSyncing(false);
        // Mark that the user has seen the first-sync banner so it never shows again
        try {
          localStorage.setItem(getFirstSyncSeenKey(), "1");
        } catch {
          // ignore
        }
      });
  }, [loadEmails, loadDeadlines]);

  useEffect(() => {
    const emails = loadConnectedEmails();
    setConnectedEmails(emails);
  }, []);

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

  const clearEmailHoverTimers = useCallback(() => {
    if (emailLeaveTimerRef.current !== null) {
      clearTimeout(emailLeaveTimerRef.current);
      emailLeaveTimerRef.current = null;
    }
    if (emailExpandTimerRef.current !== null) {
      clearTimeout(emailExpandTimerRef.current);
      emailExpandTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearEmailHoverTimers(), [clearEmailHoverTimers]);

  const handleEmailRowEnter = useCallback(
    (mailId: string) => {
      clearEmailHoverTimers();
      if (expandedEmailId === mailId) return;
      if (expandedEmailId !== null) {
        setExpandedEmailId(null);
        emailExpandTimerRef.current = setTimeout(() => {
          emailExpandTimerRef.current = null;
          setExpandedEmailId(mailId);
        }, EMAIL_EXPAND_AFTER_COLLAPSE_MS);
        return;
      }
      setExpandedEmailId(mailId);
    },
    [clearEmailHoverTimers, expandedEmailId],
  );

  const handleEmailRowLeave = useCallback(() => {
    clearEmailHoverTimers();
    emailLeaveTimerRef.current = setTimeout(() => {
      emailLeaveTimerRef.current = null;
      setExpandedEmailId(null);
    }, EMAIL_ROW_LEAVE_COLLAPSE_MS);
  }, [clearEmailHoverTimers]);

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
      saveDismissedEmailId(mail.id);
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
        if (mail.tone !== "urgent") return false;
        const d = parseIsoDate(mail.date);
        return d ? isSameLocalDay(d, new Date()) : true;
      }),
    [importantEmails],
  );

  const filteredEvents = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(todayStart);
    rangeEnd.setDate(todayStart.getDate() + 2);
    rangeEnd.setHours(23, 59, 59, 999);
    return events.filter((event) => {
      const d = parseIsoDate(event.date);
      return d ? d >= todayStart && d <= rangeEnd : true;
    });
  }, [events]);

  const availableAccounts =
    connectedEmails.length > 0
      ? connectedEmails
      : Array.from(new Set(dateFilteredEmails.map((mail) => mail.accountEmail || "Unknown account")));

  const filteredEmails =
    selectedFilter === "all"
      ? dateFilteredEmails
      : dateFilteredEmails.filter(
          (mail) => (mail.accountEmail || "Unknown account") === selectedFilter
        );

  const filterOptions: FilterOption[] = [{ value: "all", label: "All" }].concat(
    availableAccounts.map((account) => ({
      value: account,
      label: account,
    }))
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f1f6ff] p-4">
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <header className="page-header w-full shrink-0 px-0 pb-3 pt-4 text-[#1F2933]">
            <div className="relative flex min-h-16 items-center justify-center">
              <h1 className="min-w-0 w-full max-w-full truncate px-2 text-center text-2xl font-instrument font-semibold italic leading-tight tracking-[0.01em] text-[#111827] sm:text-3xl">
                {formatTodayLabel(TODAY)}
              </h1>
            </div>
          </header>

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
                    message={tagiBubble.message}
                    excited={tagiBubble.excited}
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
                    {isSyncing && (
                      <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">syncing…</span>
                    )}
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
                      <span>That's everything!</span>
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

                      const isExpanded = expandedEmailId === mail.id;
                      return (
                        <div
                          key={mail.id}
                          className={`tagged-item group flex items-start gap-2.5 py-1.5 text-[13px] email-row ${isSliding ? "email-row--slide-up" : ""} ${isClosing ? "email-row--closing" : ""}`}
                          style={visualStyle}
                          onMouseEnter={() => handleEmailRowEnter(mail.id)}
                          onMouseLeave={handleEmailRowLeave}
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
                            <div
                              className={isExpanded ? "max-h-[min(16rem,50vh)] overflow-y-auto overflow-x-hidden" : "max-h-[1.2rem] overflow-hidden"}
                              style={{
                                transitionProperty: "max-height",
                                transitionDuration: `${EMAIL_BODY_TRANSITION_MS}ms`,
                                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            >
                              <p className="text-[12px] text-[#6B7280] leading-tight whitespace-pre-line">
                                {mail.summary}
                              </p>
                            </div>
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
                  {filteredEvents.length === 0 && todayDeadlines.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No events or deadlines in the next 3 days.</p>
                  ) : (
                    <>
                      {filteredEvents.map((event, index) => (
                        <div
                          key={event.title + index}
                          className="tagged-item group flex items-start gap-2.5 py-2 text-sm text-[#1F2933]"
                          style={{ borderBottom: "0.5px solid #E5E7EB" }}
                        >
                          <div aria-hidden="true" className="h-9 w-[6px] shrink-0 self-center rounded-full bg-[#ef4444]" />
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-sm font-semibold text-[#111827] truncate">{event.title}</span>
                            {event.time && (
                              <span className="text-[11px] text-[#6B7280]">{event.time}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {todayDeadlines.map((item, index) => (
                        <div
                          key={item.key}
                          className="flex items-start gap-2.5 py-2"
                          style={{ borderBottom: index === todayDeadlines.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                        >
                          <div aria-hidden="true" className="h-9 w-[6px] shrink-0 self-center rounded-full bg-[#ef4444]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#111827]">{item.text}</p>
                            <p className="truncate text-[11px] text-[#9CA3AF]">{item.emailSubject}</p>
                          </div>
                          {item.time && (
                            <span className="shrink-0 text-[11px] font-medium text-[#6B7280]">
                              {new Date(item.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* First-time user loading banner — shown once per account until first sync finishes */}
          {isFirstTimeUser && isSyncing && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-[#fde6d7] bg-[#fff7f2] px-5 py-5 text-center shadow-[0_4px_12px_rgba(249,171,123,0.12)]">
              <div
                className="h-10 w-10 rounded-full border-4 border-[#f9ab7b] border-t-transparent animate-spin"
                aria-label="Loading"
              />
              <div>
                <p className="text-[15px] font-semibold text-[#c97d6e]">Welcome to TagIt!</p>
                <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
                  Your emails are being processed — this only takes a moment.
                </p>
              </div>
            </div>
          )}
        </main>

        {toast && (
          <div className="pointer-events-auto absolute bottom-[70px] left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#111827] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <span>Marked as read</span>
              <button
                type="button"
                onClick={undoLastRemoval}
                className="rounded-full border border-[#ef4444] px-3 py-1 text-xs font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] focus:outline-none focus:ring-2 focus:ring-[#fca5a5]"
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
