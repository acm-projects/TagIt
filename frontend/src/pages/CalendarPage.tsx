import React, { useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import { useWeekAnchorWithSharedDayFilter, useNullableDayFilter, NullableConnectedDaysFilter } from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import FilterMenuButton, { type FilterOption } from "../components/FilterMenuButton";
import { loadConnectedEmails } from "../services/connectedUser";

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
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "cal-seed-acm-social",
    title: "ACM Social Night #1",
    date1: "03/28/2026",
    day1: "Sat",
    time: "07:00 - 10:00",
    source: "google",
    tagCategoryId: "priority-1",
  },
  {
    id: "cal-seed-wehack",
    title: "WeHack - Hackathon",
    date1: "03/27/2026",
    day1: "Fri",
    date2: "03/28/2026",
    day2: "Sat",
    time: "09:00 - 24:00\n00:00 - 05:30",
    source: "outlook",
    tagCategoryId: "priority-3",
  },
  {
    id: "cal-seed-resume",
    title: "Resume Review Drop-In",
    date1: "03/24/2026",
    day1: "Tue",
    time: "01:30 - 02:30",
    source: "google",
    tagCategoryId: "priority-3",
  },
  {
    id: "cal-seed-systems",
    title: "Systems Project Checkpoint",
    date1: "03/26/2026",
    day1: "Thu",
    time: "11:00 - 12:15",
    source: "outlook",
    tagCategoryId: "priority-2",
  },
];

const assignAccountsToEvents = (events: CalendarEvent[], emails: string[]): CalendarEvent[] => {
  if (emails.length === 0) return events;
  return events.map((event, index) => ({
    ...event,
    accountEmail: event.accountEmail ?? emails[index % emails.length],
  }));
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

const CalendarPage: React.FC = () => {
  const { nullableDay: calendarDay, setNullableDay: setCalendarDay } = useNullableDayFilter();
  const { handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();
  const categories = useUserCategories();

  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    assignAccountsToEvents(CALENDAR_EVENTS, loadConnectedEmails())
  );
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
    const target = calendarDay ? dayCode(calendarDay) : null;
    return events.filter((event) => {
      const matchesDay =
        !target ||
        dayCode(event.day1) === target ||
        (event.day2 && dayCode(event.day2) === target);
      const matchesAccount =
        selectedAccount === "all" ||
        (event.accountEmail ?? "Unknown account") === selectedAccount;
      return matchesDay && matchesAccount;
    });
  }, [calendarDay, events, selectedAccount]);

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
    const accountEmail =
      selectedAccount !== "all"
        ? selectedAccount
        : connectedEmails[0] ?? "primary@university.edu";
    const nextEvent: CalendarEvent = {
      id: newCalendarEventId(),
      title: newEventTitle.trim(),
      date1: dateLabel,
      day1: dayLabel,
      time: newEventTime.trim() || "09:00 - 10:00",
      source: "google",
      tagCategoryId: "priority-2",
      accountEmail,
    };
    setEvents((prev) => [nextEvent, ...prev]);
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
    setEvents((prev) => assignAccountsToEvents(prev, emails));
  }, []);

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

  const accountOptions: FilterOption[] = [{ value: "all", label: "All" }].concat(
    (connectedEmails.length ? connectedEmails : Array.from(new Set(events.map((e) => e.accountEmail).filter(Boolean) as string[]))).map(
      (email) => ({ value: email, label: email })
    )
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <NullableConnectedDaysFilter
              className="!mt-0 sticky top-0 z-20 bg-[#F9F8F6]"
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
                  </div>
                  <div className="flex items-center gap-2 pr-1">
                    <FilterMenuButton
                      options={accountOptions}
                      selectedValue={selectedAccount}
                      onSelect={setSelectedAccount}
                      ariaLabel="Filter calendar events by account"
                      emptyMessage="No accounts yet"
                    />
                  </div>
                </div>

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

            <div className="flex w-full max-w-4xl justify-end pr-1">
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
