import React from "react";
import { useNavigate } from "react-router-dom";
import EnvelopeMascotWaving from "../components/EnvelopeMascotWaving";

const MascotPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F9F8F6] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,_rgba(255,252,247,0.98)_0%,_rgba(250,233,213,0.72)_18%,_rgba(249,163,110,0.14)_40%,_rgba(249,248,246,0.9)_62%,_#F9F8F6_78%)]" />

      <div className="relative z-10 -translate-y-6 flex flex-col items-center gap-3">
        <h1 className="mt-20 leading-none font-instrument text-7xl italic text-[#F9A36E]">TagIt</h1>
        <div className="relative scale-90">
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,253,249,0.98)_0%,_rgba(250,233,213,0.84)_24%,_rgba(249,163,110,0.18)_50%,_rgba(249,163,110,0.05)_68%,_transparent_78%)] blur-2xl" />
          <EnvelopeMascotWaving />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="rounded-2xl bg-[#F9A36E] px-16 py-3 font-serif text-xl text-white shadow-md transition hover:bg-[#E8945F] active:bg-[#D9854F]"
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
    </div>
  );
};

export default MascotPage;
