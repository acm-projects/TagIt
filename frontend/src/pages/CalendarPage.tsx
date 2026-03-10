import React from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";
import calendarEventsIcon from "../assets/page_buttons/calendar_events.png";
import googleCalendarLogo from "../assets/Logos/google_calendar.png";
import outlookCalendarLogo from "../assets/Logos/outlook_calendar.webp";

const CalendarPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8E7DD] p-4">
      <div className="flex min-h-0 flex-1 w-full items-stretch overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        {/* Main content: same header strip as other pages */}
        <main className="min-h-0 flex flex-1 flex-col overflow-auto px-8 py-6">
          <DateHeader />

          {/* Calendar Events */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712]">
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

            <div className="mt-4 space-y-2 text-sm text-[#3F2A1E]">
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
                  className="flex items-stretch border-b border-[#F3C5A5] bg-[#FFF6EE] px-4 py-3 last:border-b-0"
                  style={{ width: "calc(100% - 12px)" }}
                >
                  <div className="mr-4 flex items-center">
                    <img
                      src={event.source === "google" ? googleCalendarLogo : outlookCalendarLogo}
                      alt={event.source === "google" ? "Google Calendar" : "Outlook Calendar"}
                      className="h-4 w-4 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{event.title}</p>
                  </div>
                  <div className="mr-4 text-xs leading-snug text-[#5A3A2A]">
                    <p>{event.date1}</p>
                    {event.date2 && <p>{event.date2}</p>}
                  </div>
                  <div className="mr-4 text-xs leading-snug text-[#5A3A2A]">
                    <p>{event.day1}</p>
                    {event.day2 && <p>{event.day2}</p>}
                  </div>
                  <div className="mr-4 whitespace-pre text-xs leading-snug text-[#5A3A2A]">
                    {event.time}
                  </div>
                  <div className="flex items-center">
                    <button className="inline-flex h-7 w-12 items-center justify-center rounded-full bg-[#F3C5A5] text-xs font-semibold text-[#A34712]">
                      add
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

