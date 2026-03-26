/**
 * TypeScript types for OAuth and auth state
 */

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  email: string;
  savedAt: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  provider: "google" | "microsoft" | null;
  user: {
    email: string;
    name?: string;
  } | null;
  /** Which provider is currently connecting; null when idle */
  loadingProvider: "google" | "microsoft" | null;
  error: string | null;
}

export interface OAuthResponse {
  access_token: string;
  refresh_token?: string;
  email: string;
}
