import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface DateHeaderProps {
  /**
   * Optional initial date in MM/DD/YYYY format.
   * If omitted, the component starts from today's date.
   */
  date?: string;
  /**
   * Controls whether the header navigates by day or by week.
   * Default is "day" to preserve existing behavior.
   */
  mode?: "day" | "week";
  /**
   * Optional custom secondary label shown under the primary label.
   * If omitted, the component renders a sensible default per mode.
   */
  secondaryLabel?: string;
  /**
   * Optional callback used by pages that need to react to date changes
   * (for example, a week-based tasks view).
   */
  onDateChange?: (nextDate: Date) => void;
}

const parseMmDdYyyy = (raw?: string): Date | null => {
  if (!raw) return null;

  const [monthRaw, dayRaw, yearRaw] = raw.split("/");
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const year = Number(yearRaw);

  if (!month || !day || !year) return null;
  return new Date(year, month - 1, day);
};

const formatMmDdYyyy = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const formatIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (raw: string | null): Date | null => {
  if (!raw) return null;
  const [yearRaw, monthRaw, dayRaw] = raw.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getWeekRange = (anchor: Date) => {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diffToMonday = (day + 6) % 7; // Monday-start week
  start.setDate(start.getDate() - diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const formatWeekRange = (start: Date, end: Date): string => {
  const fmt = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

const isSameWeek = (first: Date, second: Date) => {
  const firstStart = getWeekRange(first).start.getTime();
  const secondStart = getWeekRange(second).start.getTime();
  return firstStart === secondStart;
};

/**
 * Shared date header used across app pages.
 * It supports:
 * - Day-by-day navigation with left/right arrows.
 * - Clicking the date to open a popup calendar and jump to any date.
 */
const DateHeader: React.FC<DateHeaderProps> = ({
  date,
  onDateChange,
  mode = "day",
  secondaryLabel,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialPropDate = parseMmDdYyyy(date);
  const initialQueryDate = parseIsoDate(
    new URLSearchParams(location.search).get("date"),
  );

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return initialQueryDate ?? initialPropDate ?? new Date();
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const formattedDate = useMemo(() => formatMmDdYyyy(currentDate), [currentDate]);
  const weekRange = useMemo(() => getWeekRange(currentDate), [currentDate]);
  const formattedWeekRange = useMemo(
    () => formatWeekRange(weekRange.start, weekRange.end),
    [weekRange.end, weekRange.start],
  );
  const dayName = useMemo(
    () =>
      currentDate.toLocaleDateString(undefined, {
        weekday: "long",
      }),
    [currentDate],
  );
  const isCurrentWeek = useMemo(
    () => isSameWeek(currentDate, new Date()),
    [currentDate],
  );

  const primaryLabel = mode === "week" ? formattedWeekRange : formattedDate;
  const secondary = secondaryLabel ?? "";

  useEffect(() => {
    onDateChange?.(currentDate);
  }, [currentDate, onDateChange]);

  useEffect(() => {
    const queryDate = parseIsoDate(new URLSearchParams(location.search).get("date"));
    if (!queryDate) {
      const params = new URLSearchParams(location.search);
      params.set("date", formatIsoDate(currentDate));
      navigate(
        {
          pathname: location.pathname,
          search: `?${params.toString()}`,
        },
        { replace: true },
      );
    }
  }, [currentDate, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        event.target instanceof Node &&
        !popupRef.current.contains(event.target)
      ) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  const commitDate = (nextDate: Date) => {
    setCurrentDate(nextDate);
    const params = new URLSearchParams(location.search);
    params.set("date", formatIsoDate(nextDate));
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: true },
    );
  };

  const shiftPeriod = (delta: number) => {
    const nextDate = new Date(currentDate);
    const step = mode === "week" ? 7 : 1;
    nextDate.setDate(currentDate.getDate() + delta * step);
    commitDate(nextDate);
  };

  const handleCalendarDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) return;
    const picked = parseIsoDate(event.target.value);
    if (!picked) return;
    commitDate(picked);
    setIsPickerOpen(false);
  };

  return (
    <header className="page-header border-b border-[#F3C5A5] px-8 pb-4 pt-6 text-[#913c14]">
      <div className="relative">
        <div className="flex items-center justify-center gap-3 whitespace-nowrap">
          <button
            type="button"
            className="cursor-pointer text-[#913c14]"
            aria-label={mode === "week" ? "Previous week" : "Previous day"}
            onClick={() => shiftPeriod(-1)}
          >
            <span className="material-symbols-outlined text-[40px]">arrow_back</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPickerOpen((previous) => !previous)}
            className="cursor-pointer text-[30px] leading-none tracking-[0.03em] text-[#913c14] whitespace-nowrap"
            aria-label="Choose date from calendar"
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            className="cursor-pointer text-[#913c14]"
            aria-label={mode === "week" ? "Next week" : "Next day"}
            onClick={() => shiftPeriod(1)}
          >
            <span className="material-symbols-outlined text-[40px]">arrow_forward</span>
          </button>
        </div>

        {isPickerOpen && (
          <div
            ref={popupRef}
            className="absolute left-1/2 top-[calc(100%+10px)] z-20 w-64 -translate-x-1/2 rounded-xl border border-[#F3C5A5] bg-[#FFF9F4] p-3 shadow-lg"
          >
            <label className="mb-2 block text-xs font-semibold text-[#913c14]">
              Jump to date
            </label>
            <input
              type="date"
              value={formatIsoDate(currentDate)}
              onChange={handleCalendarDateChange}
              className="w-full rounded-md border border-[#E6C7B3] bg-white px-3 py-2 text-sm text-[#5A3A2A] focus:outline-none focus:ring-2 focus:ring-[#D3753D]"
            />
          </div>
        )}
      </div>

      {secondary && (
        <p className="mt-1 text-center text-[14px] text-[#9c5a28]">{secondary}</p>
      )}
    </header>
  );
};

export default DateHeader;
