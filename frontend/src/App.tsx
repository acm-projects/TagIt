import React, { useState, useEffect } from "react";
import Popup from "./Popup";
import AuthPage from "./Authpage";

const BACKEND_BASE = "http://127.0.0.1:8000";

const App: React.FC = () => {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tagit_token");
    console.log("1. Token in storage:", token);

    if (!token) {
      setChecking(false);
      return;
    }

    fetch(`${BACKEND_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        console.log("2. Verify status:", r.status);
        return r.json();
      })
      .then((data) => {
        console.log("3. Verify data:", data);
        if (data.username) {
          setUser({ username: data.username });
        } else {
          localStorage.removeItem("tagit_token");
        }
      })
      .catch((err) => {
        console.error("4. Verify failed:", err);
        localStorage.removeItem("tagit_token");
      })
      .finally(() => setChecking(false));
  }, []);

  function handleAuth(userData: { username: string; token: string }) {
    localStorage.setItem("tagit_token", userData.token);
    setUser({ username: userData.username });
  }

  function handleLogout() {
    localStorage.removeItem("tagit_token");
    setUser(null);
  }

  if (checking) return null;

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return <Popup onLogout={handleLogout} />;
};

export default App;