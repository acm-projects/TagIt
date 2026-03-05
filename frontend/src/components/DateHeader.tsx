import React from "react";
import { useNavigate } from "react-router-dom";

interface DateHeaderProps {
  date?: string;
  dayName?: string;
}

const DateHeader: React.FC<DateHeaderProps> = ({
  date = "02/18/2026",
  dayName = "Wednesday",
}) => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col items-center text-center text-[#A34712]">
      <div className="flex w-full items-center justify-center gap-6">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#A34712] transition-colors hover:bg-[#F7C9AA]/50 cursor-pointer"
          aria-label="Previous"
        >
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <span className="min-w-[140px] text-2xl font-medium tracking-wide">{date}</span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#A34712] transition-colors hover:bg-[#F7C9AA]/50 cursor-pointer"
          aria-label="Next"
        >
          <span className="material-symbols-outlined text-[28px]">chevron_right</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/today")}
          className="ml-2 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#A34712] shadow-sm transition hover:bg-[#FFF9F4] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">today</span>
          <span>Today</span>
        </button>
      </div>
      <p className="mt-1 text-sm">{dayName}</p>
    </header>
  );
};

export default DateHeader;
