import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";
import mailOpenIcon from "../assets/page_buttons/mail_open.png";
import draftIcon from "../assets/page_buttons/draft.png";

/**
 * A prioritized mail card item.
 * Backend message ranking can map directly to `priorityScore`.
 */
type MailItem = {
  id: string;
  sender: string;
  body: string;
  extra?: string;
  tags: string[];
  priorityScore: number;
};

/**
 * Simple draft item shown in the "Drafted Replies" section.
 * Backend integration can attach thread ids/message ids later.
 */
type DraftItem = {
  id: string;
  sender: string;
};

const MailPage: React.FC = () => {
  /**
   * Seed data for UI prototyping.
   * Replace these with API responses once backend integration is ready.
   */
  const [mails] = useState<MailItem[]>([
    {
      id: "m1",
      sender: "Joshua Montogermy",
      body: "Requesting a screenshot of current off-campus enrollment (with courses and college) to grant temporary credit while awaiting transfer.",
      tags: ["Temporary Credit"],
      priorityScore: 10,
    },
    {
      id: "m2",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      extra: "Deadline : March 15, 2026",
      tags: ["Internship", "Resume"],
      priorityScore: 9,
    },
    {
      id: "m3",
      sender: "John Mathew @Verizon @Handshake",
      body: "Internship offer. Respond with your resume and portfolio.",
      extra: "Deadline : March 15, 2026",
      tags: [],
      priorityScore: 6,
    },
  ]);

  const [draftReplies] = useState<DraftItem[]>([
    {
      id: "d1",
      sender: "John Mathew @Verizon @Handshake",
    },
  ]);

  const sortedMails = useMemo(
    () => [...mails].sort((a, b) => b.priorityScore - a.priorityScore),
    [mails],
  );

  const getTagStyles = (tag: string): { backgroundColor: string; color: string } => {
    const normalized = tag.toLowerCase();
    if (normalized.includes("temporary")) {
      return { backgroundColor: "#F8A7B4", color: "#5A3A2A" };
    }
    if (normalized.includes("internship")) {
      return { backgroundColor: "#E8C2D5", color: "#5A3A2A" };
    }
    if (normalized.includes("resume")) {
      return { backgroundColor: "#FFF08C", color: "#5A3A2A" };
    }
    return { backgroundColor: "#FFE1CF", color: "#5A3A2A" };
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8E7DD] p-4">
      <div className="flex min-h-0 flex-1 w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-8 py-6 text-[#A34712]">
          <DateHeader />

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712]">
              <span
                className="inline-block h-5 w-5 shrink-0 bg-[#A34712] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                style={{
                  maskImage: `url(${mailOpenIcon})`,
                  WebkitMaskImage: `url(${mailOpenIcon})`,
                }}
                aria-hidden
              />
              <span>Mails</span>
            </h2>

            <div className="mt-4 space-y-3">
              {sortedMails.map((mail) => (
                <button
                  key={mail.id}
                  type="button"
                  className="flex w-full flex-col items-stretch rounded-2xl bg-[#FFE1CF] px-5 py-4 text-left text-sm text-[#3F2A1E] shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-[#3F2A1E]">{mail.sender}</p>
                      <p className="mt-1 text-xs leading-snug text-[#5A3A2A]">
                        {mail.body}
                      </p>
                      {mail.extra && (
                        <p className="mt-1 text-xs text-[#5A3A2A]">{mail.extra}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex h-7 min-w-[64px] items-center justify-center rounded-full bg-[#D24E00] px-4 text-xs font-semibold text-white">
                        Read
                      </span>
                      <span className="inline-flex h-7 min-w-[84px] items-center justify-center rounded-full bg-[#A23C00] px-4 text-xs font-semibold text-white">
                        Draft Reply
                      </span>
                    </div>
                  </div>

                  {mail.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mail.tags.map((tag) => {
                        const { backgroundColor, color } = getTagStyles(tag);
                        return (
                          <span
                            key={tag}
                            className="inline-block rounded-full px-4 py-1 text-xs font-semibold"
                            style={{ backgroundColor, color }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712]">
              <span
                className="inline-block h-5 w-5 shrink-0 bg-[#A34712] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                style={{
                  maskImage: `url(${draftIcon})`,
                  WebkitMaskImage: `url(${draftIcon})`,
                }}
                aria-hidden
              />
              <span>Drafted Replies</span>
            </h2>

            <div className="mt-3 space-y-3">
              {draftReplies.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl bg-[#FFE1CF] px-5 py-3 text-left text-sm text-[#3F2A1E] shadow-sm"
                >
                  <span>{draft.sender}</span>
                  <span className="inline-flex h-7 min-w-[72px] items-center justify-center rounded-full bg-[#D24E00] px-4 text-xs font-semibold text-white">
                    Open
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MailPage;
