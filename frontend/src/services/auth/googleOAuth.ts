/**
 * Google OAuth 2.0 for Chrome extension.
 * Uses authorization code flow — the code is forwarded to the Node backend
 * which exchanges it for tokens (including a refresh_token) and stores them.
 * Redirect URI from chrome.identity.getRedirectURL().
 */

import { getGoogleClientId } from "./config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/tasks",
];

export function getRedirectUrl(): string {
  return chrome.identity.getRedirectURL("oauth2callback");
}

/**
 * Build auth URL for authorization code flow (response_type=code).
 * The code is exchanged server-side for access + refresh tokens.
 */
export function buildGoogleAuthUrl(): string {
  const clientId = getGoogleClientId();
  const redirectUri = getRedirectUrl();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Parse authorization code from the redirect URL query string.
 * Example redirect: https://...chromiumapp.org/oauth2callback?code=...
 */
export function parseCodeFromRedirect(redirectUrl: string): string {
  const parsed = new URL(redirectUrl);
  const error = parsed.searchParams.get("error");
  if (error) {
    const desc = parsed.searchParams.get("error_description") ?? error;
    throw new Error(`Google OAuth: ${desc}`);
  }
  const code = parsed.searchParams.get("code");
  if (!code) {
    throw new Error("Google OAuth: No code in redirect URL");
  }
  return code;
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data = (await response.json()) as { email?: string };
  return data.email ?? "unknown@gmail.com";
}
