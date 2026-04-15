import { getCurrentUsername } from "./currentUser";

export type ConnectedUser = {
  username: string;
  emails: string[];
};

const getConnectedUserKey = () => `connectedUser.${getCurrentUsername()}`;

const DEFAULT_USER: ConnectedUser = {
  username: "",
  emails: [],
};

export const loadConnectedUser = (): ConnectedUser => {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = window.localStorage.getItem(getConnectedUserKey());
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw) as ConnectedUser;
    if (!parsed || !Array.isArray(parsed.emails)) return DEFAULT_USER;
    return {
      username: parsed.username ?? "",
      emails: parsed.emails,
    };
  } catch {
    return DEFAULT_USER;
  }
};

export const saveConnectedUser = (user: ConnectedUser) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getConnectedUserKey(), JSON.stringify(user));
  } catch {
    // ignore persistence errors
  }
};

export const loadConnectedEmails = (): string[] => {
  return loadConnectedUser().emails;
};
