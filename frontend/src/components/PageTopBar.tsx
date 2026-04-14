import React from "react";
import { useNavigate } from "react-router-dom";

export type PageTopBarBack =
  | { label: string; to: string }
  | { label: string; useBrowserBack: true };

interface PageTopBarProps {
  /** Back button: undefined = hide; `to` navigates to a path; `useBrowserBack` uses history (-1). */
  back?: PageTopBarBack;
  /** Optional right-side content (e.g. Setup button) */
  right?: React.ReactNode;
}

const PageTopBar: React.FC<PageTopBarProps> = ({ back, right }) => {
  const navigate = useNavigate();

  return (
    <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-6 py-6">
      <div className="min-w-0 flex-1">
        {back ? (
          <button
            type="button"
            className="group flex items-center gap-1.5 rounded-lg py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9ab7b]/30"
            onClick={() => {
              if ("useBrowserBack" in back && back.useBrowserBack) {
                navigate(-1);
              } else if ("to" in back) {
                navigate(back.to);
              }
            }}
          >
            <span className="material-symbols-outlined text-[22px] leading-none text-[#9CA3AF] transition-colors group-hover:text-[#f9ab7b]">
              arrow_back
            </span>
            <span className="text-[#1F2933] transition-colors group-hover:text-[#f9ab7b]">
              {back.label}
            </span>
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
