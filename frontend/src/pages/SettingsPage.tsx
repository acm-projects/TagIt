import React from "react";
import { useNavigate } from "react-router-dom";
import todayIcon from "../assets/nav-buttons/today.png";
import mailIcon from "../assets/nav-buttons/mail.png";
import calendarIcon from "../assets/nav-buttons/calender.png";
import tasksIcon from "../assets/nav-buttons/tasks.png";
import settingsIcon from "../assets/nav-buttons/settings.png";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const priorities = [
    "Club Events",
    "Class/Assignment Notifications",
    "Class/Assignment Notifications",
    "Deadlines",
  ];

  const addChips = [
    "Turn tables",
    "Financial Aid",
    "Scholarships",
    "Jobs",
    "Internships",
    "Other",
  ];

  return (
    <div className="min-h-full bg-[#FFF2E9] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        {/* Side navigation - consistent with other pages */}
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
        <main className="flex-1 px-8 py-6 text-[#A34712]">
          <header className="flex flex-col items-center border-b border-[#E6C7B3] pb-4 text-center">
            <h1 className="text-4xl font-semibold tracking-[0.12em]">SETTINGS</h1>
          </header>

          {/* Users */}
          <section className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span>Users</span>
              </div>
              <button className="text-lg font-semibold">+</button>
            </div>

            <div className="space-y-2 text-sm text-[#5A3A2A]">
              <div className="flex items-center gap-3 text-base">
                <span>name:</span>
                <div className="inline-flex min-w-[200px] items-center rounded-lg bg-[#F8E0CE] px-3 py-2 font-semibold text-[#7A4A2D]">
                  username
                </div>
              </div>
              <div className="space-y-2">
                {["email1@gmail.com", "email2@outlook.com", "email3@utdallas.edu"].map(
                  (email, index) => (
                    <div
                      key={email}
                      className="flex items-center rounded-lg bg-[#F8E0CE] px-3 py-2 text-base font-semibold text-[#5A3A2A]"
                    >
                      <span className="mr-3">{index + 1}.</span>
                      <span>{email}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>

          {/* Priorities */}
          <section className="mt-10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">🧩</span>
              <span>Priorities</span>
            </div>

            <div className="space-y-3">
              {priorities.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-full bg-[#F8E0CE] px-4 py-2 text-sm font-semibold text-[#5A3A2A]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-[#7A4A2D]">⋮⋮</span>
                    <span>{item}</span>
                  </div>
                  <button className="text-lg text-[#7A4A2D]">🗑️</button>
                </div>
              ))}
            </div>
          </section>

          {/* Add chips */}
          <section className="mt-10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">+</span>
              <span>Add</span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#5A3A2A]">
              {addChips.map((chip) => (
                <button
                  key={chip}
                  className="rounded-md bg-[#F8E0CE] px-3 py-1 shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
