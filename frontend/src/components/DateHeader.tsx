import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface DateHeaderProps {
  /**
   * Optional initial date in MM/DD/YYYY format.
   * If omitted, the component starts from today's date.
   */
  date?: string;
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

/**
 * Shared date header used across app pages.
 * It supports:
 * - Day-by-day navigation with left/right arrows.
 * - Clicking the date to open a popup calendar and jump to any date.
 */
const DateHeader: React.FC<DateHeaderProps> = ({ date, onDateChange }) => {
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
  const dayName = useMemo(
    () =>
      currentDate.toLocaleDateString(undefined, {
        weekday: "long",
      }),
    [currentDate],
  );

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

  const shiftDay = (delta: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + delta);
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
        <div className="flex items-center justify-center gap-10">
          <button
            type="button"
            className="cursor-pointer text-[#913c14]"
            aria-label="Previous day"
            onClick={() => shiftDay(-1)}
          >
            <span className="material-symbols-outlined text-[40px]">arrow_back</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPickerOpen((previous) => !previous)}
            className="cursor-pointer text-[40px] leading-none tracking-[0.08em] text-[#913c14]"
            aria-label="Choose date from calendar"
          >
            {formattedDate}
          </button>

          <button
            type="button"
            className="cursor-pointer text-[#913c14]"
            aria-label="Next day"
            onClick={() => shiftDay(1)}
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

      <p className="mt-1 text-center text-[15px]">{dayName}</p>
    </header>
  );
};

export default DateHeader;
