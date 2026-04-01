import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  ConnectedDaysFilter,
  getDateForWeekdayInAnchorWeek,
  isSameLocalDay,
  useDayFilter,
  useWeekAnchorWithSharedDayFilter,
} from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import {
  getCategoryColorById,
  useUserCategories,
} from "../services/categories";
import {
  getUserEmails,
  syncEmails,
  type ProcessedEmail,
} from "../services/api";

/**
 * A prioritized mail card item.
 */
type MailItem = {
  id: string;
  summary: string;
  sender: string;
  body: string;
  extra?: string;
  tagCategoryId?: string;
  priorityScore: number;
  date: string;
  source?: string;
};

type DraftItem = {
  id: string;
  sender: string;
};

const parseIsoDate = (value?: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const extractSenderName = (raw: string): string => {
  if (!raw) return "Unknown sender";
  const match = raw.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : raw.replace(/<[^>]+>/, "").trim() || raw;
};

const mapEmailToMailItem = (e: ProcessedEmail): MailItem => {
  const dateStr = e.receivedAt ? e.receivedAt.slice(0, 10) : "";
  const deadlineStr = e.deadlines?.length ? e.deadlines.join("; ") : undefined;
  return {
    id: e.id,
    summary: e.subject,
    sender: extractSenderName(e.sender),
    body: e.summary,
    extra: deadlineStr,
    tagCategoryId: `priority-${e.priorityLevel}`,
    priorityScore: (5 - e.priorityLevel) * 3,
    date: dateStr,
    source: e.source,
  };
};

const MailPage: React.FC = () => {
  const { selectedDay } = useDayFilter();
  const { weekAnchor, handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();

  const selectedCalendarDate = useMemo(
    () => getDateForWeekdayInAnchorWeek(weekAnchor, selectedDay),
    [weekAnchor, selectedDay],
  );

  const [mails, setMails] = useState<MailItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const categories = useUserCategories();

  const loadEmails = useCallback(async () => {
    const resp = await getUserEmails();
    if (resp.success && resp.data?.emails) {
      setMails(resp.data.emails.map(mapEmailToMailItem));
    }
  }, []);

  useEffect(() => {
    void loadEmails();

    // Kick off background sync, then refresh
    setIsSyncing(true);
    syncEmails()
      .then(() => loadEmails())
      .finally(() => setIsSyncing(false));
  }, [loadEmails]);

  const [draftReplies] = useState<DraftItem[]>([
    {
      id: "d1",
      sender: "John Mathew @Verizon @Handshake",
    },
  ]);

  const filteredMails = useMemo(
    () =>
      mails.filter((mail) => {
        const d = parseIsoDate(mail.date);
        return d ? isSameLocalDay(d, selectedCalendarDate) : true;
      }),
    [mails, selectedCalendarDate],
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
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <ConnectedDaysFilter className="!mt-0" />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">mail</span>
                  <span>Mails</span>
                  {isSyncing && (
                    <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">syncing…</span>
                  )}
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
