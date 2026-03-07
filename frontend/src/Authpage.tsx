import React, { useState } from "react";

const BACKEND_BASE = "http://127.0.0.1:8000";

type Mode = "login" | "signup";

const AuthPage: React.FC<{ onAuth: (user: { username: string; token: string }) => void }> = ({ onAuth }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() {
    setError(null);
    setSuccess(null);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    reset();
  }

  async function handleSubmit() {
    reset();

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const res = await fetch(`${BACKEND_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      if (mode === "signup") {
        setSuccess("Account created! You can now sign in.");
        switchMode("login");
      } else {
        // Pass both username and token up to App
        onAuth({ username: data.username, token: data.token });
      }
    } catch {
      setError("Could not reach the server. Make sure the Python backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="p-4 min-w-[320px]">
      <h1 className="text-3xl font-bold mb-4">TagIt</h1>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchMode("login")}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
            mode === "login"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchMode("signup")}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
            mode === "signup"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Username field */}
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="your_username"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
          autoComplete="username"
          spellCheck={false}
        />
      </div>

      {/* Password field */}
      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "signup" ? "min. 6 characters" : ""}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>

      {/* Confirm password (signup only) */}
      {mode === "signup" && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="repeat password"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
            autoComplete="new-password"
          />
        </div>
      )}

      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
      {success && <div className="mt-2 text-green-700 text-sm">{success}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
      </button>
    </div>
  );
};

export default AuthPage;