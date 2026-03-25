import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { WeekdayShort } from "../lib/weekday";
import { isWeekdayShort } from "../lib/weekday";
import { dateToWeekdayShort } from "../lib/weekFilterUtils";

const STORAGE_KEY = "tagit-selected-weekday";

const readStoredDay = (): WeekdayShort | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isWeekdayShort(raw)) return raw;
  } catch {
    /* private mode / quota */
  }
  return null;
};

const writeStoredDay = (day: WeekdayShort) => {
  try {
    localStorage.setItem(STORAGE_KEY, day);
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
