import React, { useState } from "react";

const BACKEND_BASE = "http://127.0.0.1:8000";

type Mode = "login" | "signup";
type SignupStep = "credentials" | "preferences";
type School = "ECS" | "JSOM" | "Other" | "";

const AuthPage: React.FC<{ onAuth: (user: { username: string; token: string }) => void }> = ({ onAuth }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<SignupStep>("credentials");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [school, setSchool] = useState<School>("");
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() { setError(null); setSuccess(null); }

  function switchMode(m: Mode) {
    setMode(m);
    setStep("credentials");
    setUsername(""); setPassword(""); setConfirmPassword("");
    setSchool(""); setTopics([]); setTopicInput("");
    reset();
  }

  function addTopic() {
    const t = topicInput.trim();
    if (!t || topics.includes(t)) { setTopicInput(""); return; }
    setTopics(prev => [...prev, t]);
    setTopicInput("");
  }

  function removeTopic(i: number) {
    setTopics(prev => prev.filter((_, idx) => idx !== i));
  }

  function onDragStart(i: number) { setDragIdx(i); }
  function onDragEnter(i: number) { setDragOverIdx(i); }
  function onDragEnd() {
    if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
      setDragIdx(null); setDragOverIdx(null); return;
    }
    const reordered = [...topics];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dragOverIdx, 0, moved);
    setTopics(reordered);
    setDragIdx(null); setDragOverIdx(null);
  }

  async function handleCredentials() {
    reset();
    if (!username.trim() || !password.trim()) { setError("Username and password are required."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep("preferences");
  }

  async function handleSignup() {
    reset();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, school, priorityTopics: topics }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setStep("credentials"); return; }
      onAuth({ username: data.username, token: data.token });
    } catch {
      setError("Could not reach the server. Make sure the Python backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    reset();
    if (!username.trim() || !password.trim()) { setError("Username and password are required."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      onAuth({ username: data.username, token: data.token });
    } catch {
      setError("Could not reach the server. Make sure the Python backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (step === "credentials") handleCredentials();
    }
  }

  // Signup step 2: preferences
  if (mode === "signup" && step === "preferences") {
    return (
      <div className="p-4 min-w-[320px]">
        <h1 className="text-3xl font-bold mb-1">TagIt</h1>
        <p className="text-xs text-gray-500 mb-4">Set up your preferences — you can change these any time in Settings.</p>

        {/* School picker */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-2">Your school at UTD</label>
          <div className="flex gap-2">
            {(["ECS", "JSOM", "Other"] as School[]).map(s => (
              <button
                key={s}
                onClick={() => setSchool(prev => prev === s ? "" : s)}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  school === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {school === "ECS" && <p className="text-xs text-gray-400 mt-1">Engineering & Computer Science</p>}
          {school === "JSOM" && <p className="text-xs text-gray-400 mt-1">Jindal School of Management</p>}
        </div>

        {/* Priority topics */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Priority topics</label>
          <p className="text-xs text-gray-400 mb-2">Add words to prioritize in your inbox. Drag to reorder — top = most important.</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTopic()}
              placeholder='e.g. Internship'
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button onClick={addTopic} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
              Add
            </button>
          </div>
          {topics.length > 0 && (
            <ul className="space-y-1">
              {topics.map((t, i) => (
                <li
                  key={t}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragEnter={() => onDragEnter(i)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={`flex items-center gap-2 px-3 py-2 rounded border bg-white text-sm cursor-grab select-none transition-all ${
                    dragOverIdx === i ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <span className="text-gray-300 text-xs">☰</span>
                  <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}.</span>
                  <span className="flex-1 text-gray-800">{t}</span>
                  <button onClick={() => removeTopic(i)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}

        <div className="flex gap-2">
          <button
            onClick={() => setStep("credentials")}
            className="flex-1 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium hover:border-gray-400"
          >
            Back
          </button>
          <button
            onClick={handleSignup}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Creating account..." : "Finish"}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">School and topics are optional — skip if you want.</p>
      </div>
    );
  }

  // Login / signup step 1
  return (
    <div className="p-4 min-w-[320px]">
      <h1 className="text-3xl font-bold mb-4">TagIt</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchMode("login")}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
            mode === "login" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchMode("signup")}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
            mode === "signup" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="your_username"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
          autoComplete="username"
          spellCheck={false}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs text-gray-500 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "signup" ? "min. 6 characters" : ""}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>

      {mode === "signup" && (
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
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
        onClick={mode === "login" ? handleLogin : handleCredentials}
        disabled={loading}
        className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? "Loading..." : mode === "login" ? "Sign In" : "Next →"}
      </button>
    </div>
  );
};

export default AuthPage;