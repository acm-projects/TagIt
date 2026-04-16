/**
 * Synchronous helper for reading the currently logged-in username.
 * Written to localStorage on successful auth, cleared on logout.
 * Used to namespace all per-user storage keys.
 */

const CURRENT_USER_KEY = "tagit.current-user";

export const getCurrentUsername = (): string => {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) ?? "";
  } catch {
    return "";
  }
};

export const setCurrentUsername = (username: string): void => {
  try {
    localStorage.setItem(CURRENT_USER_KEY, username);
  } catch {}
};

export const clearCurrentUsername = (): void => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {}
};
