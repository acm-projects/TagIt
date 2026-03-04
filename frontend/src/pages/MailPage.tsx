import React from "react";
import { useNavigate } from "react-router-dom";
import todayIcon from "../assets/nav-buttons/today.png";
import mailIcon from "../assets/nav-buttons/mail.png";
import calendarIcon from "../assets/nav-buttons/calender.png";
import tasksIcon from "../assets/nav-buttons/tasks.png";
import settingsIcon from "../assets/nav-buttons/settings.png";

const MailPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        {/* Side navigation - matches Today page */}
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

          {/* Mails section */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712]">
              <span className="text-base">✉️</span>
              <span>Mails</span>
            </h2>

            <div className="mt-4 space-y-4">
              {/* Primary highlighted mail */}
              <button className="flex w-full flex-col rounded-2xl bg-[#FFE9DC] px-5 py-4 text-left text-sm text-[#3F2A1E] shadow-sm cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#3F2A1E]">
                      Joshua Montogermy
                    </p>
                    <p className="mt-1 text-xs leading-snug text-[#5A3A2A]">
                      Requesting a screenshot of current off-campus enrollment
                      (with courses and college) to grant temporary credit
                      while awaiting transfer.
                    </p>
                  </div>
                  <div className="ml-4 space-y-2">
                    <span className="inline-flex h-8 w-24 items-center justify-center rounded-full bg-[#D3753D] px-4 text-xs font-semibold text-white">
                      Read
                    </span>
                    <span className="inline-flex h-8 w-24 items-center justify-center rounded-full bg-[#A34712] px-4 text-xs font-semibold text-white">
                      Draft Reply
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-[#F8A7B4] px-4 py-1 text-xs font-semibold text-[#5A3A2A]">
                    Temporary Credit
                  </span>
                </div>
              </button>

              {/* Other mails */}
              {[
                {
                  sender: "John Mathew @Verizon @Handshake",
                  body: "Internship offer. Respond with your resume and portfolio.",
                  extra: "Deadline : March 15, 2026",
                  tags: ["Internship", "Resume"],
                },
                {
                  sender: "John Mathew @Verizon @Handshake",
                  body: "Internship offer. Respond with your resume and portfolio.",
                  extra: "Deadline : March 15, 2026",
                  tags: [],
                },
              ].map((mail) => (
                <button
                  key={mail.sender + mail.body + mail.extra}
                  className="flex w-full flex-col rounded-2xl bg-[#FFE1CF] px-5 py-4 text-left text-sm text-[#3F2A1E] shadow-sm cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[#3F2A1E]">
                        {mail.sender}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-[#5A3A2A]">
                        {mail.body}
                      </p>
                      <p className="mt-1 text-xs text-[#5A3A2A]">{mail.extra}</p>
                    </div>
                    <div className="ml-4 space-y-2">
                      <span className="inline-flex h-8 w-24 items-center justify-center rounded-full bg-[#D3753D] px-4 text-xs font-semibold text-white">
                        Read
                      </span>
                      <span className="inline-flex h-8 w-24 items-center justify-center rounded-full bg-[#A34712] px-4 text-xs font-semibold text-white">
                        Draft Reply
                      </span>
                    </div>
                  </div>
                  {mail.tags.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      <span className="inline-block rounded-full bg-[#F8A7B4] px-4 py-1 text-xs font-semibold text-[#5A3A2A]">
                        {mail.tags[0]}
                      </span>
                      <span className="inline-block rounded-full bg-[#FFE875] px-4 py-1 text-xs font-semibold text-[#5A3A2A]">
                        {mail.tags[1]}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Drafted replies section */}
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-[#A34712]">
              Drafted Replies
            </h2>
            <div className="mt-3">
              <button className="flex w-full items-center justify-between rounded-2xl bg-[#FFE1CF] px-5 py-3 text-left text-sm text-[#3F2A1E] shadow-sm cursor-pointer">
                <span>John Mathew @Verizon @Handshake</span>
                <span className="rounded-full bg-[#D3753D] px-4 py-1 text-xs font-semibold text-white">
                  Open
                </span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MailPage;

