import React from "react";
import { useNavigate } from "react-router-dom";
import EnvelopeMascotWaving from "../components/EnvelopeMascotWaving";

const floatingTags = [
  { label: "Inbox", top: "8%", left: "10%", rotate: "-18deg", scale: 1.1, blur: "0px", opacity: 0.3, duration: "16s", delay: "-4s" },
  { label: "Urgent", top: "18%", left: "76%", rotate: "14deg", scale: 1.35, blur: "6px", opacity: 0.2, duration: "19s", delay: "-11s" },
  { label: "Later", top: "30%", left: "6%", rotate: "8deg", scale: 0.95, blur: "1px", opacity: 0.24, duration: "15s", delay: "-7s" },
  { label: "Work", top: "32%", left: "82%", rotate: "-12deg", scale: 0.88, blur: "0px", opacity: 0.28, duration: "14s", delay: "-3s" },
  { label: "School", top: "55%", left: "12%", rotate: "22deg", scale: 1.5, blur: "10px", opacity: 0.16, duration: "22s", delay: "-8s" },
  { label: "Deadline", top: "62%", left: "80%", rotate: "-20deg", scale: 1.2, blur: "4px", opacity: 0.18, duration: "18s", delay: "-13s" },
  { label: "Personal", top: "74%", left: "18%", rotate: "-8deg", scale: 0.92, blur: "0px", opacity: 0.22, duration: "17s", delay: "-2s" },
  { label: "Event", top: "80%", left: "70%", rotate: "18deg", scale: 1.4, blur: "8px", opacity: 0.14, duration: "20s", delay: "-9s" },
];

const MascotPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F9F8F6] px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,163,110,0.13),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(244,211,190,0.22),_transparent_38%)]" />
        {floatingTags.map((tag) => (
          <div
            key={`${tag.label}-${tag.top}-${tag.left}`}
            className="absolute"
            style={{
              top: tag.top,
              left: tag.left,
              filter: `blur(${tag.blur})`,
              opacity: tag.opacity,
              transform: `rotate(${tag.rotate}) scale(${tag.scale})`,
            }}
          >
            <div
              className="rounded-[1.6rem] border border-[#F3D4C0] bg-white/85 px-5 py-2 shadow-[0_20px_40px_rgba(249,163,110,0.08)] backdrop-blur-[2px]"
              style={{
                animation: `floatTag ${tag.duration} ease-in-out infinite`,
                animationDelay: tag.delay,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full border border-[#F3D4C0] bg-[#F9F8F6]" />
                <span className="font-serif text-lg tracking-[0.18em] text-[#D79A73] uppercase">{tag.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 -translate-y-6 flex flex-col items-center gap-3">
        <h1 className="mt-20 leading-none font-instrument text-7xl italic text-[#F9A36E]">TagIt</h1>
        <div className="scale-90 drop-shadow-[0_28px_60px_rgba(249,163,110,0.18)]">
          <EnvelopeMascotWaving />
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="rounded-2xl bg-[#F9A36E] px-8 py-3 font-serif text-xl text-white shadow-md transition hover:bg-[#E8945F] active:bg-[#D9854F]"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
        <button
          type="button"
          className="rounded-full border border-[#F3D4C0] bg-white px-5 py-2 text-sm font-semibold text-[#F9A36E] shadow-sm transition hover:bg-[#FFF5EE]"
          onClick={() => navigate("/setup")}
        >
          Dummy Setup Button
        </button>
      </div>

      <style>
        {`
          @keyframes floatTag {
            0%, 100% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, -14px, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default MascotPage;
