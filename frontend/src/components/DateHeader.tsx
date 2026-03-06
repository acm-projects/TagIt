import React, { useState } from "react";

/**
 * Props for the reusable date header component.
 *
 * `date` and `dayName` are kept for backwards-compatibility and can
 * provide an initial value, but the component now manages its own
 * internal date state and will update when the user clicks the arrows.
 */
interface DateHeaderProps {
  date?: string;
  dayName?: string;
}

/**
 * Utility to parse a date string in MM/DD/YYYY format.
 * Returns `null` if parsing fails so we can safely fall back.
 */
const parseMmDdYyyy = (raw?: string): Date | null => {
  if (!raw) return null;

  const parts = raw.split("/");
  if (parts.length !== 3) return null;

  const [month, day, year] = parts.map(Number);
  if (!month || !day || !year) return null;

  return new Date(year, month - 1, day);
};

/**
 * Formats a JavaScript `Date` as MM/DD/YYYY, matching the Figma design.
 */
const formatMmDdYyyy = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Header that shows the currently selected date and day of week.
 *
 * The component owns its own `currentDate` state so that clicking the
 * left/right arrows moves backward/forward by one day and automatically
 * refreshes both the numeric date and weekday label.
 */
const DateHeader: React.FC<DateHeaderProps> = ({ date }) => {
  // Initialise the header date either from the provided prop
  // (e.g. the design's 02/18/2026) or from the user's current date.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const parsed = parseMmDdYyyy(date);
    return parsed ?? new Date();
  });

  // Human‑readable pieces derived from the internal date.
  const formattedDate = formatMmDdYyyy(currentDate);
  const dayName = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
  });

  // Move the header one day backward.
  const handlePreviousDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  // Move the header one day forward.
  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  /* Shared page-header strip: same top/bottom padding and border on every page
     so the header location is consistent (Today, Mail, Calendar, Tasks). */
  return (
    <header className="page-header border-b border-[#F3C5A5] px-8 pb-4 pt-6 text-[#913c14]">
      <div className="flex items-center justify-center gap-10">
        {/* Navigate to the previous day */}
        <button
          type="button"
          className="cursor-pointer text-[#913c14]"
          aria-label="Previous day"
          onClick={handlePreviousDay}
        >
          <span className="material-symbols-outlined text-[40px]">
            arrow_back
          </span>
        </button>

        {/* Centered date in MM/DD/YYYY format */}
        <span className="text-[40px] leading-none tracking-[0.08em]">
          {formattedDate}
        </span>

        {/* Navigate to the next day */}
        <button
          type="button"
          className="cursor-pointer text-[#913c14]"
          aria-label="Next day"
          onClick={handleNextDay}
        >
          <span className="material-symbols-outlined text-[40px]">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Day of week label underneath the date */}
      <p className="mt-1 text-center text-[15px]">{dayName}</p>
    </header>
  );
};

export default DateHeader;
