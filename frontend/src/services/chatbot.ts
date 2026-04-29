import type { UserCategory } from "./categories";
import type { PriorityRule } from "./priorities";
import { apiRequest, getStoredToken } from "./api";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatbotContext = {
  priorities: PriorityRule[];
  categories: UserCategory[];
};

export type ChatbotRequest = {
  message: string;
  history: Array<Pick<ChatMessage, "role" | "content">>;
  context: ChatbotContext;
};

export type ChatbotResponse = {
  reply: string;
};

function getEnv(name: string): string {
  const value = import.meta.env[name];
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return "";
}

const DEFAULT_CHATBOT_API_BASE_URL = "http://localhost:8000";

export function getChatbotApiBaseUrl(): string {
  // Set this in frontend/.env for local development, for example:
  // VITE_CHATBOT_API_BASE_URL=http://localhost:8000
  return getEnv("VITE_CHATBOT_API_BASE_URL") || DEFAULT_CHATBOT_API_BASE_URL;
}

export async function sendChatMessage(
  request: ChatbotRequest,
): Promise<ChatbotResponse> {
  const response = await apiRequest<{ answer: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ question: request.message }),
  });

  if (!response.success) {
    throw new Error(response.error ?? "Chatbot request failed.");
  }

  const data = response.data;
  if (!data?.answer || typeof data.answer !== "string") {
    throw new Error("Chatbot response is missing a valid answer string.");
  }

  return { reply: data.answer };
}

export async function sendChatMessageStream(
  request: ChatbotRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${getChatbotApiBaseUrl()}/api/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question: request.message }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Chat stream failed: HTTP ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as { chunk?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.chunk) onChunk(parsed.chunk);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}
