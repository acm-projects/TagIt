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

  return (
    <nav className="flex w-20 flex-col items-center justify-between border-r border-[#F7C9AA] bg-[#FFF9F4] py-8">
      <div className="flex flex-col items-center gap-24 mt-16">
        {NAV_ITEMS.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              type="button"
              aria-label={label}
              onClick={() => navigate(path)}
              className="flex h-16 w-16 items-center justify-center rounded-xl cursor-pointer text-[#8B6F60] hover:bg-transparent hover:text-[#8B6F60] focus:outline-none focus:ring-0"
            >
              <span className="material-symbols-outlined text-[36px]">{icon}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AppNavbar;
