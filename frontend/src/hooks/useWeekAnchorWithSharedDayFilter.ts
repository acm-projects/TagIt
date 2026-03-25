import { useCallback, useRef, useState } from "react";
import { useDayFilter } from "../context/DayFilterContext";
import { dateToWeekdayShort, startOfLocalDay } from "../lib/weekFilterUtils";

/**
 * Syncs a local week anchor with WeekHeader / URL. Updates the shared day chip only when the user
 * actually changes the header date (picker or non–whole-week jump), not on route mount or redundant
 * onDateChange calls — so the global day filter persists across Mail / Calendar / Tasks.
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
