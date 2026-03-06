import React, { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";

/**
 * Represents a single mail that can appear in the prioritized list.
 *
 * In a real implementation these objects should be produced by a
 * backend pipeline that reads the user's email, scores importance and
 * urgency, and then surfaces only the highest‑value messages here.
 */
type MailItem = {
  /** Stable identifier, e.g. message id from Gmail/Outlook. */
  id: string;
  /** Sender line shown as the bold title of the card. */
  sender: string;
  /** Main preview text pulled from the email body. */
  body: string;
  /** Optional secondary line (e.g. explicit deadline). */
  extra?: string;
  /** Chip labels such as "Internship" / "Resume" / "Temporary Credit". */
  tags: string[];
  /**
   * Higher numbers indicate higher priority.
   * This is where backend scoring can plug in (e.g. ML model output).
   */
  priorityScore: number;
};

/**
 * Minimal shape used for the "Drafted Replies" section.
 * In practice you might want to track draft ids and thread ids here.
 */
type DraftItem = {
  id: string;
  sender: string;
};

const MailPage: React.FC = () => {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [draftReplies, setDraftReplies] = useState<DraftItem[]>([]);

  useEffect(() => {
    /**
     * Seed example data that mimics the Figma layout.
     *
     * Backend integration notes:
     * - Replace this effect with an API call that returns the user's
     *   highest‑priority messages, already scored and filtered.
     * - The array should be sorted (or at least sortable via
     *   `priorityScore`) so this page always surfaces what matters most.
     */
    setMails([
      {
        id: "m1",
        sender: "Joshua Montogermy",
        body: "Requesting a screenshot of current off-campus enrollment (with courses and college) to grant temporary credit while awaiting transfer.",
        extra: undefined,
        tags: ["Temporary Credit"],
        priorityScore: 10, // urgent academic admin request
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

    setDraftReplies([
      {
        id: "d1",
        sender: "John Mathew @Verizon @Handshake",
      },
    ]);
  }, []);

  /**
   * Always present mails in priority order so the most important
   * messages appear at the top, regardless of raw arrival time.
   * When backend data is available, this will simply sort by the
   * model‑assigned `priorityScore`.
   */
  const sortedMails = useMemo(
    () =>
      [...mails].sort((a, b) => b.priorityScore - a.priorityScore),
    [mails],
  );

  /**
   * Helper to choose a soft background colour for a tag based on its
   * label. This keeps the visual styling close to the Figma design but
   * stays purely data‑driven.
   */
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

    // Default pill styling for any other tags the backend might add.
    return { backgroundColor: "#FFE1CF", color: "#5A3A2A" };
  };

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        {/* Shared left navigation rail */}
        <AppNavbar />

        {/* Main content: same header strip as other pages */}
        <main className="flex-1 flex flex-col overflow-auto px-8 py-6 text-[#A34712]">
          <DateHeader />

          {/* Mails section */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712] border-b border-[#F3C5A5] pb-2">
              <span className="text-base">✉️</span>
              <span>Mails</span>
            </h2>

            {/* Priority‑sorted mail cards around the Figma design */}
            <div className="mt-4 space-y-3">
              {sortedMails.map((mail) => (
                <button
                  key={mail.id}
                  type="button"
                  className="flex w-full flex-col items-stretch rounded-2xl bg-[#FFE1CF] px-5 py-4 text-left text-sm text-[#3F2A1E] shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Sender + preview text */}
                    <div className="flex-1">
                      <p className="font-semibold text-[#3F2A1E]">
                        {mail.sender}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-[#5A3A2A]">
                        {mail.body}
                      </p>
                      {mail.extra && (
                        <p className="mt-1 text-xs text-[#5A3A2A]">
                          {mail.extra}
                        </p>
                      )}
                    </div>

                    {/* Call‑to‑action buttons mirroring the Figma layout */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex h-7 min-w-[64px] items-center justify-center rounded-full bg-[#D24E00] px-4 text-xs font-semibold text-white">
                        Read
                      </span>
                      <span className="inline-flex h-7 min-w-[84px] items-center justify-center rounded-full bg-[#A23C00] px-4 text-xs font-semibold text-white">
                        Draft Reply
                      </span>
                    </div>
                  </div>

                  {/* Tag chips (e.g. "Temporary Credit", "Internship", "Resume") */}
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

          {/* Drafted replies section */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#A34712] border-b border-[#F3C5A5] pb-2">
              <span className="text-base">✏️</span>
              <span>Drafted Replies</span>
            </h2>

            {/* Simple list of threads where the user has already started a reply.
                Later the backend can attach thread ids so clicking "Open" jumps
                straight back into the correct draft. */}
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
