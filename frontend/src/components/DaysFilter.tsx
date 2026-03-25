import React from "react";
import { useDayFilter } from "../context/DayFilterContext";
import type { WeekdayShort } from "../lib/weekday";
import { WEEKDAY_ORDER } from "../lib/weekday";

export type { WeekdayShort } from "../lib/weekday";
export { WEEKDAY_ORDER } from "../lib/weekday";

export interface DaysFilterProps {
  value: WeekdayShort;
  onChange: (day: WeekdayShort) => void;
  days?: WeekdayShort[];
  className?: string;
}

const DaysFilter: React.FC<DaysFilterProps> = ({
  value,
  onChange,
  days = WEEKDAY_ORDER,
  className = "",
}) => {
  return (
    <div
      className={`mt-4 flex w-full justify-center overflow-x-auto pb-1 ${className}`.trim()}
      role="group"
      aria-label="Filter by day"
    >
      <div className="flex shrink-0 items-center gap-2">
        {days.map((day) => {
          const isActive = day === value;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(day)}
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
    </div>
  );
};

export default DaysFilter;

/** Wired to global day filter (persists across Mail, Calendar, Tasks via DayFilterProvider). */
export const ConnectedDaysFilter: React.FC<{
  className?: string;
  days?: WeekdayShort[];
}> = ({ className, days }) => {
  const { selectedDay, setSelectedDay } = useDayFilter();
  return (
    <DaysFilter value={selectedDay} onChange={setSelectedDay} className={className} days={days} />
  );
};
