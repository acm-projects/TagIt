import React from "react";
import { useNavigate } from "react-router-dom";

const ConnectedEmailsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center rounded-3xl bg-[#FFF9F4] px-8">
        <div className="w-full max-w-xl space-y-8 text-center">
          <h1 className="text-4xl font-semibold tracking-wide text-[#A34712]">
            Connected Emails
          </h1>

          <div className="space-y-4">
            {[
              {
                email: "cooper.flagg@mavs.com",
                avatar:
                  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=64&q=80",
              },
              {
                email: "cam.boozer@duke.com",
                avatar:
                  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=64&q=80",
              },
            ].map((entry) => (
              <div
                key={entry.email}
                className="flex items-center justify-between rounded-full border border-[#C86C2F] bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 rounded-full bg-center bg-cover"
                    style={{ backgroundImage: `url(${entry.avatar})` }}
                  />
                  <span className="text-lg text-[#3F2A1E]">{entry.email}</span>
                </div>
                <span className="text-xl text-[#3F2A1E]" aria-hidden>
                  🗑️
                </span>
              </div>
            ))}

            <button className="flex w-full items-center justify-center gap-2 rounded-full border border-[#C86C2F] bg-white px-4 py-3 text-lg text-[#3F2A1E] shadow-sm">
              <span className="text-2xl text-[#3F2A1E]">+</span>
              <span>add another email</span>
            </button>
          </div>

          <div className="pt-4">
            <button
              className="w-40 rounded-md bg-[#A34712] py-3 text-base font-medium text-white"
              onClick={() => navigate(-1)}
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
