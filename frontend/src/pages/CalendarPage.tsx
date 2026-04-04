import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import { useWeekAnchorWithSharedDayFilter, useNullableDayFilter, NullableConnectedDaysFilter } from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";

type CalendarEvent = {
  title: string;
  date1: string;
  day1: string;
  date2?: string;
  day2?: string;
  time: string;
  source: "google" | "outlook";
  tagCategoryId?: string;
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    title: "ACM Social Night #1",
    date1: "03/28/2026",
    day1: "Sat",
    time: "07:00 - 10:00",
    source: "google",
    tagCategoryId: "priority-1",
  },
  {
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
    title: "Resume Review Drop-In",
    date1: "03/24/2026",
    day1: "Tue",
    time: "01:30 - 02:30",
    source: "google",
    tagCategoryId: "priority-3",
  },
  {
    title: "Systems Project Checkpoint",
    date1: "03/26/2026",
    day1: "Thu",
    time: "11:00 - 12:15",
    source: "outlook",
    tagCategoryId: "priority-2",
  },
];

const CalendarPage: React.FC = () => {
  const { nullableDay: calendarDay, setNullableDay: setCalendarDay } = useNullableDayFilter();
  const { handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();
  const categories = useUserCategories();

  const [events, setEvents] = useState<CalendarEvent[]>(CALENDAR_EVENTS);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("09:00 - 10:00");
  const [newEventSource, setNewEventSource] = useState<CalendarEvent["source"]>("google");

  const dayCode = (dayLabel?: string) => dayLabel?.slice(0, 3).toLowerCase();
  const filteredEvents = useMemo(() => {
    if (!calendarDay) return events;
    const target = dayCode(calendarDay);
    return events.filter(
      (event) =>
        dayCode(event.day1) === target ||
        (event.day2 && dayCode(event.day2) === target),
    );
  }, [calendarDay, events]);

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
    const nextEvent: CalendarEvent = {
      title: newEventTitle.trim(),
      date1: dateLabel,
      day1: dayLabel,
      time: newEventTime.trim() || "09:00 - 10:00",
      source: newEventSource,
      tagCategoryId: "priority-2",
    };
    setEvents((prev) => [nextEvent, ...prev]);
    setIsAddingEvent(false);
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventTime("09:00 - 10:00");
    setNewEventSource("google");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <div className="sticky top-0 z-20 bg-[#F9F8F6] pb-1">
              <NullableConnectedDaysFilter className="!mt-0" value={calendarDay} onChange={setCalendarDay} />
            </div>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    event_note
                  </span>
                  <span>Calendar Events</span>
                </div>

                <div className="mt-3">
                  {filteredEvents.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">
                      {calendarDay ? "No events on this day." : "No events this week."}
                    </p>
                  ) : (
                    filteredEvents.map((event, index) => {
                      const sourceChipStyles = "text-[#6B7280]";
                      const categoryColor = getCategoryColorById(categories, event.tagCategoryId);

                      return (
                        <div
                          key={event.title + index}
                          className="grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-x-4 py-4"
                          style={{
                            borderBottom:
                              index === filteredEvents.length - 1
                                ? "none"
                                : "0.5px solid #E5E7EB",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="h-14 w-[6px] self-center rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />

                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <p className="truncate text-[13px] font-semibold text-[#111827] sm:text-sm">
                                {event.title}
                              </p>
                              <span
                                className={`self-center text-[12px] font-medium capitalize leading-[1.1] ${sourceChipStyles}`}
                              >
                                {event.source}
                              </span>
                            </div>

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

                          <div className="flex shrink-0 items-center gap-1.5 self-center">
                            <button
                              type="button"
                              aria-label="Add"
                              className="inline-flex h-9 w-9 items-center justify-center text-[#22c55e] transition-colors hover:text-[#16a34a]"
                            >
                              <span
                                className="inline-block h-4 w-4 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                                style={{
                                  maskImage: `url(${addIcon})`,
                                  WebkitMaskImage: `url(${addIcon})`,
                                }}
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete"
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
                  {isAddingEvent && (
                    <div className="mt-3 grid gap-3 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FBFBFB] px-4 py-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-semibold text-[#374151]">Title</label>
                        <input
                          type="text"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fcd7b6]"
                          placeholder="Event title"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-semibold text-[#374151]">Date</label>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fcd7b6]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-semibold text-[#374151]">Time</label>
                        <input
                          type="text"
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fcd7b6]"
                          placeholder="09:00 - 10:00"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-semibold text-[#374151]">Source</label>
                        <select
                          value={newEventSource}
                          onChange={(e) => setNewEventSource(e.target.value as CalendarEvent["source"])}
                          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fcd7b6]"
                        >
                          <option value="google">google</option>
                          <option value="outlook">outlook</option>
                        </select>
                      </div>
                      <div className="flex gap-2 sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleSaveEvent}
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#f9ab7b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#f29a63]"
                        >
                          Save Event
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingEvent(false);
                            setNewEventTitle("");
                            setNewEventDate("");
                            setNewEventTime("09:00 - 10:00");
                            setNewEventSource("google");
                          }}
                          className="inline-flex flex-1 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent((v) => !v)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                    >
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 bg-[#374151]"
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

export default CalendarPage;
