import React from "react";
import { useNavigate } from "react-router-dom";

const AuthenticatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-full bg-[#F8E7DD] p-4">
      <div className="absolute right-6 top-6 flex flex-col items-end gap-3">
        <button
          type="button"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#A34712] shadow-sm"
          onClick={() => navigate("/connected-emails")}
        >
          Connected Emails
        </button>
        <button
          type="button"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#A34712] shadow-sm"
          onClick={() => navigate("/setup")}
        >
          Setup
        </button>
      </div>
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FDE5D1]" />
    </div>
  );
};

export default AuthenticatePage;
