import React, { useEffect, useRef, useState } from "react";
import filterIcon from "../assets/page_buttons/filter.png";

export type CategoryOption = {
  id: string;
  label: string;
};

interface CategoryFilterMenuProps {
  selected: string;
  options: CategoryOption[];
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

const CategoryFilterMenu: React.FC<CategoryFilterMenuProps> = ({
  selected,
  options,
  onSelect,
  ariaLabel = "Filter by category",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="inline-flex items-center justify-center rounded-full border border-transparent bg-transparent px-0.5 py-0.5 transition hover:opacity-80 focus:outline-none focus:ring-0"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <img
          src={filterIcon}
          alt=""
          className="h-6 w-6"
          style={{
            filter:
              "invert(81%) sepia(52%) saturate(1330%) hue-rotate(324deg) brightness(99%) contrast(98%)",
          }}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition hover:bg-[#f8fafc] ${
              selected === "all" ? "bg-[#f0fdf4] font-semibold text-[#065f46]" : "text-[#111827]"
            }`}
            onClick={() => {
              onSelect("all");
              setIsOpen(false);
            }}
          >
            <span>All categories</span>
            {selected === "all" && (
              <span className="material-symbols-outlined text-[14px] text-[#10b981] opacity-80">done</span>
            )}
          </button>
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition hover:bg-[#f8fafc] ${
                selected === opt.id ? "bg-[#f0fdf4] font-semibold text-[#065f46]" : "text-[#111827]"
              }`}
              onClick={() => {
                onSelect(opt.id);
                setIsOpen(false);
              }}
            >
              <span className="capitalize truncate">{opt.label}</span>
              {selected === opt.id && (
                <span className="material-symbols-outlined text-[14px] text-[#10b981] opacity-80">done</span>
              )}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-2.5 py-1.5 text-xs text-[#6B7280]">No categories yet</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryFilterMenu;
