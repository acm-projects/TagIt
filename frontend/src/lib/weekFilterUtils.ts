import type { WeekdayShort } from "./weekday";

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

export const OFFSET_FROM_MONDAY: Record<WeekdayShort, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thur: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

export const startOfWeekMonday = (anchor: Date): Date => {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
};

export const getDateForWeekdayInAnchorWeek = (weekAnchor: Date, slot: WeekdayShort): Date => {
  const monday = startOfWeekMonday(weekAnchor);
  const out = new Date(monday);
  out.setDate(monday.getDate() + OFFSET_FROM_MONDAY[slot]);
  out.setHours(0, 0, 0, 0);
  return out;
};

export const parseEventMmDdYyyy = (raw: string): Date | null => {
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
