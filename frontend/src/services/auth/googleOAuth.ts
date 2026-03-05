/**
 * Google OAuth 2.0 for Chrome extension.
 * Uses implicit (token) flow so no client_secret is needed — works with a "Web application" client.
 * Redirect URI from chrome.identity.getRedirectURL().
 */

import { getGoogleClientId } from "./config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function getRedirectUrl(): string {
  return chrome.identity.getRedirectURL();
}

/**
 * Build auth URL for implicit flow (response_type=token).
 * Google returns access_token in the redirect URL fragment — no token exchange, no client_secret.
 */
export function buildGoogleAuthUrl(): string {
  const clientId = getGoogleClientId();
  const redirectUri = getRedirectUrl();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES.join(" "),
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Parse access_token from the redirect URL fragment after implicit flow.
 * Example redirect: https://...chromiumapp.org/#access_token=...&token_type=Bearer&expires_in=...
 */
export function parseTokenFromRedirect(redirectUrl: string): string {
  const hashIndex = redirectUrl.indexOf("#");
  if (hashIndex === -1) throw new Error("No fragment in redirect URL");
  const fragment = redirectUrl.slice(hashIndex + 1);
  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");
  if (!accessToken) {
    const error = params.get("error") ?? params.get("error_description") ?? "No access_token in redirect";
    throw new Error(`Google OAuth: ${error}`);
  }
  return accessToken;
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
