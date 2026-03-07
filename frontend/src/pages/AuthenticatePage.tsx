import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import gmailLogo from "../assets/Logos/gmail.png";
import outlookLogo from "../assets/Logos/outlook.png";

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
            <img src={gmailLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
            {loadingProvider === "google" ? "Connecting..." : "Gmail"}
          </button>
          <button
            type="button"
            onClick={handleOutlookLogin}
            disabled={loadingProvider !== null}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-[#A34712] bg-white px-5 py-4 text-left font-medium text-[#3F2A1E] shadow-sm transition hover:bg-[#FDE5D1] disabled:opacity-60"
          >
            <img src={outlookLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
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
