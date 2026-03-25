import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import { ConnectedDaysFilter } from "../components/DaysFilter";
import type { WeekdayShort } from "../lib/weekday";
import { useDayFilter } from "../context/DayFilterContext";
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
  day: WeekdayShort;
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
  const { selectedDay } = useDayFilter();

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

  const handleOpenMail = (_mail: MailItem) => {
    // Placeholder until mail detail workflow is wired.
  };

  const handleOpenDraft = (_draft: DraftItem) => {
    // Placeholder until draft editor is wired.
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-5 space-y-4 sm:mt-6">
            <ConnectedDaysFilter className="!mt-0" />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">mail</span>
                  <span>Mails</span>
                </div>

                <div className="mt-3 space-y-3">
                  {sortedMails.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No messages for this day.</p>
                  ) : (
                    sortedMails.map((mail) => (
                      <div
                        key={mail.id}
                        className="rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-2 shadow-[0_6px_14px_rgba(17,24,39,0.05)]"
                      >
                        <div className="group flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenMail(mail)}
                            className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-[#111827]">{mail.summary}</span>
                              {mail.priorityScore >= 9 && (
                                <span className="rounded-full border border-[#fecdd3] bg-[#fee2e2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ef4444]">
                                  Urgent
                                </span>
                              )}
                              {mail.tags.map((tag) => {
                                const { backgroundColor, color } = getTagStyles(tag);
                                return (
                                  <span
                                    key={tag}
                                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-tight"
                                    style={{ backgroundColor, color }}
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                            <p className="w-full truncate text-[12px] text-[#6B7280]">{mail.sender}</p>
                            <p className="line-clamp-2 w-full text-[12px] leading-snug text-[#6B7280]">
                              {mail.body}
                            </p>
                            {mail.extra && (
                              <p className="w-full truncate text-[12px] text-[#6B7280]">{mail.extra}</p>
                            )}
                          </button>

                          <div className="flex shrink-0 items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleOpenMail(mail)}
                              className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Open ${mail.summary}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">draft</span>
                  <span>Drafted Replies</span>
                </div>

                <div className="mt-3 space-y-3">
                  {draftReplies.map((draft) => (
                    <div
                      key={draft.id}
                      className="rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-4 py-2 shadow-[0_6px_14px_rgba(17,24,39,0.05)]"
                    >
                      <div className="group flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenDraft(draft)}
                          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                        >
                          <span className="text-sm font-semibold text-[#111827]">{draft.sender}</span>
                          <p className="w-full truncate text-[12px] text-[#6B7280]">Draft reply</p>
                        </button>

                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDraft(draft)}
                            className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label={`Open draft for ${draft.sender}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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

export default MailPage;
