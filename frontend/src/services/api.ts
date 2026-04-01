/**
 * API service for communicating with the Flask backend.
 * Handles token management and automatic token injection in requests.
 */

const BACKEND_URL = "http://localhost:8000";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get the stored JWT token from chrome storage
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get("tagit_jwt_token");
    const token = result.tagit_jwt_token;
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

/**
 * Store JWT token in chrome storage
 */
export async function storeToken(token: string): Promise<void> {
  try {
    await chrome.storage.local.set({ tagit_jwt_token: token });
  } catch (err) {
    console.error("Failed to store token:", err);
  }
}

/**
 * Clear the stored JWT token
 */
export async function clearToken(): Promise<void> {
  try {
    await chrome.storage.local.remove("tagit_jwt_token");
  } catch (err) {
    console.error("Failed to clear token:", err);
  }
}

/**
 * Make an API request to the Flask backend with automatic token injection
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.headers && typeof options.headers === "object") {
    Object.assign(headers, options.headers);
  }

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Login with username and password
 */
export async function login(
  username: string,
  password: string
): Promise<ApiResponse<{ token: string; username: string }>> {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

/**
 * Sign up with username and password
 */
export async function signup(
  username: string,
  password: string,
  school?: string,
  priorityTopics?: string[]
): Promise<ApiResponse<{ token: string; username: string }>> {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      school: school || "",
      priorityTopics: priorityTopics || [],
    }),
  });
}

/**
 * Verify if the current token is valid
 */
export async function verifyToken(): Promise<ApiResponse<{ username: string }>> {
  return apiRequest("/auth/verify", {
    method: "GET",
  });
}

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<
  ApiResponse<{ school: string; priorityTopics: string[] }>
> {
  return apiRequest("/auth/preferences", {
    method: "GET",
  });
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  school?: string,
  priorityTopics?: string[]
): Promise<ApiResponse<any>> {
  const body: any = {};
  if (school !== undefined) body.school = school;
  if (priorityTopics !== undefined) body.priorityTopics = priorityTopics;

  return apiRequest("/auth/preferences", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Get connected email accounts from the database
 */
export async function getConnectedEmails(): Promise<
  ApiResponse<{ emails: { provider: string; email: string }[] }>
> {
  return apiRequest("/auth/connected-emails", {
    method: "GET",
  });
}
