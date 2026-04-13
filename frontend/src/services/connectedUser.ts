export type ConnectedUser = {
  username: string;
  emails: string[];
};

const STORAGE_KEY = "connectedUser";

const DEFAULT_USER: ConnectedUser = {
  username: "username",
  emails: ["email1@gmail.com", "email2@outlook.com", "email3@utdallas.edu"],
};

export const loadConnectedUser = (): ConnectedUser => {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw) as ConnectedUser;
    if (!parsed || !Array.isArray(parsed.emails)) return DEFAULT_USER;
    return {
      username: parsed.username ?? DEFAULT_USER.username,
      emails: parsed.emails.length > 0 ? parsed.emails : DEFAULT_USER.emails,
    };
  } catch {
    return DEFAULT_USER;
  }
};

export const saveConnectedUser = (user: ConnectedUser) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore persistence errors for now
  }
};

export const loadConnectedEmails = (): string[] => {
  return loadConnectedUser().emails;
};
