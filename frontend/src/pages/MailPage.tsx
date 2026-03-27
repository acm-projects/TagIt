import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  ConnectedDaysFilter,
  useDayFilter,
  type WeekdayShort,
} from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";

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
  tagCategoryId?: string;
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
      body: "Need a screenshot of your current enrollment.",
      tagCategoryId: "priority-4",
      priorityScore: 10,
      day: "mon",
    },
    {
      id: "m1b",
      summary: "Club Budget Follow-Up",
      sender: "Student Activities Board",
      body: "Please review the revised budget request before Monday evening so the funding vote can stay on schedule. We added notes to the travel line items, updated the projected turnout numbers, and included a revised breakdown for equipment, catering, and room setup so the committee can approve everything in one pass.",
      extra: "Meeting: March 29, 2026 at 6:30 PM in the Student Union conference room. Bring the updated spreadsheet and the reimbursement receipts if you have them.",
      tagCategoryId: "priority-1",
      priorityScore: 8,
      day: "mon",
    },
    {
      id: "m2",
      summary: "Internship Offer",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      extra: "Deadline : March 15, 2026",
      tagCategoryId: "priority-3",
      priorityScore: 9,
      day: "tue",
    },
    {
      id: "m3",
      summary: "Resume Request",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      extra: "Deadline : March 15, 2026",
      tagCategoryId: "priority-3",
      priorityScore: 6,
      day: "wed",
    },
    {
      id: "m4",
      summary: "Deadline Reminder",
      sender: "Registrar Office",
      body: "Reminder to submit your semester enrollment confirmation before the stated deadline.",
      extra: "Due: March 20, 2026",
      tagCategoryId: "priority-4",
      priorityScore: 7,
      day: "fri",
    },
  ]);
  const categories = useUserCategories();

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

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <ConnectedDaysFilter className="!mt-0" />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">mail</span>
                  <span>Mails</span>
                </div>

                <div className="mt-3">
                  {sortedMails.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No messages for this day.</p>
                  ) : (
                    sortedMails.map((mail, index) => (
                      <div
                        key={mail.id}
                        className="group grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-x-4 py-4"
                        style={{
                          borderBottom:
                            index === sortedMails.length - 1 ? "none" : "0.5px solid #E5E7EB",
                        }}
                      >
                        <div
                          aria-hidden="true"
                          className="h-full min-h-[5rem] w-[6px] self-stretch rounded-full"
                          style={{
                            backgroundColor: getCategoryColorById(categories, mail.tagCategoryId),
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenMail(mail)}
                          className="min-w-0 text-left"
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-[13px] font-semibold text-[#111827] sm:text-sm">
                              {mail.summary}
                            </p>
                            {mail.priorityScore >= 9 && (
                              <span className="rounded-full border border-[#fecdd3] bg-[#fee2e2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ef4444]">
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1 text-[11px] leading-snug text-[#6B7280] sm:max-w-[32rem]">
                            <p className="truncate text-[12px]">{mail.sender}</p>
                            <p className="line-clamp-2 text-[12px]">{mail.body}</p>
                            {mail.extra && <p className="truncate text-[12px]">{mail.extra}</p>}
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-2 self-center">
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
