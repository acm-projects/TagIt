/**
 * Auth configuration from environment variables.
 * Used by the background script and any code that needs OAuth client IDs.
 */

function getEnv(name: string): string {
  const value = import.meta.env[name];
  if (value != null && typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return "";
}

export function getGoogleClientId(): string {
  const id = getEnv("VITE_GOOGLE_CLIENT_ID");
  if (!id) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID is not set. Add it to .env (see .env.example) and rebuild."
    );
  }
  return id;
}

/** Placeholder for future Microsoft auth. Do not use until implemented. */
export function getMicrosoftClientId(): string {
  const id = getEnv("VITE_MICROSOFT_CLIENT_ID");
  if (!id) {
    throw new Error(
      "VITE_MICROSOFT_CLIENT_ID is not set. Microsoft authentication is not implemented yet."
    );
  }
  return id;
}
