import React, { createContext, useContext, useEffect, useState } from "react";
import { verifyToken, clearToken, getStoredToken } from "../api";

export interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const checkAuth = async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setIsAuthenticated(false);
        setUsername(null);
        return;
      }

      const response = await verifyToken();
      if (response.success && response.data?.username) {
        setIsAuthenticated(true);
        setUsername(response.data.username);
      } else {
        setIsAuthenticated(false);
        setUsername(null);
        await clearToken();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthenticated(false);
      setUsername(null);
    } finally {
      // Only set loading to false after the first auth check
      if (!hasCheckedAuth) {
        setIsLoading(false);
        setHasCheckedAuth(true);
      }
    }
  };

  const logout = async () => {
    await clearToken();
    setIsAuthenticated(false);
    setUsername(null);
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        isLoading,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
