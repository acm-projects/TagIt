import React from "react";
import { useNavigate } from "react-router-dom";
import EnvelopeMascotWaving from "../components/EnvelopeMascotWaving";

const MascotPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F8F6] px-4">
      <div className="-translate-y-6 flex flex-col items-center gap-4">
        <EnvelopeMascotWaving />
        <h1 className="font-instrument text-5xl italic text-[#F9A36E]">TagIt</h1>
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="rounded-2xl bg-white px-8 py-3 font-serif text-xl text-[#F9A36E] shadow-md ring-1 ring-[#F9A36E]/25 transition hover:bg-[#FFF9F5]"
            onClick={() => navigate("/signup")}
          >
            Get Started
          </button>
          <button
            type="button"
            className="rounded-2xl bg-white px-10 py-3 font-serif text-xl text-[#F9A36E] shadow-md ring-1 ring-[#F9A36E]/25 transition hover:bg-[#FFF9F5]"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MascotPage;
