import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface DateHeaderProps {
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
  /**
   * Controls whether the year chip is shown under the primary label.
   * Default is true to preserve existing layouts.
   */
  showYear?: boolean;
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

const getWeekLabelParts = (anchor: Date) => {
  const { start, end } = getWeekRange(anchor);
  const startMonth = start.toLocaleString("en-US", { month: "short" });
  const endMonth = end.toLocaleString("en-US", { month: "short" });
  const monthPart = startMonth === endMonth ? startMonth : `${startMonth}-${endMonth}`;
  const dayPart = `${start.getDate()}–${end.getDate()}`;
  return { monthPart, dayPart };
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
  showYear = true,
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
  const weekLabelParts = useMemo(() => getWeekLabelParts(currentDate), [currentDate]);

  const primaryLabel = mode === "week" ? `${weekLabelParts.monthPart} ${weekLabelParts.dayPart}` : formattedDate;
  const yearLabel = currentDate.getFullYear();
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
    <header className="page-header w-full shrink-0 px-0 pb-4 pt-3 text-[#1F2933]">
      <div className="relative flex min-h-12 items-center justify-center">
        <div className="absolute left-0 flex items-center">
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#9CA3AF] transition-colors hover:text-[#f9ab7b]"
            aria-label={mode === "week" ? "Previous week" : "Previous day"}
            onClick={() => shiftPeriod(-1)}
          >
            <span className="material-symbols-outlined !text-[26px] leading-none">arrow_back</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={() => setIsPickerOpen((previous) => !previous)}
            className="cursor-pointer text-lg font-semibold leading-tight tracking-[0.01em] text-[#111827] sm:text-xl whitespace-nowrap"
            aria-label="Choose date from calendar"
          >
            {mode === "week" ? (
              <span className="flex items-baseline gap-2">
                <span className="font-instrument italic text-lg leading-tight text-black sm:text-xl">
                  {weekLabelParts.monthPart}
                </span>
                <span className="text-lg font-semibold leading-tight text-[#f9ab7b] sm:text-xl">
                  {weekLabelParts.dayPart}
                </span>
              </span>
            ) : (
              primaryLabel
            )}
          </button>
          {showYear && (
            <>
              <span className="mt-0.5 h-px w-12 bg-[#E5E7EB]" aria-hidden="true" />
              <span className="text-[13px] font-semibold tracking-wide text-[#9CA3AF] sm:text-sm">
                {yearLabel}
              </span>
            </>
          )}
        </div>

        <div className="absolute right-0 flex items-center">
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center text-[#9CA3AF] transition-colors hover:text-[#f9ab7b]"
            aria-label={mode === "week" ? "Next week" : "Next day"}
            onClick={() => shiftPeriod(1)}
          >
            <span className="material-symbols-outlined !text-[26px] leading-none">arrow_forward</span>
          </button>
        </div>

        {isPickerOpen && (
          <div
            ref={popupRef}
            className="absolute left-1/2 top-[calc(100%+12px)] z-20 w-64 -translate-x-1/2 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          >
            <label className="mb-2 block text-xs font-semibold text-[#374151]">
              Jump to date
            </label>
            <input
              type="date"
              value={formatIsoDate(currentDate)}
              onChange={handleCalendarDateChange}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fde6d7]"
            />
          </div>
        )}
      </div>

      {secondary && (
        <p className="mt-1 text-center text-[14px] text-[#6B7280]">{secondary}</p>
      )}
    </header>
  );
};

export default DateHeader;
