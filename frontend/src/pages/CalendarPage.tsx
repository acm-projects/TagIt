import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DaysFilter, { type WeekdayShort } from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";

type CalendarEvent = {
  title: string;
  date1: string;
  day1: string;
  date2?: string;
  day2?: string;
  time: string;
  source: "google" | "outlook";
  /** Weekday keys (matches DaysFilter) this event should appear under */
  filterDays: WeekdayShort[];
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    title: "ACM Social Night #1",
    date1: "02/21/2026",
    day1: "Sat",
    time: "07:00 - 10:00",
    source: "google",
    filterDays: ["sat"],
  },
  {
    title: "WeHack - Hackathon",
    date1: "03/01/2026",
    day1: "Sat",
    date2: "03/02/2026",
    day2: "Sun",
    time: "09:00 - 24:00\n00:00 - 05:30",
    source: "outlook",
    filterDays: ["sat", "sun"],
  },
  {
    title: "Resume Review Drop-In",
    date1: "03/05/2026",
    day1: "Thu",
    time: "01:30 - 02:30",
    source: "google",
    filterDays: ["thur"],
  },
  {
    title: "Systems Project Checkpoint",
    date1: "03/06/2026",
    day1: "Fri",
    time: "11:00 - 12:15",
    source: "outlook",
    filterDays: ["fri"],
  },
];

const CalendarPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<WeekdayShort>("sun");

  const filteredEvents = useMemo(
    () => CALENDAR_EVENTS.filter((event) => event.filterDays.includes(selectedDay)),
    [selectedDay],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-5 space-y-4 sm:mt-6">
            <DaysFilter value={selectedDay} onChange={setSelectedDay} className="!mt-0" />

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
                    <p className="py-2 text-[12px] text-[#6B7280]">No events on this day.</p>
                  ) : (
                    filteredEvents.map((event, index) => {
                    const sourceChipStyles =
                      event.source === "google"
                        ? "bg-[#DBEAFE] text-[#1D4ED8]"
                        : "bg-[#E7F6EA] text-[#22A06B]";

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
                          className="h-full min-h-10 rounded-full bg-[#f9ab7b]"
                        />

                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-[13px] font-semibold text-[#111827] sm:text-sm">
                              {event.title}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${sourceChipStyles}`}
                            >
                              {event.source}
                            </span>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-x-5 text-[11px] leading-snug text-[#6B7280] sm:max-w-[22rem]">
                            <div>
                              <p>{`${event.day1} ${event.date1}`}</p>
                              {event.date2 && event.day2 && <p>{`${event.day2} ${event.date2}`}</p>}
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
                            className="inline-flex h-8 w-8 items-center justify-center text-[#f9ab7b] transition-colors hover:text-[#e58a58]"
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
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
                            className="inline-flex h-8 w-8 items-center justify-center text-[#f9ab7b] transition-colors hover:text-[#e58a58]"
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
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
          </div>
        </main>

        <AppNavbar />
      </div>
    </div>
  );
};

export default CalendarPage;
