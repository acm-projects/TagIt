import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import WeekHeader from "../components/WeekHeader";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";
import { getUserCategories, type UserCategory } from "../services/categories";

type CalendarEvent = {
  title: string;
  date1: string;
  day1: string;
  date2?: string;
  day2?: string;
  time: string;
  source: "google" | "outlook";
  tagCategoryId?: string;
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    title: "ACM Social Night #1",
    date1: "02/21/2026",
    day1: "Sat",
    time: "07:00 - 10:00",
    source: "google",
    tagCategoryId: "personal",
  },
  {
    title: "WeHack - Hackathon",
    date1: "03/01/2026",
    day1: "Sat",
    date2: "03/02/2026",
    day2: "Sun",
    time: "09:00 - 24:00\n00:00 - 05:30",
    source: "outlook",
    tagCategoryId: "work",
  },
  {
    title: "Resume Review Drop-In",
    date1: "03/05/2026",
    day1: "Thu",
    time: "01:30 - 02:30",
    source: "google",
    tagCategoryId: "school",
  },
  {
    title: "Systems Project Checkpoint",
    date1: "03/06/2026",
    day1: "Fri",
    time: "11:00 - 12:15",
    source: "outlook",
    tagCategoryId: "work",
  },
];

const CalendarPage: React.FC = () => {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const DEFAULT_COLOR = "#E5E7EB";

  useEffect(() => {
    let mounted = true;
    getUserCategories().then((data) => {
      if (mounted) setCategories(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const uncategorized = useMemo<UserCategory>(
    () => ({ id: "uncategorized", name: "Uncategorized", color: DEFAULT_COLOR, isCustom: false }),
    [],
  );

  const getCategory = (categoryId?: string) => {
    if (!categoryId) return undefined;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      console.warn("Missing category for id", categoryId);
    }
    return category;
  };

  const getCategoryColor = (category?: UserCategory) => {
    if (!category?.color) {
      console.warn("Category missing color, falling back", category);
      return DEFAULT_COLOR;
    }
    return category.color;
  };

  return (
    <div className="calendar-page flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} />

          <div className="mt-4 space-y-4 sm:mt-5">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">
                    event_note
                  </span>
                  <span>Calendar Events</span>
                </div>

                <div className="mt-3 space-y-2">
                  {CALENDAR_EVENTS.map((event, index) => {
                    const category = getCategory(event.tagCategoryId) ?? uncategorized;

                    return (
                      <div
                        key={event.title + index}
                        className="tagged-item group rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] px-3 py-2 shadow-[0_6px_14px_rgba(17,24,39,0.05)]"
                      >
                        <span
                          aria-hidden="true"
                          className="color-line h-full min-h-9"
                          style={{ backgroundColor: getCategoryColor(category) }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <p className="truncate text-[13px] font-semibold text-[#111827] sm:text-sm">
                              {event.title}
                            </p>
                          </div>

                          <div className="mt-1.5 grid grid-cols-3 gap-x-3 text-[11px] leading-tight text-[#6B7280] sm:max-w-[24rem]">
                            <div>
                              <p className="font-medium text-[#374151]">Date</p>
                              <p>{event.date1}</p>
                              {event.date2 && <p>{event.date2}</p>}
                            </div>
                            <div>
                              <p className="font-medium text-[#374151]">Day</p>
                              <p>{event.day1}</p>
                              {event.day2 && <p>{event.day2}</p>}
                            </div>
                            <div>
                              <p className="font-medium text-[#374151]">Time</p>
                              <p className="whitespace-pre-line">{event.time}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1 self-center">
                          <button
                            type="button"
                            aria-label="Add"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#f9ab7b] transition-colors hover:bg-[#FFF4EC]"
                          >
                            <span
                              className="inline-block h-3 w-3 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                              style={{
                                maskImage: `url(${addIcon})`,
                                WebkitMaskImage: `url(${addIcon})`,
                              }}
                              aria-hidden
                            />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#f9ab7b] transition-colors hover:bg-[#FFF4EC]"
                          >
                            <span
                              className="inline-block h-3 w-3 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                              style={{
                                maskImage: `url(${deleteIcon})`,
                                WebkitMaskImage: `url(${deleteIcon})`,
                              }}
                              aria-hidden
                            />
                          </button>
                        </div>
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

export default CalendarPage;
