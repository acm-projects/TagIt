import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../services/auth/AuthContext";

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  // Re-check authentication when this protected route mounts
  // This ensures we verify the token after login/signup
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    // Show a loading screen while checking authentication
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#EFE7DC] border-t-[#f9ab7b]" />
          <p className="text-[#1F2933]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
