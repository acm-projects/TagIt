import React from "react";
import { useNavigate } from "react-router-dom";
import todayIcon from "../assets/nav-buttons/today.png";
import mailIcon from "../assets/nav-buttons/mail.png";
import calendarIcon from "../assets/nav-buttons/calender.png";
import tasksIcon from "../assets/nav-buttons/tasks.png";
import settingsIcon from "../assets/nav-buttons/settings.png";

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        {/* Side navigation - matches Today/Mail */}
        <nav className="flex w-16 flex-col items-center border-r border-[#F7C9AA] bg-[#FFF9F4] py-6">
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center cursor-pointer"
              onClick={() => navigate("/today")}
            >
              <img src={todayIcon} alt="Today" className="h-full w-full" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center cursor-pointer"
              onClick={() => navigate("/mail")}
            >
              <img src={mailIcon} alt="Mail" className="h-full w-full" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center cursor-pointer"
              onClick={() => navigate("/calendar")}
            >
              <img src={calendarIcon} alt="Calendar" className="h-full w-full" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center cursor-pointer"
              onClick={() => navigate("/tasks")}
            >
              <img src={tasksIcon} alt="Tasks" className="h-full w-full" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              <img src={settingsIcon} alt="Settings" className="h-full w-full" />
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 px-8 py-6">
          {/* Date header */}
          <header className="flex flex-col items-center text-center text-[#A34712]">
            <div className="flex w-full items-center justify-center gap-8 text-2xl font-medium">
              <button className="cursor-pointer">&larr;</button>
              <span className="tracking-wide">02/18/2026</span>
              <button className="cursor-pointer">&rarr;</button>
            </div>
            <p className="mt-1 text-sm">Wednesday</p>
          </header>

          {/* Calendar Events */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712] border-b border-[#F3C5A5] pb-2">
              <span className="text-base">🗓</span>
              <span>Calendar Events</span>
            </h2>

            <div className="mt-4 space-y-2 text-sm text-[#3F2A1E]">
              {[
                {
                  title: "ACM Social Night #1",
                  date1: "02/21/2026",
                  day1: "Sat",
                  time: "07:00 - 10:00",
                },
                {
                  title: "WeHack - Hackathon",
                  date1: "03/01/2026",
                  day1: "Sat",
                  date2: "03/02/2026",
                  day2: "Sun",
                  time: "09:00 - 24:00\n00:00 - 05:30",
                },
                {
                  title: "ACM Social Night #1",
                  date1: "02/21/2026",
                  day1: "Sat",
                  time: "07:00 - 10:00",
                },
                {
                  title: "WeHack - Hackathon",
                  date1: "03/01/2026",
                  day1: "Sat",
                  date2: "03/02/2026",
                  day2: "Sun",
                  time: "09:00 - 24:00\n00:00 - 05:30",
                },
              ].map((event, index) => (
                <div
                  key={event.title + index}
                  className="flex items-stretch border-b border-[#F3C5A5] bg-[#FFF6EE] px-4 py-3 last:border-b-0"
                  style={{ width: "calc(100% - 12px)" }}
                >
                  <div className="mr-4 flex items-center">
                    <span className="text-xl">📅</span>
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

