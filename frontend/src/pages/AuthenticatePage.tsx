import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";
import gmailLogo from "../assets/Logos/gmail.png";
import outlookLogo from "../assets/Logos/outlook.png";
import authenticationBg from "../assets/AuthenticationBg.png";

const AuthenticatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromSignup = (location.state as any)?.fromSignup === true;
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
          const errorMsg = chrome.runtime.lastError.message ?? "Connection failed";
          console.error("Chrome runtime error:", errorMsg);
          setError(errorMsg);
          return;
        }
        if (!response) {
          console.error("No response from OAuth handler");
          setError("No response from authentication handler");
          return;
        }
        if (response?.success && response.data?.email) {
          console.log("OAuth successful, navigating to", fromSignup ? "/setup" : "/connected-emails");
          navigate(fromSignup ? "/setup" : "/connected-emails");
          return;
        }
        const errorMsg = response?.error ?? "Google sign-in failed";
        console.error("Google OAuth error:", errorMsg);
        setError(errorMsg);
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
          const errorMsg = chrome.runtime.lastError.message ?? "Connection failed";
          console.error("Chrome runtime error:", errorMsg);
          setError(errorMsg);
          return;
        }
        if (!response) {
          console.error("No response from OAuth handler");
          setError("No response from authentication handler");
          return;
        }
        if (response?.success && response.data?.email) {
          console.log("OAuth successful, navigating to", fromSignup ? "/setup" : "/connected-emails");
          navigate(fromSignup ? "/setup" : "/connected-emails");
          return;
        }
        const errorMsg = response?.error ?? "Microsoft sign-in failed";
        console.error("Microsoft OAuth error:", errorMsg);
        setError(errorMsg);
      }
    );
  };

  return (
    <div
      className="relative min-h-screen bg-[#F9F8F6] p-4"
      style={{
        backgroundImage: `url(${authenticationBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <PageTopBar back={{ label: "Back", useBrowserBack: true }} />

      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center px-10 pt-16">
        <h1 className="mb-4 font-instrument text-5xl font-normal text-[#1F2933]">
          Authenticate
        </h1>
        <p className="mb-10 text-base text-[#6B7280]">
          Choose how you’d like to sign in
        </p>

        {error && (
          <div className="mb-6 w-full max-w-md rounded-xl border border-[#fecdd3] bg-[#fee2e2] px-4 py-3">
            <p className="text-sm font-medium text-[#ef4444]">{error}</p>
          </div>
        )}

        <div className="w-full max-w-md space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            className="flex w-full items-center gap-4 rounded-xl border border-[#EFE7DC] bg-[#FBFBFB] px-5 py-4 text-left font-medium text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] transition hover:border-[#f9ab7b]/50 hover:bg-[#fef8f3] disabled:opacity-60"
          >
            <img src={gmailLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
            {loadingProvider === "google" ? "Connecting..." : "Gmail"}
          </button>
          <button
            type="button"
            onClick={handleOutlookLogin}
            disabled={loadingProvider !== null}
            className="flex w-full items-center gap-4 rounded-xl border border-[#EFE7DC] bg-[#FBFBFB] px-5 py-4 text-left font-medium text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] transition hover:border-[#f9ab7b]/50 hover:bg-[#fef8f3] disabled:opacity-60"
          >
            <img src={outlookLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
            {loadingProvider === "microsoft" ? "Connecting..." : "Outlook"}
          </button>
        </div>

        <p className="mt-8 max-w-md text-center text-sm text-[#6B7280]">
          Sign-in may open in a new window. Complete the steps there, then return here.
        </p>
      </div>
    </div>
  );
};

export default AuthenticatePage;
