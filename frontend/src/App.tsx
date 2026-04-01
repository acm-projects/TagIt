import "./App.css";
import Popup from "./Popup";
import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { DayFilterProvider } from "./components/DaysFilter";
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
import MascotPage from "./pages/MascotPage";
import ChatbotPage from "./pages/ChatbotPage";

const App: React.FC = () => {
  return (
    <HashRouter>
      <DayFilterProvider>
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
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/mascot" element={<MascotPage />} />
      </Routes>
      </DayFilterProvider>
    </HashRouter>
  );
};

export default App;
