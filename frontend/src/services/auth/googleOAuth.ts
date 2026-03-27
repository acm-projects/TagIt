/**
 * Google OAuth 2.0 for Chrome extension.
 *
 * Flow:
 *  1. Fetch the auth URL from the Node backend (/auth/url).
 *  2. Open it with chrome.identity.launchWebAuthFlow — Chrome intercepts
 *     the redirect to the chromiumapp.org URI and hands the full URL back
 *     to the extension (no browser tab stays open).
 *  3. POST the redirected URL to the Node backend (/auth/google/exchange)
 *     so it can extract the code, exchange it for tokens, and store them.
 *  4. Return the email address so the caller can update the UI.
 */

import { getStoredToken } from "../api";

const NODE_BACKEND_URL = "http://localhost:3000";

/**
 * Fetch the OAuth URL from the Node.js backend.
 * The REDIRECT_URI baked into the URL is the chromiumapp.org address, which
 * is what launchWebAuthFlow needs to intercept the callback.
 */
export async function buildGoogleAuthUrl(): Promise<string> {
  const token = await getStoredToken();
  if (!token) {
    throw new Error("No JWT token available. User must be authenticated.");
  }

  const response = await fetch(`${NODE_BACKEND_URL}/auth/url`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to get OAuth URL from server");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

/**
 * After launchWebAuthFlow resolves, POST the redirect URL to the Node backend.
 * The backend extracts the code, exchanges it for tokens, saves the refresh
 * token and email, then returns the email.
 *
 * Returns the user's Google email address on success.
 */
export async function exchangeGoogleCode(redirectUrl: string): Promise<string> {
  const token = await getStoredToken();
  if (!token) {
    throw new Error("No JWT token available.");
  }

  // Check for explicit OAuth denial before hitting the server
  try {
    const parsed = new URL(redirectUrl);
    const error = parsed.searchParams.get("error");
    if (error === "access_denied") {
      throw new Error(
        "You denied access to Gmail. Please try again and click 'Allow'."
      );
    }
    if (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Authentication")) {
      throw err;
    }
    // URL parse failed — let the server try
  }

  const response = await fetch(`${NODE_BACKEND_URL}/auth/google/exchange`, {
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
    throw new Error(data.error || "Failed to complete Google authentication");
  }

  return data.email ?? "google@account.com";
}

// ---------------------------------------------------------------------------
// Kept for backwards-compatibility if anything still imports it — safe no-op.
// ---------------------------------------------------------------------------
/** @deprecated Use exchangeGoogleCode instead */
export function parseTokenFromRedirect(_redirectUrl: string): void {
  // No-op: token exchange now happens server-side via exchangeGoogleCode.
}

/** @deprecated Use exchangeGoogleCode instead */
export async function fetchGoogleUserEmail(): Promise<string> {
  const token = await getStoredToken();
  if (!token) return "google@account.com";
  try {
    const response = await fetch(`${NODE_BACKEND_URL}/auth/google-email`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return "google@account.com";
    const data = (await response.json()) as { email: string | null };
    return data.email ?? "google@account.com";
  } catch {
    return "google@account.com";
  }
}