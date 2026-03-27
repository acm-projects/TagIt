/**
 * Microsoft (Entra ID / Azure AD) OAuth 2.0 for Chrome extension.
 *
 * Same pattern as googleOAuth.ts:
 *  1. Fetch the auth URL from the Node backend (/auth/microsoft/url).
 *  2. Open it with chrome.identity.launchWebAuthFlow.
 *  3. POST the resulting redirect URL to /auth/microsoft/exchange.
 *  4. Return the email so the caller can update the UI.
 */

import { getStoredToken } from "../api";

const NODE_BACKEND_URL = "http://localhost:3000";

export async function buildMicrosoftAuthUrl(): Promise<{
  url: string;
  codeVerifier: string;
}> {
  const token = await getStoredToken();
  if (!token) {
    throw new Error("No JWT token available. User must be authenticated.");
  }

  const response = await fetch(`${NODE_BACKEND_URL}/auth/microsoft/url`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || "Failed to get Microsoft OAuth URL from server"
    );
  }

  const data = (await response.json()) as { url: string };
  // No PKCE code verifier needed — the backend handles the token exchange.
  return { url: data.url, codeVerifier: "" };
}

/**
 * After launchWebAuthFlow resolves, POST the redirect URL to the Node backend.
 * Returns the user's Microsoft email address on success.
 */
export async function exchangeMicrosoftCode(
  redirectUrl: string
): Promise<string> {
  const token = await getStoredToken();
  if (!token) {
    throw new Error("No JWT token available.");
  }

  // Check for explicit denial before hitting the server
  try {
    const parsed = new URL(redirectUrl);
    const error = parsed.searchParams.get("error");
    if (error === "access_denied") {
      throw new Error(
        "You denied access to Outlook. Please try again and click 'Accept'."
      );
    }
    if (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Authentication")) {
      throw err;
    }
  }

  const response = await fetch(`${NODE_BACKEND_URL}/auth/microsoft/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ redirectUrl }),
  });

  const data = (await response.json()) as {
    success?: boolean;
    email?: string | null;
    error?: string;
  };

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Failed to complete Microsoft authentication"
    );
  }

  return data.email ?? "microsoft@account.com";
}

/** @deprecated Use exchangeMicrosoftCode instead */
export async function fetchMicrosoftUserEmail(): Promise<string> {
  const token = await getStoredToken();
  if (!token) return "microsoft@account.com";
  try {
    const response = await fetch(`${NODE_BACKEND_URL}/auth/microsoft-email`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return "microsoft@account.com";
    const data = (await response.json()) as { email: string | null };
    return data.email ?? "microsoft@account.com";
  } catch {
    return "microsoft@account.com";
  }
}