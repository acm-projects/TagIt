import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./DaysFilter.css";

// ——— Types & chip order ———

export type WeekdayShort = "sun" | "mon" | "tue" | "wed" | "thur" | "fri" | "sat";

export const WEEKDAY_ORDER: WeekdayShort[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thur",
  "fri",
  "sat",
];

const isWeekdayShort = (value: string): value is WeekdayShort =>
  (WEEKDAY_ORDER as string[]).includes(value);

// ——— Date helpers (Calendar / Tasks week + event matching) ———

export const dateToWeekdayShort = (d: Date): WeekdayShort => {
  const map: WeekdayShort[] = ["sun", "mon", "tue", "wed", "thur", "fri", "sat"];
  return map[d.getDay()];
};

export const startOfLocalDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const OFFSET_FROM_SUNDAY: Record<WeekdayShort, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thur: 4,
  fri: 5,
  sat: 6,
};

const startOfWeekSunday = (anchor: Date): Date => {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // getDay() returns 0 for Sunday
  return d;
};

export const getDateForWeekdayInAnchorWeek = (weekAnchor: Date, slot: WeekdayShort): Date => {
  const sunday = startOfWeekSunday(weekAnchor);
  const out = new Date(sunday);
  out.setDate(sunday.getDate() + OFFSET_FROM_SUNDAY[slot]);
  out.setHours(0, 0, 0, 0);
  return out;
};

const parseEventMmDdYyyy = (raw: string): Date | null => {
  const [monthRaw, dayRaw, yearRaw] = raw.split("/");
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const year = Number(yearRaw);
  if (!month || !day || !year) return null;
  return new Date(year, month - 1, day);
};

export type EventWithMmDdDates = {
  date1: string;
  date2?: string;
};

export const eventOccursOnLocalDay = (event: EventWithMmDdDates, day: Date): boolean => {
  const d1 = parseEventMmDdYyyy(event.date1);
  if (d1 && isSameLocalDay(d1, day)) return true;
  if (event.date2) {
    const d2 = parseEventMmDdYyyy(event.date2);
    if (d2 && isSameLocalDay(d2, day)) return true;
  }
  return false;
};

// ——— Global day selection (localStorage) ———

const STORAGE_KEY = "tagit-selected-weekday";

const localDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const readStoredDay = (): WeekdayShort | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      isWeekdayShort(parsed.day) &&
      parsed.date === localDateStr(new Date())
    ) {
      return parsed.day as WeekdayShort;
    }
  } catch {
    /* private mode / quota / old string format */
  }
  return null;
};

const writeStoredDay = (day: WeekdayShort) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day, date: localDateStr(new Date()) }));
  } catch {
    /* ignore */
  }
};

type DayFilterContextValue = {
  selectedDay: WeekdayShort;
  setSelectedDay: React.Dispatch<React.SetStateAction<WeekdayShort>>;
};

const DayFilterContext = createContext<DayFilterContextValue | null>(null);

export const DayFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDay, setSelectedDayInternal] = useState<WeekdayShort>(() => {
    const stored = readStoredDay();
    if (stored) return stored;
    return dateToWeekdayShort(new Date());
  });

  const setSelectedDay = useCallback<React.Dispatch<React.SetStateAction<WeekdayShort>>>(
    (update) => {
      setSelectedDayInternal((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        writeStoredDay(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ selectedDay, setSelectedDay }),
    [selectedDay, setSelectedDay],
  );

  return <DayFilterContext.Provider value={value}>{children}</DayFilterContext.Provider>;
};

export const useDayFilter = (): DayFilterContextValue => {
  const ctx = useContext(DayFilterContext);
  if (!ctx) {
    throw new Error("useDayFilter must be used within DayFilterProvider");
  }
  return ctx;
};

/**
 * Adds "deselect" support on top of the shared day filter. Keeps the global
 * day in sync when a specific day is chosen, but allows `null` to represent
 * "all days" without overwriting the stored preference.
 */
export const useNullableDayFilter = () => {
  const { selectedDay, setSelectedDay } = useDayFilter();
  const [nullableDay, setNullableDay] = useState<WeekdayShort | null>(selectedDay);

  useEffect(() => {
    if (nullableDay === null) return;
    if (nullableDay !== selectedDay) {
      setNullableDay(selectedDay);
    }
  }, [nullableDay, selectedDay]);

  const handleChange = (day: WeekdayShort | null) => {
    if (day === null) {
      setNullableDay(null);
      return;
    }
    setNullableDay(day);
    setSelectedDay(day);
  };

  return { nullableDay, setNullableDay: handleChange };
};

/**
 * Syncs week anchor with WeekHeader / URL. Updates shared day chip only on real header moves,
 * not on route mount — keeps Mail / Calendar / Tasks aligned with the global filter.
 */
export const useWeekAnchorWithSharedDayFilter = () => {
  const { setSelectedDay } = useDayFilter();
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const prevAnchorRef = useRef<Date | null>(null);

  const handleWeekDateChange = useCallback(
    (next: Date) => {
      const prev = prevAnchorRef.current;
      prevAnchorRef.current = new Date(next);
      setWeekAnchor(next);

      if (prev === null) {
        return;
      }

      const diffDays = Math.round(
        (startOfLocalDay(next).getTime() - startOfLocalDay(prev).getTime()) / 86_400_000,
      );

      if (diffDays === 0) {
        return;
      }

      const isWholeWeekStep = diffDays % 7 === 0;
      if (!isWholeWeekStep) {
        setSelectedDay(dateToWeekdayShort(next));
      }
    },
    [setSelectedDay],
  );

  return { weekAnchor, handleWeekDateChange };
};

// ——— UI ———

export interface DaysFilterProps {
  value: WeekdayShort | null;
  onChange: (day: WeekdayShort | null) => void;
  days?: WeekdayShort[];
  className?: string;
  allowToggleOff?: boolean;
}

const DaysFilter: React.FC<DaysFilterProps> = ({
  value,
  onChange,
  days = WEEKDAY_ORDER,
  className = "",
  allowToggleOff = false,
}) => {
  return (
    <div
      className={`days-filter ${className}`.trim()}
      role="group"
      aria-label="Filter by day"
    >
      <div className="days-filter__row">
        {days.map((day) => {
          const isActive = day === value;
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                if (allowToggleOff && isActive) {
                  onChange(null);
                  return;
                }
                onChange(day);
              }}
              className={`days-filter__chip ${isActive ? "days-filter__chip--active" : "days-filter__chip--inactive"}`}
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

/**
 * Convenience wrapper that plugs into the shared day filter and adds deselect
 * (all-days) behavior out of the box.
 */
export const NullableConnectedDaysFilter: React.FC<{
  className?: string;
  days?: WeekdayShort[];
  value?: WeekdayShort | null;
  onChange?: (day: WeekdayShort | null) => void;
}> = ({ className, days, value, onChange }) => {
  const { nullableDay, setNullableDay } = useNullableDayFilter();
  const effectiveValue = typeof value === "undefined" ? nullableDay : value;
  const effectiveOnChange = onChange ?? setNullableDay;
  return (
    <DaysFilter
      value={effectiveValue}
      onChange={effectiveOnChange}
      className={className}
      days={days}
      allowToggleOff
    />
  );
};

export const ConnectedDaysFilter: React.FC<{
  className?: string;
  days?: WeekdayShort[];
  allowToggleOff?: boolean;
  value?: WeekdayShort | null;
  onChange?: (day: WeekdayShort | null) => void;
}> = ({ className, days, allowToggleOff, value, onChange }) => {
  const { selectedDay, setSelectedDay } = useDayFilter();
  const handleChange = (day: WeekdayShort | null) => {
    if (!day) return;
    setSelectedDay(day);
  };
  const effectiveValue = typeof value === "undefined" ? selectedDay : value;
  const effectiveOnChange = onChange ?? handleChange;
  return (
    <DaysFilter
      value={effectiveValue}
      onChange={effectiveOnChange}
      className={className}
      days={days}
      allowToggleOff={allowToggleOff}
    />
  );
};
