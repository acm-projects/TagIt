import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import todayIcon from "../assets/nav-buttons/today.png";
import mailIcon from "../assets/nav-buttons/mail.png";
import calendarIcon from "../assets/nav-buttons/calender.png";
import tasksIcon from "../assets/nav-buttons/tasks.png";
import settingsIcon from "../assets/nav-buttons/settings.png";

const NAV_ITEMS: { path: string; iconSrc: string; label: string }[] = [
  { path: "/today", iconSrc: todayIcon, label: "Today" },
  { path: "/mail", iconSrc: mailIcon, label: "Mail" },
  { path: "/calendar", iconSrc: calendarIcon, label: "Calendar" },
  { path: "/tasks", iconSrc: tasksIcon, label: "Tasks" },
  { path: "/settings", iconSrc: settingsIcon, label: "Settings" },
];

const AppNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="shrink-0 border-t border-[#E5E7EB] bg-white px-3 py-2.5">
      <div className="grid grid-cols-5 items-center gap-1.5">
        {NAV_ITEMS.map(({ path, iconSrc, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              type="button"
              aria-label={label}
              onClick={() => navigate(path)}
              className="flex h-11 w-full items-center justify-center rounded-xl transition-colors"
            >
              <span
                aria-hidden="true"
                className={`h-6 w-6 ${isActive ? "bg-[#FFAB87]" : "bg-[#9CA3AF]"}`}
                style={{
                  WebkitMaskImage: `url(${iconSrc})`,
                  maskImage: `url(${iconSrc})`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AppNavbar;
