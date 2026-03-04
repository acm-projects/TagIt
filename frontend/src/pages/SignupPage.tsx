import React from "react";
import { useNavigate } from "react-router-dom";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-full bg-[#F8E7DD] p-4">
      <button
        type="button"
        className="absolute left-6 top-6 text-sm font-medium text-[#A34712]"
        onClick={() => navigate("/")}
      >
        ← Back
      </button>
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FDE5D1] px-10">
        <h1 className="mb-10 font-instrument text-5xl font-normal text-[#A34712]">
          Create Account
        </h1>

        <div className="w-full max-w-md space-y-6 text-left">
          <div className="space-y-2">
            <label className="block text-base font-medium text-[#A34712]">
              Create Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full rounded-xl border-none bg-white px-4 py-3 text-base text-[#8B6F60] shadow-sm placeholder:text-[#B8A39A] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#A34712]">
              Create Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-xl border-none bg-white px-4 py-3 text-base text-[#8B6F60] shadow-sm placeholder:text-[#B8A39A] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#A34712]">
              Verify Password
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              className="w-full rounded-xl border-none bg-white px-4 py-3 text-base text-[#8B6F60] shadow-sm placeholder:text-[#B8A39A] focus:outline-none"
            />
          </div>
        </div>

        <button
          className="mt-10 w-56 rounded-full bg-[#A34712] py-3 text-base font-medium text-white"
          onClick={() => navigate("/authenticate")}
        >
          Create Account
        </button>

        <button
          className="mt-6 text-base text-[#2F1E15] underline"
          onClick={() => navigate("/login")}
        >
          Log in
        </button>
      </div>
    </div>
  );
};

export default SignupPage;

