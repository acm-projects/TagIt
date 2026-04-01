/**
 * Background service worker: side panel behavior and OAuth.
 * OAuth runs here so the flow completes even if the side panel closes.
 */

import {
  buildGoogleAuthUrl,
  parseCodeFromRedirect,
} from "./services/auth/googleOAuth";
import {
  buildMicrosoftAuthUrl,
  exchangeMicrosoftCodeForTokens,
  fetchMicrosoftUserEmail,
} from "./services/auth/microsoftOAuth";
import { saveToken } from "./services/auth/tokenStorage";
import { getStoredToken } from "./services/api";

const NODE_BACKEND_URL = "http://localhost:3000";

const enableSidePanelOnClick = async () => {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Unable to enable side panel on action click.", error);
  }
};

void enableSidePanelOnClick();

chrome.runtime.onInstalled.addListener(() => {
  void enableSidePanelOnClick();
});

chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    if (message.type === "OPEN_TAGIT_PANEL") {
      const tabId = _sender.tab?.id;
      if (tabId == null) {
        sendResponse({ ok: false });
        return;
      }
      chrome.sidePanel
        .open({ tabId })
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          console.error("Unable to open side panel.", error);
          sendResponse({ ok: false });
        });
      return true;
    }

    if (message.type === "startGoogleOAuth") {
      runGoogleOAuth()
        .then((data) => sendResponse({ success: true, data }))
        .catch((err) => {
          const msg = err instanceof Error ? err.message : "Google sign-in failed";
          sendResponse({ success: false, error: msg });
        });
      return true;
    }

    if (message.type === "startMicrosoftOAuth") {
      runMicrosoftOAuth()
        .then((data) => sendResponse({ success: true, data }))
        .catch((err) => {
          const msg = err instanceof Error ? err.message : "Microsoft sign-in failed";
          sendResponse({ success: false, error: msg });
        });
      return true;
    }

    return false;
  }
);

async function runGoogleOAuth(): Promise<{ email: string }> {
  const url = buildGoogleAuthUrl();

  const redirectUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url, interactive: true },
      (callbackUrl?: string) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? "OAuth cancelled"));
          return;
        }
        if (!callbackUrl) {
          reject(new Error("OAuth flow did not return a URL"));
          return;
        }
        resolve(callbackUrl);
      }
    );
  });

  // Parse the authorization code from the redirect URL
  const code = parseCodeFromRedirect(redirectUrl);

  // Get the user's JWT so the Node backend can associate the tokens
  const jwt = await getStoredToken();
  if (!jwt) {
    throw new Error("You must be logged in before connecting a Gmail account.");
  }

  // Forward the redirect URL to the Node backend for token exchange + DB storage
  const resp = await fetch(`${NODE_BACKEND_URL}/auth/google/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ redirectUrl }),
  });

  const data = (await resp.json()) as { success?: boolean; email?: string; error?: string };
  if (!resp.ok || !data.success) {
    throw new Error(data.error ?? "Failed to exchange Google code for tokens");
  }

  const email = data.email ?? "unknown@gmail.com";

  // Also save locally so the ConnectedEmailsPage can show it immediately
  await saveToken("google", {
    access_token: code, // placeholder — real tokens are on the server
    email,
  });

  return { email };
}

async function runMicrosoftOAuth(): Promise<{ email: string }> {
  const { url, codeVerifier } = await buildMicrosoftAuthUrl();

  const redirectUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url, interactive: true },
      (callbackUrl?: string) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? "OAuth cancelled"));
          return;
        }
        if (!callbackUrl) {
          reject(new Error("OAuth flow did not return a URL"));
          return;
        }
        resolve(callbackUrl);
      }
    );
  });

  const parsed = new URL(redirectUrl);
  const code = parsed.searchParams.get("code") ?? new URLSearchParams(parsed.hash?.slice(1) || "").get("code");
  if (!code) {
    const error = parsed.searchParams.get("error") ?? parsed.searchParams.get("error_description") ?? "No code in redirect";
    throw new Error(`Microsoft OAuth: ${error}`);
  }

  const tokens = await exchangeMicrosoftCodeForTokens(code, codeVerifier);
  const email = await fetchMicrosoftUserEmail(tokens.access_token);

  await saveToken("microsoft", {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    email,
  });

  // Save the MS refresh token + email to the DB so the Node server can
  // fetch Outlook emails during sync-emails
  const jwt = await getStoredToken();
  if (jwt && tokens.refresh_token) {
    try {
      await fetch(`${NODE_BACKEND_URL}/auth/microsoft/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ redirectUrl }),
      }).catch(() => {
        // Fallback: save tokens directly to Flask
        fetch("http://localhost:8000/auth/oauth-tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ msRefreshToken: tokens.refresh_token, msEmail: email }),
        }).catch(() => {});
      });
    } catch {
      // Non-critical — emails just won't sync from Outlook
    }
  }

  return { email };
}
