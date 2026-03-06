import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS: { path: string; icon: string; label: string }[] = [
  { path: "/today", icon: "today", label: "Today" },
  { path: "/mail", icon: "mail", label: "Mail" },
  { path: "/calendar", icon: "calendar_month", label: "Calendar" },
  { path: "/tasks", icon: "task_alt", label: "Tasks" },
  { path: "/settings", icon: "settings", label: "Settings" },
];

const AppNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* Active item uses a visible background so Today, Mail, etc. all light up
     consistently when selected. */
  return (
    <nav className="flex w-20 flex-col items-center justify-between border-r border-[#F7C9AA] bg-[#FFF9F4] py-8">
      <div className="mt-16 flex flex-col items-center gap-32">
        {NAV_ITEMS.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path}
              type="button"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => navigate(path)}
              className={`flex h-16 w-16 items-center justify-center rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
                isActive
                  ? "bg-[rgba(210,78,0,0.35)] text-[#A34712] shadow-[0_2px_6px_rgba(109,47,18,0.2)]"
                  : "bg-transparent text-[#8B6F60] hover:bg-[#FFEFE4] hover:text-[#A34712]"
              }`}
            >
              <span className="material-symbols-outlined text-[64px]">{icon}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AppNavbar;
