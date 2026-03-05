import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
      <path fill="#4285F4" d="M16.364 11.73V21.09h3.818c.904 0 1.636-.732 1.636-1.636v-7.724h-5.454z" />
      <path fill="#34A853" d="M5.455 21.09V11.73H0v7.724c0 .904.732 1.636 1.636 1.636h3.819z" />
      <path fill="#FBBC05" d="M24 5.457c0-.59-.107-1.18-.318-1.727L12 9.548 1.636 4.64.318 3.73C.107 4.277 0 4.867 0 5.457v.273l12 9 12-9v-.273z" />
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#0078D4" d="M7.88 12.04q0 .45-.16.84t-.45.7-.68.47-.87.17q-.27 0-.54-.06v-3.13q.27-.06.54-.06.5 0 .89.17t.67.48.43.7.16.82zM24 12v9.38q0 .46-.33.8t-.8.33H7.13q-.46 0-.8-.33t-.33-.8V20h10.67v-2.67H2.67V6.67h10.67V4H6.33q-.46 0-.8.33t-.33.8v12.67q0 .46.33.8t.8.33H23.2q.13 0 .2-.07t.07-.2V12zm-5.33-8v2.67h2.67V4zM20 4v2.67h2.67V4z" />
    </svg>
  );
}

const AuthenticatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "microsoft" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setError(null);
    setLoadingProvider("google");
    chrome.runtime.sendMessage(
      { type: "startGoogleOAuth" },
      (response: { success?: boolean; data?: { email: string }; error?: string }) => {
        setLoadingProvider(null);
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message ?? "Connection failed");
          return;
        }
        if (response?.success && response.data?.email) {
          navigate("/connected-emails");
          return;
        }
        setError(response?.error ?? "Google sign-in failed");
      }
    );
  };

  const handleOutlookLogin = () => {
    setError(null);
    setLoadingProvider("microsoft");
    chrome.runtime.sendMessage(
      { type: "startMicrosoftOAuth" },
      (response: { success?: boolean; data?: { email: string }; error?: string }) => {
        setLoadingProvider(null);
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message ?? "Connection failed");
          return;
        }
        if (response?.success && response.data?.email) {
          navigate("/connected-emails");
          return;
        }
        setError(response?.error ?? "Microsoft sign-in failed");
      }
    );
  };

  return (
    <div className="relative min-h-full bg-[#F8E7DD] p-4">
      <PageTopBar
        back={{ label: "Back", to: "/signup" }}
        right={
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#A34712] shadow-sm hover:bg-[#FFF9F4] transition"
            onClick={() => navigate("/setup")}
          >
            Setup
          </button>
        }
      />

      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FDE5D1] px-10 pt-16">
        <h1 className="mb-4 font-instrument text-5xl font-normal text-[#A34712]">
          Authenticate
        </h1>
        <p className="mb-10 text-base text-[#8B6F60]">
          Choose how you’d like to sign in
        </p>

        {error && (
          <div className="mb-6 w-full max-w-md rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="w-full max-w-md space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-[#A34712] bg-white px-5 py-4 text-left font-medium text-[#3F2A1E] shadow-sm transition hover:bg-[#FDE5D1] disabled:opacity-60"
          >
            <GmailIcon className="h-8 w-8 shrink-0" />
            {loadingProvider === "google" ? "Connecting..." : "Gmail"}
          </button>
          <button
            type="button"
            onClick={handleOutlookLogin}
            disabled={loadingProvider !== null}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-[#A34712] bg-white px-5 py-4 text-left font-medium text-[#3F2A1E] shadow-sm transition hover:bg-[#FDE5D1] disabled:opacity-60"
          >
            <OutlookIcon className="h-8 w-8 shrink-0" />
            {loadingProvider === "microsoft" ? "Connecting..." : "Outlook"}
          </button>
        </div>

        <p className="mt-8 max-w-md text-center text-sm text-[#8B6F60]">
          Sign-in may open in a new window. Complete the steps there, then return here.
        </p>
      </div>
    </div>
  );
};

export default AuthenticatePage;
