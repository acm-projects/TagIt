import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./services/auth/AuthContext";
import MascotPage from "./pages/MascotPage";

const Popup: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <p className="text-lg text-[#6B7280]">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/today" replace />;
  }

  return <MascotPage />;
};

export default Popup;
