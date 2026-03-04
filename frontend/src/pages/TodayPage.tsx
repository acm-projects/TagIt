import React from "react";
import { useNavigate } from "react-router-dom";
import todayIcon from "../assets/nav-buttons/today.png";
import mailIcon from "../assets/nav-buttons/mail.png";
import calendarIcon from "../assets/nav-buttons/calender.png";
import tasksIcon from "../assets/nav-buttons/tasks.png";
import settingsIcon from "../assets/nav-buttons/settings.png";

const TodayPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        {/* Side navigation */}
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

          {/* Progress section */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-[#A34712]">Progress</h2>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-3 w-full max-w-md rounded-full bg-[#F6D9C3]">
                <div className="h-3 w-1/4 rounded-full bg-[#D3753D]" />
              </div>
              <span className="text-sm text-[#A34712]">25%</span>
            </div>
          </section>

          {/* Important Emails */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-[#A34712]">
              Important Emails
            </h2>
            <div className="mt-4 space-y-3">
              {[
                "John Mathew @Verizon @Handshake",
                "John Mathew @Toyota @Handshake",
                "John Mathew @ACM",
                "John Dollinger @CS 3377",
              ].map((text) => (
                <button
                  key={text}
                  className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-2 text-left text-sm text-[#3F2A1E] shadow-sm cursor-pointer"
                >
                  <span>{text}</span>
                  <span className="ml-4 rounded-full bg-[#D3753D] px-4 py-1 text-xs font-semibold text-white">
                    Open
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-[#A34712]">
              Upcoming Events
            </h2>
            <div className="mt-4 space-y-3">
              {[
                { time: "03:00 - 03:30", title: "Exam Prep" },
                { time: "04:00 - 05:30", title: "Government Class" },
                { time: "08:30 - 10:00", title: "ACM Meeting @ SLC" },
              ].map((event) => (
                <button
                  key={event.title}
                  className="flex w-full items-center justify-between rounded-xl bg-[#FCD7BD] px-4 py-2 text-left text-sm text-[#3F2A1E] shadow-sm cursor-pointer"
                >
                  <span className="mr-4 text-xs text-[#7A4A2D]">
                    {event.time}
                  </span>
                  <span className="flex-1">{event.title}</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TodayPage;

