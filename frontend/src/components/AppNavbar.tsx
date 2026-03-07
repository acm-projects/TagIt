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
    <nav className="sticky top-0 flex h-full min-h-0 w-20 shrink-0 flex-col items-center border-r border-[#F7C9AA] bg-[#FFF9F4] py-8">
      <div className="flex flex-1 flex-col items-center justify-evenly">
        {NAV_ITEMS.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              type="button"
              aria-label={label}
              onClick={() => navigate(path)}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer"
            >
              <span
                aria-hidden="true"
                className={`h-7 w-7 ${isActive ? "bg-[#A34712]" : "bg-[#8B6F60]"}`}
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
