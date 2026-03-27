/**
 * Background service worker: side panel behavior and OAuth.
 * OAuth runs here so the flow completes even if the side panel closes.
 */

import {
  buildGoogleAuthUrl,
  fetchGoogleUserEmail,
  parseTokenFromRedirect,
} from "./services/auth/googleOAuth";
import {
  buildMicrosoftAuthUrl,
  exchangeMicrosoftCodeForTokens,
  fetchMicrosoftUserEmail,
} from "./services/auth/microsoftOAuth";
import { saveToken } from "./services/auth/tokenStorage";

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

  const accessToken = parseTokenFromRedirect(redirectUrl);
  const email = await fetchGoogleUserEmail(accessToken);

  await saveToken("google", {
    access_token: accessToken,
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

  return { email };
}
