import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  NullableConnectedDaysFilter,
  getDateForWeekdayInAnchorWeek,
  isSameLocalDay,
  useNullableDayFilter,
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
import FilterMenuButton, { type FilterOption } from "../components/FilterMenuButton";
import { loadConnectedEmails } from "../services/connectedUser";

/**
 * A prioritized mail card item.
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
  date: string;
  source?: string;
  needsReply?: boolean;
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
    accountEmail: e.source || "",
    extra: deadlineStr,
    tagCategoryId: `priority-${e.priorityLevel}`,
    priorityScore: (5 - e.priorityLevel) * 3,
    date: dateStr,
    source: e.source,
  };
};

/** Delay after leaving a row before collapsing (lets pointer enter next row without flicker). */
const MAIL_ROW_LEAVE_COLLAPSE_MS = 160;
/** Pause after collapsing the previous row before expanding the newly hovered row. */
const MAIL_EXPAND_AFTER_COLLAPSE_MS = 260;
/** Max-height transition for body expand/collapse (ms). */
const MAIL_BODY_TRANSITION_MS = 320;

const MailPage: React.FC = () => {
  const { nullableDay: mailDay, setNullableDay: setMailDay } = useNullableDayFilter();
  const { weekAnchor, handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());

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

  const [expandedMailId, setExpandedMailId] = useState<string | null>(null);
  const leaveCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandAfterCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMailHoverTimers = useCallback(() => {
    if (leaveCollapseTimerRef.current !== null) {
      clearTimeout(leaveCollapseTimerRef.current);
      leaveCollapseTimerRef.current = null;
    }
    if (expandAfterCollapseTimerRef.current !== null) {
      clearTimeout(expandAfterCollapseTimerRef.current);
      expandAfterCollapseTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearMailHoverTimers(), [clearMailHoverTimers]);

  const handleMailRowEnter = useCallback(
    (mailId: string) => {
      clearMailHoverTimers();
      if (expandedMailId === mailId) {
        return;
      }
      if (expandedMailId !== null && expandedMailId !== mailId) {
        setExpandedMailId(null);
        expandAfterCollapseTimerRef.current = setTimeout(() => {
          expandAfterCollapseTimerRef.current = null;
          setExpandedMailId(mailId);
        }, MAIL_EXPAND_AFTER_COLLAPSE_MS);
        return;
      }
      setExpandedMailId(mailId);
    },
    [clearMailHoverTimers, expandedMailId],
  );

  const handleMailRowLeave = useCallback(() => {
    clearMailHoverTimers();
    leaveCollapseTimerRef.current = setTimeout(() => {
      leaveCollapseTimerRef.current = null;
      setExpandedMailId(null);
    }, MAIL_ROW_LEAVE_COLLAPSE_MS);
  }, [clearMailHoverTimers]);

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
        if (mailDay) {
          const selectedDate = getDateForWeekdayInAnchorWeek(weekAnchor, mailDay);
          if (d && !isSameLocalDay(d, selectedDate)) return false;
        } else if (d) {
          // No day selected → show only the current week (Mon–Sun)
          const weekMon = getDateForWeekdayInAnchorWeek(weekAnchor, "mon");
          const weekSun = getDateForWeekdayInAnchorWeek(weekAnchor, "sun");
          weekSun.setHours(23, 59, 59, 999);
          if (d < weekMon || d > weekSun) return false;
        }
        const matchesAccount =
          selectedAccount === "all" ? true : mail.accountEmail === selectedAccount;
        return matchesAccount;
      }),
    [mails, mailDay, weekAnchor, selectedAccount],
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
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <NullableConnectedDaysFilter className="!mt-0" value={mailDay} onChange={setMailDay} />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">mail</span>
                    <span>Mails</span>
                    {isSyncing && (
                      <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">syncing…</span>
                    )}
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
                      const isExpanded = expandedMailId === mail.id;
                      return (
                      <div
                        key={mail.id}
                        className="group grid grid-cols-[6px_minmax(0,1fr)_auto] items-stretch gap-x-4 py-4"
                        style={{
                          borderBottom:
                            index === sortedMails.length - 1 ? "none" : "0.5px solid #E5E7EB",
                        }}
                        onMouseEnter={() => handleMailRowEnter(mail.id)}
                        onMouseLeave={handleMailRowLeave}
                      >
                        <div
                          aria-hidden="true"
                          className="w-[6px] shrink-0 self-stretch rounded-full min-h-[2.75rem]"
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
                            <div
                              className={
                                isExpanded
                                  ? "max-h-[min(28rem,72vh)] overflow-y-auto overflow-x-hidden"
                                  : "max-h-10 overflow-hidden"
                              }
                              style={{
                                transitionProperty: "max-height",
                                transitionDuration: `${MAIL_BODY_TRANSITION_MS}ms`,
                                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            >
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
                              className="inline-flex h-7 items-center justify-center rounded-full border border-[#E5E7EB] px-3 text-[11px] font-semibold text-[#374151] opacity-0 transition-all duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Draft reply to ${mail.summary}`}
                            >
                              Draft reply
                            </button>
                          )}
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
