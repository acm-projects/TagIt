import React from "react";
import { useNavigate } from "react-router-dom";
import EnvelopeMascotWaving from "../components/EnvelopeMascotWaving";

const MascotPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F8F6] px-4">
      <div className="-translate-y-6 flex flex-col items-center gap-3">
        <h1 className="mt-20 leading-none font-instrument text-7xl italic text-[#F9A36E]">TagIt</h1>
        <div className="scale-90">
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
    </div>
  );
};

export default MascotPage;
