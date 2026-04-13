import React, { useEffect, useRef, useState } from "react";
import filterIcon from "../assets/page_buttons/filter.png";

export type FilterOption = {
  value: string;
  label: string;
};

type FilterMenuButtonProps = {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  ariaLabel?: string;
  emptyMessage?: string;
};

/**
 * Reusable filter button with dropdown list behavior.
 * Parent owns the selected value; this component manages menu open/close and outside-click handling.
 */
const FilterMenuButton: React.FC<FilterMenuButtonProps> = ({
  options,
  selectedValue,
  onSelect,
  ariaLabel = "Open filter menu",
  emptyMessage = "No options yet",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const secondaryOptions = options.filter((opt) => opt.value !== options[0]?.value);

  return (
    <div className="relative" ref={menuRef}>
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
            filter: "invert(81%) sepia(52%) saturate(1330%) hue-rotate(324deg) brightness(99%) contrast(98%)",
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition hover:bg-[#f8fafc] ${
                  isSelected ? "bg-[#f0fdf4] font-semibold text-[#065f46]" : "text-[#111827]"
                }`}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="capitalize">{option.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[14px] text-[#10b981] opacity-80">done</span>
                )}
              </button>
            );
          })}

          {secondaryOptions.length === 0 && (
            <div className="px-2.5 py-1.5 text-xs text-[#6B7280]">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterMenuButton;
