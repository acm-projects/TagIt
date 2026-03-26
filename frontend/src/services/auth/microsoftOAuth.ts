/**
 * Microsoft (Entra ID / Azure AD) OAuth 2.0 for Chrome extension.
 * Uses authorization code flow with PKCE — no client_secret (public client / SPA).
 * Redirect URI from chrome.identity.getRedirectURL().
 * Register the redirect URI in Azure as SPA: https://<EXTENSION_ID>.chromiumapp.org/
 */

import { getMicrosoftClientId } from "./config";
import { generateCodeChallenge, generateCodeVerifier } from "./pkce";
import { getRedirectUrl } from "./googleOAuth";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const SCOPES = ["openid", "email", "profile", "User.Read", "Mail.Read", "offline_access"];

export async function buildMicrosoftAuthUrl(): Promise<{
  url: string;
  codeVerifier: string;
}> {
  const clientId = getMicrosoftClientId();
  const redirectUri = getRedirectUrl();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });

  const url = `${MICROSOFT_AUTH_URL}?${params.toString()}`;
  return { url, codeVerifier };
}

export async function exchangeMicrosoftCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const clientId = getMicrosoftClientId();
  const redirectUri = getRedirectUrl();

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error_description?: string; error?: string };
    const msg = err.error_description ?? err.error ?? response.statusText ?? "Token exchange failed";
    throw new Error(`Microsoft token exchange: ${msg}`);
  }

  const data = (await response.json()) as { access_token: string; refresh_token?: string };
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

export async function fetchMicrosoftUserEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Microsoft user: ${response.status} ${text.slice(0, 100)}`);
  }

  const data = (await response.json()) as { userPrincipalName?: string; mail?: string };
  const email = data.userPrincipalName ?? data.mail;
  if (!email || typeof email !== "string") {
    throw new Error("Microsoft profile did not return an email");
  }
  return email;
}
