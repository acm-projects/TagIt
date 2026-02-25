import React from "react";

const Popup: React.FC = () => {
  return (
    <div className="w-[420px] h-[560px] rounded-3xl bg-[#FDC3A1] flex flex-col items-center justify-center text-center px-8">
      
      <h1 className="font-instrument text-6xl italic text-black">
        TagIt
      </h1>

      <p className="mt-8 font-instrument text-3xl text-[#C97D6E] leading-tight">
        Task & Action Generation
        <br />
        from Inbox Text
      </p>

      <div className="mt-12 flex gap-6">
        <button className="rounded-2xl bg-white/80 px-8 py-3 font-serif text-xl text-[#C97D6E] shadow-sm">
          Get Started
        </button>

        <button className="rounded-2xl bg-white/80 px-10 py-3 font-serif text-xl text-[#C97D6E] shadow-sm">
          Login
        </button>
      </div>

    </div>
  );
};

export default Popup;