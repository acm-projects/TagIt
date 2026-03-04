import "./App.css";
import Popup from "./Popup";
import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TodayPage from "./pages/TodayPage";
import MailPage from "./pages/MailPage";
import CalendarPage from "./pages/CalendarPage";
import TasksPage from "./pages/TasksPage";
import SettingsPage from "./pages/SettingsPage";
import AuthenticatePage from "./pages/authenticate/AuthenticatePage";
import ConnectedEmailsPage from "./pages/connected-emails/ConnectedEmailsPage";
import SetupPage from "./pages/setup/SetupPage";

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Popup />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/authenticate" element={<AuthenticatePage />} />
        <Route path="/connected-emails" element={<ConnectedEmailsPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/mail" element={<MailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
