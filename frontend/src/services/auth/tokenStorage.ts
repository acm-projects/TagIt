/**
 * Token storage for OAuth providers.
 * Uses chrome.storage.local so tokens persist and are available to the extension.
 */

export type AuthProvider = "google" | "microsoft";

export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  email: string;
  savedAt: number;
}

const KEY_PREFIX = "tagit_oauth_";

function storageKey(provider: AuthProvider): string {
  return `${KEY_PREFIX}${provider}`;
}

export async function saveToken(
  provider: AuthProvider,
  data: Omit<StoredToken, "savedAt">
): Promise<void> {
  await chrome.storage.local.set({
    [storageKey(provider)]: {
      ...data,
      savedAt: Date.now(),
    },
  });
}

export async function getToken(
  provider: AuthProvider
): Promise<StoredToken | null> {
  const key = storageKey(provider);
  const result = await chrome.storage.local.get(key);
  const raw = result[key];
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.access_token !== "string" || typeof o.email !== "string" || typeof o.savedAt !== "number") {
    return null;
  }
  return raw as StoredToken;
}

export async function removeToken(provider: AuthProvider): Promise<void> {
  await chrome.storage.local.remove(storageKey(provider));
}
