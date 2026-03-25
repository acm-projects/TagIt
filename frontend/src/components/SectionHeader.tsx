import React from "react";

type SectionHeaderProps = {
  title: string;
  icon: React.ReactNode;
  className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 text-[15px] font-semibold text-[#1F2933] ${className}`.trim()}
    >
      <span className="inline-flex shrink-0 items-center justify-center text-[#f9ab7b]">
        {icon}
      </span>
      <span>{title}</span>
    </div>
  );
};

export default SectionHeader;
