import React from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";
import calendarEventsIcon from "../assets/page_buttons/calendar_events.png";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";

const CalendarPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8E7DD] p-4">
      <div className="flex min-h-0 flex-1 w-full items-stretch overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        {/* Main content: same header strip as other pages */}
        <main className="min-h-0 flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-8 py-6">
          <DateHeader />

          {/* Calendar Events */}
          <section className="mt-8 w-full min-w-0">
            <h2 className="flex w-full items-center gap-2 text-left text-sm font-semibold text-[#A34712]">
              <span
                className="inline-block h-5 w-5 shrink-0 bg-[#A34712] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                style={{
                  maskImage: `url(${calendarEventsIcon})`,
                  WebkitMaskImage: `url(${calendarEventsIcon})`,
                }}
                aria-hidden
              />
              <span>Calendar Events</span>
            </h2>

            <div className="mt-4 w-full min-w-0 space-y-2 text-left text-sm text-[#3F2A1E]">
              {[
                {
                  title: "ACM Social Night #1",
                  date1: "02/21/2026",
                  day1: "Sat",
                  time: "07:00 - 10:00",
                  source: "google" as const,
                },
                {
                  title: "WeHack - Hackathon",
                  date1: "03/01/2026",
                  day1: "Sat",
                  date2: "03/02/2026",
                  day2: "Sun",
                  time: "09:00 - 24:00\n00:00 - 05:30",
                  source: "outlook" as const,
                },
                {
                  title: "ACM Social Night #1",
                  date1: "02/21/2026",
                  day1: "Sat",
                  time: "07:00 - 10:00",
                  source: "google" as const,
                },
                {
                  title: "WeHack - Hackathon",
                  date1: "03/01/2026",
                  day1: "Sat",
                  date2: "03/02/2026",
                  day2: "Sun",
                  time: "09:00 - 24:00\n00:00 - 05:30",
                  source: "outlook" as const,
                },
              ].map((event, index) => (
                <div
                  key={event.title + index}
                  className="grid min-w-0 grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-1 border-b border-[#F3C5A5] bg-[#FFF6EE] px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_4.5rem_2rem_5.5rem_auto] sm:grid-rows-[auto] sm:gap-y-0"
                >
                  {/* Narrow: row 1 = title (full width). Sm: contents → title */}
                  <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:contents">
                    <div className="min-w-0 sm:block">
                      <p className="break-words font-semibold">{event.title}</p>
                    </div>
                  </div>
                  {/* Narrow: row 2 = date, day, time. Sm: contents → date, day, time */}
                  <div className="col-start-1 row-start-2 flex min-w-0 flex-wrap items-center gap-x-2 text-xs leading-snug text-[#5A3A2A] sm:contents">
                    <div className="text-xs leading-snug text-[#5A3A2A] sm:block">
                      <p>{event.date1}</p>
                      {event.date2 && <p>{event.date2}</p>}
                    </div>
                    <div className="text-xs leading-snug text-[#5A3A2A] sm:block">
                      <p>{event.day1}</p>
                      {event.day2 && <p>{event.day2}</p>}
                    </div>
                    <div className="whitespace-pre text-xs leading-snug text-[#5A3A2A] sm:block">
                      {event.time}
                    </div>
                  </div>
                  {/* Narrow: right column, vertical + and x. Sm: one grid cell */}
                  <div className="col-start-2 row-span-2 row-start-1 flex shrink-0 flex-col items-center justify-center gap-0.5 self-center sm:col-auto sm:row-auto sm:flex-row sm:gap-1">
                    <button type="button" aria-label="Add" className="rounded p-1 hover:opacity-80">
                      <span
                        className="inline-block h-5 w-5 bg-[#A34712] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                        style={{
                          maskImage: `url(${addIcon})`,
                          WebkitMaskImage: `url(${addIcon})`,
                        }}
                        aria-hidden
                      />
                    </button>
                    <button type="button" aria-label="Delete" className="rounded p-1 hover:opacity-80">
                      <span
                        className="inline-block h-5 w-5 bg-[#A34712] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                        style={{
                          maskImage: `url(${deleteIcon})`,
                          WebkitMaskImage: `url(${deleteIcon})`,
                        }}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default CalendarPage;