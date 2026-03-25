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

export const isWeekdayShort = (value: string): value is WeekdayShort =>
  (WEEKDAY_ORDER as string[]).includes(value);
