/**
 * Background service worker: side panel behavior and OAuth.
 * OAuth runs here so the flow completes even if the side panel closes.
 */

import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
} from "./services/auth/googleOAuth";
import {
  buildMicrosoftAuthUrl,
  exchangeMicrosoftCode,
} from "./services/auth/microsoftOAuth";

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
  console.log("[Google OAuth] Starting OAuth flow");
  const url = await buildGoogleAuthUrl();

  const redirectUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url, interactive: true },
      (callbackUrl?: string) => {
        if (chrome.runtime.lastError) {
          console.error("[Google OAuth] Chrome runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message ?? "OAuth cancelled"));
          return;
        }
        if (!callbackUrl) {
          reject(new Error("OAuth flow did not return a URL"));
          return;
        }
        console.log("[Google OAuth] Received callback URL");
        resolve(callbackUrl);
      }
    );
  });

  // POST the redirect URL to the Node backend — it extracts the code,
  // exchanges it for tokens, stores the refresh token, and returns the email.
  console.log("[Google OAuth] Exchanging code with backend");
  const email = await exchangeGoogleCode(redirectUrl);
  console.log("[Google OAuth] Success, email:", email);
  return { email };
}

async function runMicrosoftOAuth(): Promise<{ email: string }> {
  console.log("[Microsoft OAuth] Starting OAuth flow");
  const { url } = await buildMicrosoftAuthUrl();

  const redirectUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url, interactive: true },
      (callbackUrl?: string) => {
        if (chrome.runtime.lastError) {
          console.error("[Microsoft OAuth] Chrome runtime error:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message ?? "OAuth cancelled"));
          return;
        }
        if (!callbackUrl) {
          reject(new Error("OAuth flow did not return a URL"));
          return;
        }
        console.log("[Microsoft OAuth] Received callback URL");
        resolve(callbackUrl);
      }
    );
  });

  // POST the redirect URL to the Node backend — same pattern as Google.
  console.log("[Microsoft OAuth] Exchanging code with backend");
  const email = await exchangeMicrosoftCode(redirectUrl);
  console.log("[Microsoft OAuth] Success, email:", email);
  return { email };
}