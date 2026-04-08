import React from "react";
import { useNavigate } from "react-router-dom";
import EnvelopeMascotWaving from "../components/EnvelopeMascotWaving";
import background from "../assets/NewBg.png";

const MascotPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <button
        type="button"
        className="absolute top-4 left-4 rounded-full border border-[#F3D4C0] bg-white px-3 py-1 text-xs font-semibold text-[#F9A36E] shadow-sm transition hover:bg-[#FFF5EE]"
        onClick={() => navigate("/setup")}
      >
        Dummy Setup
      </button>
      <div className="pointer-events-none absolute inset-0 bg-white/20" />

      <div className="relative z-10 -translate-y-6 flex flex-col items-center gap-3">
        <h1 className="mt-20 leading-none font-instrument text-7xl italic text-[#F9A36E]">TagIt</h1>
        <div className="relative scale-90">
          <EnvelopeMascotWaving />
        </div>
        <p className="text-center text-xl font-medium italic text-[#1a2642]">Task Action Generation from Inbox Text</p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="rounded-2xl bg-[#F9A36E] px-16 py-3 font-serif text-xl text-white shadow-md transition hover:bg-[#E8945F] active:bg-[#D9854F]"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default MascotPage;
