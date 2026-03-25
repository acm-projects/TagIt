import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import WeekHeader from "../components/WeekHeader";
import {
  getTaskProgress,
  loadTasks,
  subscribeToTaskUpdates,
} from "../services/taskProgress";

/**
 * Important email preview shown on Today.
 * Backend can map directly into this shape once endpoint is ready.
 */
type CategoryColor = { bg: string; text: string; border: string };

type UserCategory = {
  id: string;
  label: string;
  color?: CategoryColor;
  isCustom?: boolean;
};

type ImportantEmailPreview = {
  id: string;
  sender: string;
  source: "gmail" | "handshake";
  tone: "urgent" | "soon" | "done";
  summary: string;
  priority?: "urgent";
  tagCategoryId?: string;
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  title: string;
  tagCategoryId?: string;
};

const CUSTOM_COLOR_PALETTE: CategoryColor[] = [
  { bg: "bg-[#fee2e2]", text: "text-[#b91c1c]", border: "border-[#fecdd3]" }, // red
  { bg: "bg-[#DBEAFE]", text: "text-[#1D4ED8]", border: "border-[#BFDBFE]" }, // blue
  { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#BAE6FD]" }, // teal
  { bg: "bg-[#FCE7F3]", text: "text-[#BE185D]", border: "border-[#FBCFE8]" }, // pink
  { bg: "bg-[#F5F3FF]", text: "text-[#6D28D9]", border: "border-[#DDD6FE]" }, // purple
  { bg: "bg-[#ECFCCB]", text: "text-[#3F6212]", border: "border-[#D9F99D]" }, // lime
  { bg: "bg-[#FEF9C3]", text: "text-[#A16207]", border: "border-[#FDE68A]" }, // amber
];

const USER_SELECTED_CATEGORIES: UserCategory[] = [
  { id: "urgent", label: "Urgent", color: CUSTOM_COLOR_PALETTE[0] },
  { id: "work", label: "Work", color: CUSTOM_COLOR_PALETTE[1] },
  { id: "school", label: "School", color: CUSTOM_COLOR_PALETTE[2] },
  { id: "personal", label: "Personal", color: CUSTOM_COLOR_PALETTE[3] },
  // Example custom category chosen during setup; color will be auto-assigned if not provided.
  { id: "side-hustle", label: "Side Hustle", isCustom: true },
];

const ensureDistinctColors = (
  categories: UserCategory[],
  palette: CategoryColor[],
): UserCategory[] => {
  const used = new Set<string>();
  categories.forEach((c) => {
    if (c.color) used.add(`${c.color.bg}|${c.color.text}|${c.color.border}`);
  });

  let paletteIndex = 0;

  return categories.map((category) => {
    if (category.color) return category;

    while (paletteIndex < palette.length) {
      const candidate = palette[paletteIndex];
      paletteIndex += 1;
      const key = `${candidate.bg}|${candidate.text}|${candidate.border}`;
      if (!used.has(key)) {
        used.add(key);
        return { ...category, color: candidate };
      }
    }

    // Fallback: reuse first palette color if exhausted (still deterministic)
    const fallback = palette[palette.length - 1];
    return { ...category, color: fallback };
  });
};

const IMPORTANT_EMAILS_FILLER: ImportantEmailPreview[] = [
  {
    id: "mail-1",
    sender: "Internship Application Update @Amazon",
    source: "gmail",
    tone: "urgent",
    summary: "Recruiter requested availability for next round; check attached timeline and confirm slots.",
    priority: "urgent",
    tagCategoryId: "urgent",
  },
  {
    id: "mail-2",
    sender: "Club meeting today",
    source: "gmail",
    tone: "soon",
    summary: "Agenda covers officer elections, budget approval, and venue change for next semester events.",
    tagCategoryId: "personal",
  },
  {
    id: "mail-3",
    sender: "Tution deadline reminder",
    source: "gmail",
    tone: "done",
    summary: "Billing portal shows outstanding balance due Friday; late fee applies after 5 PM CST.",
    tagCategoryId: "school",
  },
  {
    id: "mail-4",
    sender: "John Dollinger @CS 3377",
    source: "gmail",
    tone: "soon",
    summary: "Project checkpoint moved to next Monday; submit design doc draft before lab session.",
    priority: "urgent",
    tagCategoryId: "work",
  },
];

const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep", tagCategoryId: "school" },
  { time: "04:00 - 05:30", title: "Government Class", tagCategoryId: "school" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC", tagCategoryId: "work" },
];

const TodayPage: React.FC = () => {
  const [progress, setProgress] = useState(() => getTaskProgress(loadTasks()));
  const [importantEmails] = useState<ImportantEmailPreview[]>(() => IMPORTANT_EMAILS_FILLER);
  const userCategories = useMemo(
    () => ensureDistinctColors(USER_SELECTED_CATEGORIES, CUSTOM_COLOR_PALETTE),
    [],
  );
  const categoryMap = useMemo(
    () =>
      userCategories.reduce<Record<string, UserCategory>>((map, category) => {
        map[category.id] = category;
        return map;
      }, {}),
    [userCategories],
  );

  useEffect(() => {
    const refreshProgress = () => {
      setProgress(getTaskProgress(loadTasks()));
    };

    refreshProgress();
    return subscribeToTaskUpdates(refreshProgress);
  }, []);

  const getSourceIcon = (source: ImportantEmailPreview["source"]) => {
    if (source === "gmail") {
      return null;
    }

    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#5C9BFF] text-[10px] font-bold text-white">
        H
      </span>
    );
  };

  const handleOpenEmail = (_email: ImportantEmailPreview) => {
    // Placeholder until mail detail/open workflow is wired.
  };

  const getTagMeta = (categoryId?: string) =>
    categoryId ? categoryMap[categoryId] : undefined;

  const resolveBadge = (mail: ImportantEmailPreview) => {
    const tagMeta = getTagMeta(mail.tagCategoryId);
    if (!tagMeta?.color) return null;

    return {
      label: tagMeta.label,
      className: `${tagMeta.color.border} ${tagMeta.color.bg} ${tagMeta.color.text}`,
    };
  };

  return (
    <div className="today-page flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="today-scroll flex min-h-0 flex-1 flex-col overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-5 space-y-4 sm:mt-6">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    workspace_premium
                  </span>
                  <span>Weekly Progress</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Tasks Completed</span>
                  <span className="text-sm">
                    <span className="font-semibold text-[#f9ab7b]">
                      {progress.completedTasks}
                    </span>
                    <span className="text-[#9CA3AF]">/{progress.totalTasks}</span>
                  </span>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-[#fde6d7]">
                  <div
                    className="h-2 rounded-full bg-[#f9ab7b] transition-[width] duration-200 ease-out"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    star
                  </span>
                  <span>Important Emails</span>
                </div>

                <div className="mt-3">
                  {importantEmails.map((mail, index) => {
                    return (
                      <div
                        key={mail.id}
                        className="group flex items-start gap-3 py-2"
                        style={{ borderBottom: index === importantEmails.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 h-full w-1 self-stretch rounded-full bg-[#f9ab7b]"
                        />

                        <button
                          type="button"
                          onClick={() => handleOpenEmail(mail)}
                          className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#111827]">
                              {mail.sender}
                            </span>
                            {(() => {
                              const badge = resolveBadge(mail);
                              if (!badge) return null;
                              return (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="w-full truncate text-[12px] text-[#6B7280]">
                            {mail.summary}
                          </p>
                          {mail.source !== "gmail" && (
                            <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                              {getSourceIcon(mail.source)}
                              <span className="capitalize">{mail.source}</span>
                            </div>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(mail)}
                            className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label={`Open email from ${mail.sender}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    event_note
                  </span>
                  <span>Upcoming Events</span>
                </div>

                <div className="mt-3 space-y-1">
                  {EVENTS.map((event, index) => {
                    const category = getTagMeta(event.tagCategoryId);
                    const chipStyles = category?.color
                      ? `${category.color.bg} ${category.color.text}`
                      : "bg-[#E5E7EB] text-[#374151]";

                    return (
                      <div
                        key={event.title}
                        className="group flex items-start gap-3 py-1 text-sm text-[#1F2933]"
                        style={{ borderBottom: index === EVENTS.length - 1 ? "none" : "0.5px solid #E5E7EB" }}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 h-full w-1 self-stretch rounded-full bg-[#f9ab7b]"
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#111827]">
                              {event.title}
                            </span>
                            <span className="text-xs font-medium text-[#6B7280] whitespace-nowrap">
                              {event.time}
                            </span>
                          </div>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${chipStyles}`}>
                          {category?.label ?? "event"}
                        </span>
                      </div>
                    );
                  })}
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

export default TodayPage;
