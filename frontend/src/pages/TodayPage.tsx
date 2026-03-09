import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  getTaskProgress,
  loadTasks,
  subscribeToTaskUpdates,
} from "../services/taskProgress";

/**
 * Important email preview shown on Today.
 * Backend can map directly into this shape once endpoint is ready.
 */
type ImportantEmailPreview = {
  id: string;
  sender: string;
  source: "gmail" | "handshake";
  tone: "urgent" | "soon" | "done";
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  title: string;
};

const IMPORTANT_EMAILS_FILLER: ImportantEmailPreview[] = [
  {
    id: "mail-1",
    sender: "Internship Application Update @Amazon",
    source: "gmail",
    tone: "urgent",
  },
  {
    id: "mail-2",
    sender: "Club meeting today",
    source: "gmail",
    tone: "soon",
  },
  {
    id: "mail-3",
    sender: "Tution deadline reminder",
    source: "gmail",
    tone: "done",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
    tone: "soon",
  },
];

const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep" },
  { time: "04:00 - 05:30", title: "Government Class" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC" },
];

const startOfWeekSunday = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const EMAIL_TONE_STYLES: Record<
  ImportantEmailPreview["tone"],
  { leftStrip: string }
> = {
  urgent: {
    leftStrip: "bg-[#D84A5D]",
  },
  soon: {
    leftStrip: "bg-[#E8C24C]",
  },
  done: {
    leftStrip: "bg-[#62AE87]",
  },
};

type TodayWeeklyHeaderProps = {
  weekStart: Date;
  onShiftWeek: (delta: number) => void;
};

const TodayWeeklyHeader: React.FC<TodayWeeklyHeaderProps> = ({
  weekStart,
  onShiftWeek,
}) => {
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  return (
    <header className="border-b border-[#F3C5A5] px-4 pb-3 pt-3 text-[#913c14] sm:px-6 sm:pb-4 sm:pt-4 lg:px-8 lg:pb-4 lg:pt-5">
      <div className="flex items-center justify-center gap-1 sm:gap-3 lg:gap-5">
        <button
          type="button"
          className="cursor-pointer text-[#913c14]"
          aria-label="Previous week"
          onClick={() => onShiftWeek(-1)}
        >
          <span className="material-symbols-outlined text-[28px] sm:text-[34px] lg:text-[38px]">
            arrow_back
          </span>
        </button>

        <p className="whitespace-nowrap text-center text-[24px] leading-none tracking-[0.03em] sm:text-[30px] sm:tracking-[0.05em] lg:text-[36px] lg:tracking-[0.06em] xl:text-[42px] xl:tracking-[0.07em]">
          {formatDate(weekStart)} - {formatDate(weekEnd)}
        </p>

        <button
          type="button"
          className="cursor-pointer text-[#913c14]"
          aria-label="Next week"
          onClick={() => onShiftWeek(1)}
        >
          <span className="material-symbols-outlined text-[28px] sm:text-[34px] lg:text-[38px]">
            arrow_forward
          </span>
        </button>
      </div>
    </header>
  );
};

const TodayPage: React.FC = () => {
  const [progress, setProgress] = useState(() => getTaskProgress(loadTasks()));
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [importantEmails, setImportantEmails] = useState<ImportantEmailPreview[]>(
    () => IMPORTANT_EMAILS_FILLER,
  );

  const weekStart = useMemo(() => startOfWeekSunday(anchorDate), [anchorDate]);

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  const getSourceIcon = (source: ImportantEmailPreview["source"]) => {
    if (source === "gmail") {
      return (
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#D14836] text-[10px] font-bold text-white">
          M
        </span>
      );
    }

    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#1E70C1] text-[10px] font-bold text-white">
        H
      </span>
    );
  };

  const shiftWeek = (delta: number) => {
    setAnchorDate((previous) => addDays(previous, delta * 7));
  };

  const handleOpenEmail = (_email: ImportantEmailPreview) => {
    // Placeholder until mail detail/open workflow is wired.
  };

  const handleDismissEmail = (emailId: string) => {
    setImportantEmails((previous) => previous.filter((email) => email.id !== emailId));
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8E7DD] p-4">
      <div className="flex min-h-0 flex-1 w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-3 text-[#913c14] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <TodayWeeklyHeader weekStart={weekStart} onShiftWeek={shiftWeek} />

          <section className="mt-5 w-full max-w-4xl sm:mt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                workspace_premium
              </span>
              <span>Progress</span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="relative h-2 flex-1 rounded-full bg-[#FFF0E5]">
                <div
                  className="h-2 rounded-full bg-[#BA4500] transition-[width] duration-200 ease-out"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-[#BA4500]">
                {progress.progressPercentage}%
              </span>
            </div>

            <p className="mt-2 text-xs text-[#A34712]">
              {progress.completedTasks}/{progress.totalTasks} tasks completed
            </p>
          </section>

          <section className="mt-5 w-full max-w-4xl sm:mt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                star
              </span>
              <span>Important Emails</span>
            </div>

            <div className="mt-2 space-y-2">
              {importantEmails.map((mail) => {
                const toneStyles = EMAIL_TONE_STYLES[mail.tone];

                return (
                  <div
                    key={mail.id}
                    className="group relative w-full overflow-visible"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -left-1 inset-y-0 right-1 rounded-xl ${toneStyles.leftStrip}`}
                    />

                    <div className="relative z-10 flex w-full items-center justify-between rounded-xl bg-[#FFF0E5] px-4 py-2 pl-5 text-left text-sm text-[#6D2F12]">
                      <button
                        type="button"
                        onClick={() => handleOpenEmail(mail)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {getSourceIcon(mail.source)}
                        <span className="truncate">{mail.sender}</span>
                      </button>

                      <div className="ml-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEmail(mail)}
                          className="inline-flex h-8 items-center justify-center rounded-full bg-[#D75B00] px-4 text-xs font-semibold text-white opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                          aria-label={`Open email from ${mail.sender}`}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissEmail(mail.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8D3C4] text-[#7A4023] opacity-0 transition-opacity duration-150 ease-out hover:bg-[#DFBFA9] group-hover:opacity-100 group-focus-within:opacity-100"
                          aria-label={`Dismiss email from ${mail.sender}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-6 w-full max-w-4xl sm:mt-7">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                event_note
              </span>
              <span>Upcoming Events</span>
            </div>

            <div className="mt-2 space-y-2">
              {EVENTS.map((event, index) => {
                const background =
                  index === 0
                    ? "bg-[#FFF0E5]"
                    : index === 1
                    ? "bg-[#FAE6D9]"
                    : "bg-[#FED3B4]";

                return (
                  <div
                    key={event.title}
                    className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm text-[#6D2F12] ${background}`}
                  >
                    <span className="text-sm font-medium">{event.time}</span>
                    <span className="ml-6 flex-1 text-right md:text-left">
                      {event.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TodayPage;
