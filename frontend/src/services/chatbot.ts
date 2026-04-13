import type { UserCategory } from "./categories";
import type { PriorityRule } from "./priorities";

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

export function getChatbotApiBaseUrl(): string {
  // TODO: Point this at your real backend base URL in `.env`, for example:
  // VITE_CHATBOT_API_BASE_URL=https://api.yourdomain.com
  return getEnv("VITE_CHATBOT_API_BASE_URL");
}

export async function sendChatMessage(
  request: ChatbotRequest,
): Promise<ChatbotResponse> {
  const baseUrl = getChatbotApiBaseUrl();

  if (!baseUrl) {
    // TODO: Remove this fallback once the backend route exists.
    // Keeping it here means the frontend remains testable before the API is live.
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    return {
      reply:
        "Backend not connected yet. Once VITE_CHATBOT_API_BASE_URL is set, this message can be sent to your real chatbot service.",
    };
  }

  // Expected backend contract:
  // POST {baseUrl}/chatbot/message
  // Body:
  // {
  //   message: string,
  //   history: [{ role: "user" | "assistant", content: string }],
  //   context: {
  //     priorities: [{ id, label }],
  //     categories: [{ id, name, color, isCustom }]
  //   }
  // }
  //
  // Expected response:
  // { reply: string }
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chatbot/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chatbot request failed with status ${response.status}`);
  }

  const data = (await response.json()) as Partial<ChatbotResponse>;
  if (!data.reply || typeof data.reply !== "string") {
    throw new Error("Chatbot response is missing a valid reply string.");
  }

  return { reply: data.reply };
}
