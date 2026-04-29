import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserCategories } from "../services/categories";
import { useUserPriorities } from "../services/priorities";
import { sendChatMessageStream, type ChatMessage } from "../services/chatbot";
import authenticationBg from "../assets/AuthenticationBg.png";

const SUGGESTION_BOXES = [
  "Review my priorities",
  "What deadlines do I have?",
  "Summarize unread mail",
  "Help me plan today",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "Pick one of the suggestions below, or ask me to review your priorities, check your deadlines, summarize unread mail, or help plan your day.",
  },
];

const createMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();
  const priorities = useUserPriorities();
  const categories = useUserCategories();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialMessage, ...conversationMessages] = messages;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  const handleSendMessage = async (nextMessage?: string) => {
    const content = (nextMessage ?? message).trim();
    if (!content || isSending) return;

    const userMessage = createMessage("user", content);
    const historySnapshot = [...messages, userMessage];

    setMessages(historySnapshot);
    setMessage("");
    setErrorMessage(null);
    setIsSending(true);
    setStreamingContent("");

    let fullReply = "";
    try {
      await sendChatMessageStream(
        {
          message: content,
          history: historySnapshot.map(({ role, content: c }) => ({ role, content: c })),
          context: { priorities, categories },
        },
        (chunk) => {
          fullReply += chunk;
          setStreamingContent(fullReply);
        },
      );
      setMessages((prev) => [...prev, createMessage("assistant", fullReply)]);
      setStreamingContent(null);
    } catch (error) {
      setStreamingContent(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong sending the message.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#f1f6ff]"
      style={{
        backgroundImage: `url(${authenticationBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-5">
          <div className="pb-2">
            <button
              type="button"
              onClick={() => navigate("/today")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#F3E6D9] bg-white text-[#B86A38] transition-colors hover:bg-[#FFF3EA]"
              aria-label="Back to today"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
            </button>
          </div>

          <div ref={scrollRef} className="mt-4 flex-1 space-y-4 overflow-y-auto pb-2">
            {initialMessage && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F9A36E] text-white shadow-[0_6px_14px_rgba(249,163,110,0.35)]">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                </div>
                <div className="max-w-[85%] rounded-[1.35rem] rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-[#1F2933] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  {initialMessage.content}
                </div>
              </div>
            )}

            <div className="mt-auto space-y-2.5 px-4 sm:px-5">
              {SUGGESTION_BOXES.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    void handleSendMessage(suggestion);
                  }}
                  className="ml-auto flex h-12 w-[calc(58%-10px)] min-w-[14.375rem] items-center justify-between rounded-2xl bg-[#FDE6D7] px-4 text-left text-sm font-medium text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#F9D9C4]"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#111827]">
                    chevron_left
                  </span>
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>

            {conversationMessages.map((chatMessage) => {
              const isAssistant = chatMessage.role === "assistant";

              return (
                <div
                  key={chatMessage.id}
                  className={`flex items-start gap-3 ${
                    isAssistant ? "" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F9A36E] text-white shadow-[0_6px_14px_rgba(249,163,110,0.35)]">
                      <span className="material-symbols-outlined text-[18px]">forum</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-[1.35rem] px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words ${
                      isAssistant
                        ? "rounded-tl-md bg-white text-[#1F2933] shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                        : "rounded-tr-md bg-white text-[#1F2933] shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                    }`}
                  >
                    {chatMessage.content}
                  </div>
                </div>
              );
            })}

            {streamingContent !== null && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F9A36E] text-white shadow-[0_6px_14px_rgba(249,163,110,0.35)]">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                </div>
                <div className="max-w-[85%] rounded-[1.35rem] rounded-tl-md bg-white px-4 py-3 text-sm leading-6 whitespace-pre-wrap break-words text-[#1F2933] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
                  {streamingContent || (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 sm:px-5">
            {errorMessage && (
              <p className="mb-2 text-xs font-medium text-[#B42318]">{errorMessage}</p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendMessage();
              }}
              className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
            >
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type or ask me something"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2933] placeholder:text-[#6B7280] focus:outline-none"
                aria-label="Chatbot message"
              />
              <button
                type="submit"
                disabled={isSending || message.trim().length === 0}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#F9A36E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#E8945F] disabled:cursor-not-allowed disabled:bg-[#F6C8A9]"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatbotPage;
