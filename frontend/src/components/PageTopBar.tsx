import React from "react";
import { useNavigate } from "react-router-dom";

interface PageTopBarProps {
  /** Back button: undefined = hide, { label, to } = show */
  back?: { label: string; to: string };
  /** Optional right-side content (e.g. Setup button) */
  right?: React.ReactNode;
}

const PageTopBar: React.FC<PageTopBarProps> = ({ back, right }) => {
  const navigate = useNavigate();

  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 py-6">
      <div className="min-w-0 flex-1">
        {back ? (
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-[#A34712] hover:underline"
            onClick={() => navigate(back.to)}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            {back.label}
          </button>
        ) : (
          <span />
        )}
      </div>
      {right != null && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
};

export default PageTopBar;
