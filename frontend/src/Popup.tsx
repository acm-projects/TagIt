import React from "react";
import { useNavigate } from "react-router-dom";

const Popup: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF2E9] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FDC3A1] px-8 text-center">
        <h1 className="font-instrument text-6xl italic text-black">TagIt</h1>

        <p className="mt-8 font-instrument text-3xl leading-tight text-[#C97D6E]">
          Task & Action Generation
          <br />
          from Inbox Text
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <button
            className="rounded-2xl bg-white/80 px-8 py-3 font-serif text-xl text-[#C97D6E] shadow-sm"
            onClick={() => navigate("/signup")}
          >
            Get Started
          </button>

          <button
            className="rounded-2xl bg-white/80 px-10 py-3 font-serif text-xl text-[#C97D6E] shadow-sm"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="rounded-2xl bg-white/80 px-8 py-3 font-serif text-lg text-[#C97D6E] shadow-sm"
            onClick={() => navigate("/setup")}
          >
            Setup (temp)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
