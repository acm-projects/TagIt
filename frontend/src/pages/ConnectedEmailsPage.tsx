import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../services/auth/tokenStorage";
import type { AuthProvider } from "../services/auth/tokenStorage";

type ConnectedEmail = { provider: AuthProvider; email: string };

function TrashIcon({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </span>
  );
}

const ConnectedEmailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<ConnectedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmails = useCallback(async () => {
    const [google, microsoft] = await Promise.all([
      getToken("google"),
      getToken("microsoft"),
    ]);
    const list: ConnectedEmail[] = [];
    if (google?.email) list.push({ provider: "google", email: google.email });
    if (microsoft?.email) list.push({ provider: "microsoft", email: microsoft.email });
    setEmails(list);
  }, []);

  useEffect(() => {
    loadEmails().finally(() => setLoading(false));
  }, [loadEmails]);

  const handleRemove = async (provider: AuthProvider) => {
    await removeToken(provider);
    await loadEmails();
  };

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <p className="mb-2 text-left text-sm text-[#5A3A2A]">Email Listing</p>

      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FFF9F4] px-8 py-8">
        <div className="w-full max-w-xl space-y-8 text-center">
          <h1 className="text-4xl font-semibold tracking-wide text-[#A34712]">
            Connected Emails
          </h1>

          {loading ? (
            <p className="text-[#8B6F60]">Loading…</p>
          ) : (
            <div className="space-y-4">
              {emails.length === 0 ? (
                <p className="text-[#8B6F60]">No connected emails yet. Add one below.</p>
              ) : (
                emails.map(({ provider, email }) => (
                  <div
                    key={`${provider}-${email}`}
                    className="flex items-center justify-between rounded-full border border-[#C86C2F] bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7C9AA] text-sm font-semibold text-[#A34712]"
                        aria-hidden
                      >
                        {email.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-lg text-[#3F2A1E]">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(provider)}
                      className="rounded p-1 text-[#7A4A2D] hover:bg-[#F7C9AA]/50"
                      aria-label={`Remove ${email}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => navigate("/authenticate")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#C86C2F] bg-white px-4 py-3 text-lg text-[#3F2A1E] shadow-sm hover:bg-[#FFF9F4] transition"
              >
                <span className="text-2xl text-[#3F2A1E]">+</span>
                <span>add another email</span>
              </button>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate("/setup")}
              className="w-40 rounded-md bg-[#A34712] py-3 text-base font-medium text-white hover:bg-[#8B3A0F] transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedEmailsPage;
