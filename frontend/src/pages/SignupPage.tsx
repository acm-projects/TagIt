import React from "react";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#F9F8F6] p-4">
      <PageTopBar back={{ label: "Back", to: "/" }} />
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center px-10 pt-16">
        <h1 className="mb-10 font-instrument text-5xl font-normal text-[#1F2933]">
          Create Account
        </h1>

        <div className="w-full max-w-md space-y-6 text-left">
          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Create Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Create Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Verify Password
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25"
            />
          </div>
        </div>

        <button
          className="mt-10 w-56 rounded-full bg-[#f9ab7b] py-3 text-base font-semibold text-white shadow-[0_6px_14px_rgba(249,171,123,0.35)] transition-colors hover:bg-[#f0a068]"
          onClick={() => navigate("/authenticate")}
        >
          Create Account
        </button>

        <button
          className="mt-6 text-base text-[#1F2933] underline decoration-[#EFE7DC] underline-offset-2 transition-colors hover:text-[#f9ab7b]"
          onClick={() => navigate("/login")}
        >
          Log in
        </button>
      </div>
    </div>
  );
};

export default SignupPage;

