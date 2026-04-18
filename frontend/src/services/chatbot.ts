import type { UserCategory } from "./categories";
import type { PriorityRule } from "./priorities";
import { apiRequest } from "./api";

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
