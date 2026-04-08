import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  NullableConnectedDaysFilter,
  type WeekdayShort,
  useNullableDayFilter,
} from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import FilterMenuButton, { type FilterOption } from "../components/FilterMenuButton";
import { loadConnectedEmails } from "../services/connectedUser";

/**
 * A prioritized mail card item.
 * Backend message ranking can map directly to `priorityScore`.
 */
type MailItem = {
  id: string;
  summary: string;
  sender: string;
  body: string;
  accountEmail: string;
  extra?: string;
  tagCategoryId?: string;
  priorityScore: number;
  day: WeekdayShort;
  needsReply?: boolean;
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
  const { nullableDay: mailDay, setNullableDay: setMailDay } = useNullableDayFilter();
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());

  /**
   * Seed data for UI prototyping.
   * Replace these with API responses once backend integration is ready.
   */
  const [mails, setMails] = useState<MailItem[]>([
    {
      id: "m1",
      summary: "Transfer Credit",
      sender: "Joshua Montogermy",
      body: "Need a screenshot of your current enrollment.",
      accountEmail: "email1@gmail.com",
      tagCategoryId: "priority-4",
      priorityScore: 10,
      day: "mon",
    },
    {
      id: "m1b",
      summary: "Club Budget Follow-Up",
      sender: "Student Activities Board",
      body: "Please review the revised budget request before Monday evening so the funding vote can stay on schedule. We added notes to the travel line items, updated the projected turnout numbers, and included a revised breakdown for equipment, catering, and room setup so the committee can approve everything in one pass.",
      accountEmail: "email2@outlook.com",
      extra: "Meeting: March 29, 2026 at 6:30 PM in the Student Union conference room. Bring the updated spreadsheet and the reimbursement receipts if you have them.",
      tagCategoryId: "priority-1",
      priorityScore: 8,
      day: "mon",
      needsReply: true,
    },
    {
      id: "m2",
      summary: "Internship Offer",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      accountEmail: "email1@gmail.com",
      extra: "Deadline : March 15, 2026",
      tagCategoryId: "priority-3",
      priorityScore: 9,
      day: "tue",
      needsReply: true,
    },
    {
      id: "m3",
      summary: "Resume Request",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      accountEmail: "email2@outlook.com",
      extra: "Deadline : March 15, 2026",
      tagCategoryId: "priority-3",
      priorityScore: 6,
      day: "wed",
      needsReply: true,
    },
    {
      id: "m4",
      summary: "Deadline Reminder",
      sender: "Registrar Office",
      body: "Reminder to submit your semester enrollment confirmation before the stated deadline.",
      accountEmail: "email3@utdallas.edu",
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

  const [slidingMailIds, setSlidingMailIds] = useState<Set<string>>(new Set());
  const [closingMailIds, setClosingMailIds] = useState<Set<string>>(new Set());

  const filteredMails = useMemo(
    () =>
      mails.filter((mail) => {
        const matchesDay = mailDay ? mail.day === mailDay : true;
        const matchesAccount =
          selectedAccount === "all" ? true : mail.accountEmail === selectedAccount;
        return matchesDay && matchesAccount;
      }),
    [mails, mailDay, selectedAccount],
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

  const handleDraftReply = (_mail: MailItem) => {
    // Placeholder: open draft composer prefilled with this mail's context.
  };

  const triggerMailSlide = (mailId: string) => {
    setSlidingMailIds((prev) => {
      const next = new Set(prev);
      next.add(mailId);
      return next;
    });
  };

  const completeMail = (mail: MailItem) => {
    triggerMailSlide(mail.id);

    // Start closing slightly after slide begins so glow is visible
    const closeTimer = setTimeout(() => {
      setClosingMailIds((prev) => {
        const next = new Set(prev);
        next.add(mail.id);
        return next;
      });
    }, 220);

    const removeTimer = setTimeout(() => {
      setMails((prev) => prev.filter((m) => m.id !== mail.id));
      setSlidingMailIds((prev) => {
        const next = new Set(prev);
        next.delete(mail.id);
        return next;
      });
      setClosingMailIds((prev) => {
        const next = new Set(prev);
        next.delete(mail.id);
        return next;
      });
    }, 520);

    // Optional: clear timers if component unmounts soon (not critical here)
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(removeTimer);
    };
  };

  useEffect(() => {
    setConnectedEmails(loadConnectedEmails());
  }, []);

  const accountOptions: FilterOption[] = [{ value: "all", label: "All" }].concat(
    (connectedEmails.length ? connectedEmails : Array.from(new Set(mails.map((m) => m.accountEmail)))).map(
      (email) => ({ value: email, label: email })
    )
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <NullableConnectedDaysFilter className="!mt-0" value={mailDay} onChange={setMailDay} />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">mail</span>
                    <span>Mails</span>
                  </div>
                  <div className="flex items-center gap-2 pr-1">
                    <FilterMenuButton
                      options={accountOptions}
                      selectedValue={selectedAccount}
                      onSelect={setSelectedAccount}
                      ariaLabel="Filter mails by account"
                      emptyMessage="No accounts yet"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {sortedMails.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">
                      {mailDay ? "No messages for this day." : "No messages this week."}
                    </p>
                  ) : (
                    sortedMails.map((mail, index) => {
                      const isSliding = slidingMailIds.has(mail.id);
                      const isClosing = closingMailIds.has(mail.id);

                      return (
                      <div
                        key={mail.id}
                        className={`group grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-x-4 py-4 px-3 -mx-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(15,23,42,0.06)] email-row ${isSliding ? "email-row--slide-up" : ""} ${isClosing ? "email-row--closing" : ""}`}
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
                            <div className="overflow-hidden max-h-10 opacity-80 transition-[max-height,opacity] duration-900 ease-[cubic-bezier(0.16,1,0.3,1)] delay-1500 group-hover:max-h-52 group-hover:opacity-100 group-hover:delay-0">
                              <p className="text-[12px] text-[#4B5563] whitespace-pre-line">{mail.body}</p>
                              {mail.extra && (
                                <p className="mt-1 text-[12px] text-[#6B7280] whitespace-pre-line">{mail.extra}</p>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-2 self-center">
                          {mail.needsReply && (
                            <button
                              type="button"
                              onClick={() => handleDraftReply(mail)}
                              className="inline-flex h-7 items-center justify-center rounded-full border border-[#E5E7EB] px-3 text-[11px] font-semibold text-[#374151] opacity-0 transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0"
                              aria-label={`Draft reply to ${mail.summary}`}
                            >
                              Draft reply
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => completeMail(mail)}
                            className="inline-flex h-7 w-7 items-center justify-center text-[#22c55e] opacity-0 transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0"
                            aria-label={`Open ${mail.summary}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                        </div>
                      </div>
                    );
                    })
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

                <div className="mt-3 space-y-0.5 pl-2.5 sm:pl-3.5">
                  {draftReplies.map((draft, index) => (
                    <div
                      key={draft.id}
                      className="tagged-item group flex items-start gap-3 py-1.5 text-sm text-[#1F2933]"
                      style={{
                        borderBottom: index === draftReplies.length - 1 ? "none" : "0.5px solid #E5E7EB",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenDraft(draft)}
                        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                      >
                        <span className="text-sm font-semibold text-[#111827] truncate">
                          {draft.sender}
                        </span>
                        <p className="w-full truncate text-[12px] text-[#6B7280] leading-tight">Draft reply</p>
                      </button>

                      <div className="flex shrink-0 items-center gap-2">
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
