import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

  /* Active item changes only icon color (no background highlight). */
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
              aria-current={isActive ? "page" : undefined}
              onClick={() =>
                navigate({
                  pathname: path,
                  search: location.search,
                })
              }
              className={`flex h-16 w-16 items-center justify-center rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-0 ${
                isActive
                  ? "bg-transparent text-[#A34712]"
                  : "bg-transparent text-[#8B6F60] hover:text-[#A34712]"
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
