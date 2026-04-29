import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import { useWeekAnchorWithSharedDayFilter, useNullableDayFilter, NullableConnectedDaysFilter, getDateForWeekdayInAnchorWeek } from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import { loadConnectedEmails } from "../services/connectedUser";
import { getCurrentUsername } from "../services/currentUser";
import { getUserEvents, dismissTask, addEventToGoogleCalendar, getGoogleCalendarEvents, deleteGoogleCalendarEvent, type EmailEventItem, type GoogleCalendarEvent } from "../services/api";
import {
  getCachedEmailEvents,
  setCachedEmailEvents,
  getCachedGCalEvents,
  setCachedGCalEvents,
} from "../services/dataCache";

type CalendarEvent = {
  id: string;
  title: string;
  date1: string;
  day1: string;
  date2?: string;
  day2?: string;
  time: string;
  source: "google" | "outlook";
  tagCategoryId?: string;
  accountEmail?: string;
  emailKey?: string; // stable key for backend-sourced events (dismissal)
  fromGCal?: boolean; // true for events fetched directly from Google Calendar
  gCalEventId?: string; // raw Google Calendar event ID for deletion
};

/** Parse an ISO 8601 datetime string and return { dateLabel: "MM/DD/YYYY", dayLabel: "Mon" } */
const parseIsoToDisplayDate = (iso: string): { dateLabel: string; dayLabel: string } | null => {
  if (!iso) return null;
  // Date-only strings ("YYYY-MM-DD") must be parsed as local time — new Date()
  // treats them as UTC midnight which shifts the day back in negative-offset zones.
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) {
    const [y, m, day] = iso.trim().split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(iso);
  }
  if (isNaN(d.getTime())) return null;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
  return { dateLabel: `${month}/${day}/${year}`, dayLabel };
};

/** Parse MM/DD/YYYY to a Date object. */
const parseMmDdYyyy = (raw: string): Date | null => {
  const [monthRaw, dayRaw, yearRaw] = raw.split("/");
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const year = Number(yearRaw);
  if (!month || !day || !year) return null;
  return new Date(year, month - 1, day);
};

/** Convert an EmailEventItem from the backend into a CalendarEvent for the UI. */
const emailEventToCalendarEvent = (item: EmailEventItem): CalendarEvent => {
  const parsed = parseIsoToDisplayDate(item.time);
  const dateLabel = parsed?.dateLabel ?? "";
  const dayLabel = parsed?.dayLabel ?? "";

  // Try to extract a readable time range from the ISO string
  let timeDisplay = "";
  if (item.time) {
    const d = new Date(item.time);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      timeDisplay = `${hh}:${mm}`;
    }
  }

  const rawText = item.text as unknown;
  const titleStr =
    typeof rawText === "string"
      ? rawText
      : typeof rawText === "object" && rawText !== null
        ? ((rawText as Record<string, unknown>).title as string) ||
          ((rawText as Record<string, unknown>).location as string) ||
          item.emailSubject
        : item.emailSubject;

  return {
    id: item.key,
    title: titleStr || item.emailSubject,
    date1: dateLabel,
    day1: dayLabel,
    time: timeDisplay || "TBD",
    source: (item.source === "outlook" ? "outlook" : "google") as "google" | "outlook",
    tagCategoryId: `priority-${item.priorityLevel}`,
    accountEmail: item.source || "",
    emailKey: item.key,
  };
};

/** Convert MM/DD/YYYY display date to YYYY-MM-DD for the API. */
const mmDdYyyyToIso = (mmddyyyy: string): string => {
  const [m, d, y] = mmddyyyy.split("/");
  if (!m || !d || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

/** Convert a raw Google Calendar API event into the local CalendarEvent shape. */
const googleCalEventToCalendarEvent = (item: GoogleCalendarEvent): CalendarEvent => {
  const isAllDay = !item.start.dateTime;

  // All-day events have a plain date string "YYYY-MM-DD" — parse as local time
  // to avoid the UTC-midnight-shifting-to-previous-day bug.
  const parseLocalDate = (s: string): Date | null => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d); // local midnight, no timezone shift
  };

  const parseDateTimeStr = (s: string): Date | null => {
    if (!s) return null;
    const d = new Date(s); // dateTime strings include tz offset — safe to parse
    return isNaN(d.getTime()) ? null : d;
  };

  const startD = isAllDay
    ? parseLocalDate(item.start.date ?? "")
    : parseDateTimeStr(item.start.dateTime ?? "");
  const endD = isAllDay
    ? parseLocalDate(item.end.date ?? "")
    : parseDateTimeStr(item.end.dateTime ?? "");

  const fmtDate = (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const y = d.getFullYear();
    return `${m}/${day}/${y}`;
  };

  const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short" });

  const fmtTime = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const timeDisplay = isAllDay
    ? "All day"
    : startD && endD
    ? `${fmtTime(startD)} - ${fmtTime(endD)}`
    : "All day";

  return {
    id: `gcal-${item.id}`,
    title: item.summary || "(No title)",
    date1: startD ? fmtDate(startD) : "",
    day1: startD ? fmtDay(startD) : "",
    time: timeDisplay,
    source: "google" as const,
    tagCategoryId: "priority-3",
    fromGCal: true,
    gCalEventId: item.id,
  };
};

/** Local calendar date for `<input type="date" />` (YYYY-MM-DD). */
const formatIsoDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const newCalendarEventId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `cal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type CalendarToast =
  | { type: "added" }
  | { type: "removed"; event: CalendarEvent; insertIndex: number };

async function getGCalPushedKeys(): Promise<Set<string>> {
  try {
    const key = `tagit_gcal_pushed_keys.${getCurrentUsername()}`;
    const result = await chrome.storage.local.get(key);
    const arr = result[key];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

const CalendarPage: React.FC = () => {
  const { nullableDay: calendarDay, setNullableDay: setCalendarDay } = useNullableDayFilter();
  const { weekAnchor, handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();
  const categories = useUserCategories();

  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const fromBackend = (getCachedEmailEvents() ?? []).map(emailEventToCalendarEvent);
    const fromGCal = (getCachedGCalEvents() ?? []).map(googleCalEventToCalendarEvent);
    return [...fromBackend, ...fromGCal];
  });
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [gCalError, setGCalError] = useState<"no_token" | "scope" | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [slidingEventIds, setSlidingEventIds] = useState<Set<string>>(() => new Set());
  const [closingEventIds, setClosingEventIds] = useState<Set<string>>(() => new Set());
  const [rowToneById, setRowToneById] = useState<Record<string, "green" | "red">>({});
  const [calendarToast, setCalendarToast] = useState<CalendarToast | null>(null);
  const calendarToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissingEventIdsRef = useRef<Set<string>>(new Set());

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("09:00 - 10:00");

  const dayCode = (dayLabel?: string) => dayLabel?.slice(0, 3).toLowerCase();
  const filteredEvents = useMemo(() => {
    const weekStart = getDateForWeekdayInAnchorWeek(weekAnchor, "sun");
    const weekEnd = getDateForWeekdayInAnchorWeek(weekAnchor, "sat");
    weekEnd.setHours(23, 59, 59, 999);
    const target = calendarDay ? dayCode(calendarDay) : null;

    return events.filter((event) => {
      const d = parseMmDdYyyy(event.date1);
      if (d && (d < weekStart || d > weekEnd)) return false;
      if (target) {
        const matchesDay =
          dayCode(event.day1) === target ||
          (event.day2 && dayCode(event.day2) === target);
        if (!matchesDay) return false;
      }
      return true;
    });
  }, [calendarDay, events, weekAnchor]);

  const parseDateInput = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    const dt = new Date(year, month - 1, day);
    const dayLabel = dt.toLocaleDateString("en-US", { weekday: "short" });
    const dateLabel = `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
    return { dayLabel, dateLabel };
  };

  const handleSaveEvent = () => {
    if (!newEventTitle.trim() || !newEventDate.trim()) return;
    const parsed = parseDateInput(newEventDate);
    const dayLabel = parsed?.dayLabel ?? "Mon";
    const dateLabel = parsed?.dateLabel ?? newEventDate;
    const accountEmail = connectedEmails[0] ?? "";
    const nextEvent: CalendarEvent = {
      id: newCalendarEventId(),
      title: newEventTitle.trim(),
      date1: dateLabel,
      day1: dayLabel,
      time: newEventTime.trim() || "09:00 - 10:00",
      source: "google",
      tagCategoryId: "priority-2",
      accountEmail,
      fromGCal: true, // treated as a GCal event so the next refresh replaces rather than duplicates it
    };
    setEvents((prev) => [nextEvent, ...prev]);
    // Add to user's Google Calendar then refresh so the real GCal entry replaces the placeholder
    addEventToGoogleCalendar({ title: newEventTitle.trim(), date: newEventDate })
      .then(() => loadGCalEvents())
      .catch(() => {});
    setIsAddingEvent(false);
    setNewEventTitle("");
    setNewEventDate(formatIsoDateLocal(new Date()));
    setNewEventTime("09:00 - 10:00");
  };

  const startAddingEvent = () => {
    setIsAddingEvent(true);
    setNewEventTitle("");
    setNewEventDate(formatIsoDateLocal(new Date()));
    setNewEventTime("09:00 - 10:00");
  };

  const cancelAddingEvent = () => {
    setIsAddingEvent(false);
    setNewEventTitle("");
    setNewEventDate(formatIsoDateLocal(new Date()));
    setNewEventTime("09:00 - 10:00");
  };

  const fieldClass =
    "rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fde6d7]";

  useEffect(() => {
    const emails = loadConnectedEmails();
    setConnectedEmails(emails);
  }, []);

  // Load email-extracted events from backend
  const loadEmailEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const [resp, pushedKeys] = await Promise.all([getUserEvents(), getGCalPushedKeys()]);
      if (resp.success && resp.data?.items) {
        setCachedEmailEvents(resp.data.items);
        setEvents((prev) => {
          const keep = prev.filter((e) => !e.emailKey);
          // Skip email events already represented by a GCal entry to avoid duplicates
          const fromBackend = resp.data!.items
            .filter((item) => !pushedKeys.has(item.key))
            .map(emailEventToCalendarEvent);
          return [...fromBackend, ...keep];
        });
      }
    } catch {
      // Silently fail — manual events still shown
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Load events from the user's actual Google Calendar
  const loadGCalEvents = useCallback(async () => {
    const resp = await getGoogleCalendarEvents();
    console.log("[GCal] fetch response:", resp);
    if (resp.success && resp.data?.items) {
      console.log("[GCal] items count:", resp.data.items.length);
      setGCalError(null);
      setCachedGCalEvents(resp.data.items);
      setEvents((prev) => {
        const fromGCal = resp.data!.items.map(googleCalEventToCalendarEvent);
        console.log("[GCal] mapped events:", fromGCal);
        const gCalIds = new Set(fromGCal.map((e) => e.gCalEventId).filter(Boolean));
        // Drop old GCal events and any non-GCal events whose title+date already appear in the fresh GCal list
        const keep = prev.filter((e) => !e.fromGCal && !(e.gCalEventId && gCalIds.has(e.gCalEventId)));
        return [...keep, ...fromGCal];
      });
    } else if (!resp.success) {
      const err = resp.error ?? "";
      console.warn("[GCal] error:", err);
      if (err.includes("NO_GOOGLE_TOKEN") || err.includes("401")) {
        setGCalError("no_token");
      } else if (err.includes("INSUFFICIENT_SCOPES") || err.includes("403")) {
        setGCalError("scope");
      } else {
        setGCalError("no_token");
      }
    }
  }, []);

  useEffect(() => {
    void loadEmailEvents();
    void loadGCalEvents();
  }, [loadEmailEvents, loadGCalEvents]);

  const clearCalendarToastTimer = () => {
    if (calendarToastTimerRef.current !== null) {
      clearTimeout(calendarToastTimerRef.current);
      calendarToastTimerRef.current = null;
    }
  };

  const showCalendarToast = (next: CalendarToast, durationMs = 4200) => {
    clearCalendarToastTimer();
    setCalendarToast(next);
    calendarToastTimerRef.current = setTimeout(() => {
      calendarToastTimerRef.current = null;
      setCalendarToast(null);
    }, durationMs);
  };

  const triggerEventSlide = (eventId: string) => {
    setSlidingEventIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });
  };

  const finishDismissEvent = (eventId: string) => {
    setSlidingEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    setClosingEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    setRowToneById((prev) => {
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
    dismissingEventIdsRef.current.delete(eventId);
  };

  const handleAddToCalendar = (event: CalendarEvent) => {
    const eventId = event.id;
    if (dismissingEventIdsRef.current.has(eventId)) return;
    dismissingEventIdsRef.current.add(eventId);
    setRowToneById((prev) => ({ ...prev, [eventId]: "green" }));
    triggerEventSlide(eventId);

    window.setTimeout(() => {
      setClosingEventIds((prev) => {
        const next = new Set(prev);
        next.add(eventId);
        return next;
      });
    }, 220);

    window.setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      finishDismissEvent(eventId);
      showCalendarToast({ type: "added" });
      // Permanently dismiss backend-sourced events
      if (event.emailKey) void dismissTask(event.emailKey);
      // Add to user's Google Calendar
      const isoDate = mmDdYyyyToIso(event.date1);
      void addEventToGoogleCalendar({ title: event.title, date: isoDate || undefined });
    }, 520);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    const eventId = event.id;
    if (dismissingEventIdsRef.current.has(eventId)) return;
    dismissingEventIdsRef.current.add(eventId);
    const insertIndex = Math.max(0, events.findIndex((e) => e.id === eventId));
    setRowToneById((prev) => ({ ...prev, [eventId]: "red" }));
    triggerEventSlide(eventId);

    window.setTimeout(() => {
      setClosingEventIds((prev) => {
        const next = new Set(prev);
        next.add(eventId);
        return next;
      });
    }, 220);

    window.setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      finishDismissEvent(eventId);
      showCalendarToast({ type: "removed", event, insertIndex });
      // Permanently dismiss backend-sourced events
      if (event.emailKey) void dismissTask(event.emailKey);
      // Delete from Google Calendar if this came from GCal
      if (event.fromGCal && event.gCalEventId) void deleteGoogleCalendarEvent(event.gCalEventId);
    }, 520);
  };

  const undoRemovedEvent = () => {
    if (!calendarToast || calendarToast.type !== "removed") return;
    const { event, insertIndex } = calendarToast;
    setEvents((prev) => {
      const next = [...prev];
      const at = Math.min(Math.max(0, insertIndex), next.length);
      next.splice(at, 0, event);
      return next;
    });
    clearCalendarToastTimer();
    setCalendarToast(null);
  };

  useEffect(() => () => clearCalendarToastTimer(), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f1f6ff] p-4">
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <NullableConnectedDaysFilter
              className="!mt-0 sticky top-0 z-20 bg-[#f1f6ff]"
              value={calendarDay}
              onChange={setCalendarDay}
            />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                      event_note
                    </span>
                    <span>Calendar Events</span>
                    {isLoadingEvents && (
                      <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">loading…</span>
                    )}
                  </div>
                </div>

                {gCalError && (
                  <p className="mt-2 text-[11px] text-[#9CA3AF]">
                    {gCalError === "no_token"
                      ? "Google Calendar not connected. Reconnect your Gmail account in Settings to see Google Calendar events."
                      : "Google Calendar access needs additional permissions. Reconnect your Gmail account in Settings."}
                  </p>
                )}

                <div className="mt-3">
                  {filteredEvents.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">
                      {calendarDay ? "No events on this day." : "No events this week."}
                    </p>
                  ) : (
                    filteredEvents.map((event, index) => {
                      const categoryColor = getCategoryColorById(categories, event.tagCategoryId);
                      const isSliding = slidingEventIds.has(event.id);
                      const isClosing = closingEventIds.has(event.id);
                      const tone = rowToneById[event.id];
                      const slideClass =
                        tone === "red"
                          ? "calendar-event-row--slide-up-red"
                          : "calendar-event-row--slide-up-green";
                      const closingClass =
                        tone === "red"
                          ? "calendar-event-row--closing-red"
                          : "calendar-event-row--closing-green";

                      const visualStyle: React.CSSProperties = {
                        borderBottom:
                          index === filteredEvents.length - 1
                            ? "none"
                            : "0.5px solid #E5E7EB",
                      };
                      if (isSliding || isClosing) {
                        if (tone === "red") {
                          visualStyle.boxShadow = isClosing
                            ? "0 8px 14px rgba(239, 68, 68, 0.14)"
                            : "0 10px 18px rgba(239, 68, 68, 0.2)";
                          visualStyle.borderBottom = "1px solid rgba(239, 68, 68, 0.45)";
                        } else {
                          visualStyle.boxShadow = isClosing
                            ? "0 8px 14px rgba(34, 197, 94, 0.12)"
                            : "0 10px 18px rgba(34, 197, 94, 0.16)";
                          visualStyle.borderBottom = "1px solid rgba(34, 197, 94, 0.45)";
                        }
                        visualStyle.backgroundColor = "transparent";
                      }

                      return (
                        <div
                          key={event.id}
                          className={`calendar-event-row grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-x-4 py-4 ${isSliding ? slideClass : ""} ${isClosing ? closingClass : ""}`}
                          style={visualStyle}
                        >
                          <span
                            aria-hidden="true"
                            className="h-14 w-[6px] self-center rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#111827] sm:text-sm">
                              {event.title}
                            </p>

                            <div className="mt-2 grid grid-cols-2 gap-x-5 text-[11px] leading-snug text-[#6B7280] sm:max-w-[22rem]">
                              <div>
                                <p>{`${event.day1} ${event.date1}`}</p>
                                {event.date2 && event.day2 && (
                                  <p>{`${event.day2} ${event.date2}`}</p>
                                )}
                              </div>
                              <div>
                                <p className="whitespace-pre-line">{event.time}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 self-center">
                            {!event.fromGCal && (
                              <button
                                type="button"
                                aria-label="Add to calendar"
                                onClick={() => handleAddToCalendar(event)}
                                className="inline-flex h-9 w-9 items-center justify-center text-[#22c55e] transition-colors hover:text-[#16a34a]"
                              >
                                <span
                                  className="inline-block h-4 w-4 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                                  style={{
                                    WebkitMaskImage: `url(${addIcon})`,
                                    maskImage: `url(${addIcon})`,
                                  }}
                                  aria-hidden
                                />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label="Remove event"
                              onClick={() => handleDeleteEvent(event)}
                              className="inline-flex h-9 w-9 items-center justify-center text-[#ef4444] transition-colors hover:text-[#dc2626]"
                            >
                              <span
                                className="inline-block h-4 w-4 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                                style={{
                                  maskImage: `url(${deleteIcon})`,
                                  WebkitMaskImage: `url(${deleteIcon})`,
                                }}
                                aria-hidden
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <div className="flex w-full max-w-4xl flex-wrap items-center justify-center gap-3 px-1">
              <button
                type="button"
                onClick={() =>
                  window.open("https://calendar.google.com/calendar", "_blank", "noopener,noreferrer")
                }
                className="inline-flex items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB]"
              >
                Open calendar
              </button>
              <button
                type="button"
                onClick={startAddingEvent}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f9ab7b] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89960]"
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 bg-white"
                  style={{
                    WebkitMaskImage: `url(${addIcon})`,
                    maskImage: `url(${addIcon})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
                <span>Add Event</span>
              </button>
            </div>

            {isAddingEvent && (
              <div className="w-full max-w-4xl rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] p-4 shadow-[0_6px_14px_rgba(17,24,39,0.05)]">
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  New Event
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEvent();
                    if (e.key === "Escape") cancelAddingEvent();
                  }}
                  className={`mt-2 w-full ${fieldClass}`}
                  placeholder="Event title"
                  aria-label="Event title"
                  autoFocus
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-[#374151]">Date</span>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className={fieldClass}
                      aria-label="Event date"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-[#374151]">Time</span>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className={fieldClass}
                      placeholder="09:00 - 10:00"
                      aria-label="Event time"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveEvent}
                    className="inline-flex items-center justify-center rounded-full bg-[#f9ab7b] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89960]"
                  >
                    Save Event
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddingEvent}
                    className="inline-flex items-center justify-center rounded-full bg-[#F3F4F6] px-5 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {calendarToast && (
          <div className="pointer-events-auto absolute bottom-[70px] left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#111827] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              {calendarToast.type === "added" ? (
                <span>Added to calendar</span>
              ) : (
                <>
                  <span>Removed event</span>
                  <button
                    type="button"
                    onClick={undoRemovedEvent}
                    className="rounded-full border border-[#ef4444] px-3 py-1 text-xs font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] focus:outline-none focus:ring-2 focus:ring-[#fca5a5]"
                  >
                    Undo
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <AppNavbar />
      </div>
    </div>
  );
};

export default CalendarPage;
