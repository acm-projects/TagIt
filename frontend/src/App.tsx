import "./App.css";
import Popup from "./Popup";
import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { DayFilterProvider } from "./components/DaysFilter";
import { AuthProvider } from "./services/auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TodayPage from "./pages/TodayPage";
import MailPage from "./pages/MailPage";
import CalendarPage from "./pages/CalendarPage";
import TasksPage from "./pages/TasksPage";
import SettingsPage from "./pages/SettingsPage";
import AuthenticatePage from "./pages/AuthenticatePage";
import ConnectedEmailsPage from "./pages/ConnectedEmailsPage";
import SetupPage from "./pages/SetupPage";

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <DayFilterProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Popup />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Protected routes */}
            <Route
              path="/authenticate"
              element={
                <ProtectedRoute>
                  <AuthenticatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/connected-emails"
              element={
                <ProtectedRoute>
                  <ConnectedEmailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup"
              element={
                <ProtectedRoute>
                  <SetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/today"
              element={
                <ProtectedRoute>
                  <TodayPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mail"
              element={
                <ProtectedRoute>
                  <MailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </DayFilterProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
