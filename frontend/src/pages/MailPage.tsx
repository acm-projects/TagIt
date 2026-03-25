import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import SectionHeader from "../components/SectionHeader";
import WeekHeader from "../components/WeekHeader";

/**
 * A prioritized mail card item.
 * Backend message ranking can map directly to `priorityScore`.
 */
type MailItem = {
  id: string;
  summary: string;
  sender: string;
  body: string;
  extra?: string;
  tags: string[];
  priorityScore: number;
  day: "mon" | "tue" | "wed" | "thur" | "fri" | "sat" | "sun";
};

/**
 * Simple draft item shown in the "Drafted Replies" section.
 * Backend integration can attach thread ids/message ids later.
 */
type DraftItem = {
  id: string;
  sender: string;
};

const MailPage: React.FC = () => {
  /**
   * Seed data for UI prototyping.
   * Replace these with API responses once backend integration is ready.
   */
  const [mails] = useState<MailItem[]>([
    {
      id: "m1",
      summary: "Transfer Credit",
      sender: "Joshua Montogermy",
      body: "Requesting a screenshot of current off-campus enrollment (with courses and college) to grant temporary credit while awaiting transfer.",
      tags: ["Temporary Credit"],
      priorityScore: 10,
      day: "mon",
    },
    {
      id: "m2",
      summary: "Internship Offer",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      extra: "Deadline : March 15, 2026",
      tags: ["Internship", "Resume"],
      priorityScore: 9,
      day: "tue",
    },
    {
      id: "m3",
      summary: "Resume Request",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      extra: "Deadline : March 15, 2026",
      tags: [],
      priorityScore: 6,
      day: "wed",
    },
    {
      id: "m4",
      summary: "Deadline Reminder",
      sender: "Registrar Office",
      body: "Reminder to submit your semester enrollment confirmation before the stated deadline.",
      extra: "Due: March 20, 2026",
      tags: ["Enrollment", "Reminder"],
      priorityScore: 7,
      day: "fri",
    },
  ]);

  const [draftReplies] = useState<DraftItem[]>([
    {
      id: "d1",
      sender: "John Mathew @Verizon @Handshake",
    },
  ]);

  const days: MailItem["day"][] = ["sun", "mon", "tue", "wed", "thur", "fri", "sat"];
  const [selectedDay, setSelectedDay] = useState<MailItem["day"]>("sun");

  const filteredMails = useMemo(
    () => mails.filter((mail) => mail.day === selectedDay),
    [mails, selectedDay],
  );

  const sortedMails = useMemo(
    () => [...filteredMails].sort((a, b) => b.priorityScore - a.priorityScore),
    [filteredMails],
  );

  const getTagStyles = (tag: string): { backgroundColor: string; color: string } => {
    const normalized = tag.toLowerCase();
    if (normalized.includes("temporary")) {
      return { backgroundColor: "#DCD6B2", color: "#7A4A2F" };
    }
    if (normalized.includes("internship")) {
      return { backgroundColor: "#EBC7B2", color: "#7A4A2F" };
    }
    if (normalized.includes("resume")) {
      return { backgroundColor: "#F4E1C8", color: "#7A4A2F" };
    }
    return { backgroundColor: "#EFD9BE", color: "#7A4A2F" };
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {days.map((day) => {
              const isActive = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    isActive
                      ? "border-[#f9ab7b] bg-[#fde6d7] text-[#c96f39]"
                      : "border-transparent bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                  aria-pressed={isActive}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <section className="mt-6">
            <SectionHeader
              title="Mails"
              icon={<span className="material-symbols-outlined text-[18px]">mail</span>}
            />

            <div className="mt-3 space-y-2">
              {sortedMails.map((mail) => (
                <button
                  key={mail.id}
                  type="button"
                  className="group relative flex w-full flex-col items-stretch rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-2 text-left text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)] transition-all duration-150 ease-out hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="flex items-start gap-3 pr-10">
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold leading-tight text-[#111827]">
                        {mail.summary}
                      </p>
                      <p className="mt-0.5 text-[10.5px] font-medium text-[#6B7280]">
                        {mail.sender}
                      </p>
                      <p
                        className="mt-1 text-[12px] leading-snug text-[#4B5563]"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {mail.body}
                      </p>
                      {mail.extra && (
                        <p className="mt-1 text-[10.5px] text-[#6B7280]">{mail.extra}</p>
                      )}
                      {mail.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {mail.tags.map((tag) => {
                            const { backgroundColor, color } = getTagStyles(tag);
                            return (
                              <span
                                key={tag}
                                className="inline-block rounded-full px-2 py-[3px] text-[9px] font-medium tracking-tight shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                                style={{ backgroundColor, color }}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="absolute right-4 top-1/2 flex -translate-y-1/2 translate-x-2 items-center opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#f9ab7b] transition-transform duration-200 ease-out group-hover:scale-110">
                      check
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <SectionHeader
              title="Drafted Replies"
              icon={<span className="material-symbols-outlined text-[18px]">draft</span>}
            />

            <div className="mt-3 space-y-2.5">
              {draftReplies.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  className="group relative flex w-full items-center justify-between rounded-2xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-2.5 text-left text-sm text-[#1F2933] shadow-[0_6px_14px_rgba(17,24,39,0.05)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md"
                >
                  <span>{draft.sender}</span>

                  <div
                    className="absolute right-4 top-1/2 flex -translate-y-1/2 translate-x-2 items-center opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b] transition-transform duration-200 ease-out group-hover:scale-110">
                      check
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>

        <AppNavbar />
      </div>
    </div>
  );
};

export default MailPage;
