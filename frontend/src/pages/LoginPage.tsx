import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";
import authenticationBg from "../assets/AuthenticationBg.png";
import { login, storeToken } from "../services/api";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await login(username, password);

      if (!response.success) {
        setError(response.error || "Login failed");
        setLoading(false);
        return;
      }

      if (response.data?.token) {
        await storeToken(response.data.token);
        // Navigate to today page after successful login
        navigate("/today");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      className="relative min-h-screen bg-[#F9F8F6] p-4"
      style={{
        backgroundImage: `url(${authenticationBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <PageTopBar back={{ label: "Back", to: "/" }} />
      <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center px-10 pt-16">
        <h1 className="mb-10 font-instrument text-5xl font-normal text-[#1F2933]">
          Login
        </h1>

        <div className="w-full max-w-md space-y-6 text-left">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25 disabled:opacity-50"
            />
            <p className="mt-1 text-sm text-[#6B7280]">
              I forgot my password
            </p>
          </div>
        </div>

        <button
          className="mt-10 w-full max-w-md rounded-full bg-[#f9ab7b] py-3 text-base font-semibold text-white shadow-[0_6px_14px_rgba(249,171,123,0.35)] transition-colors transition-transform duration-200 hover:scale-[1.02] hover:bg-[#f0a068] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          className="mt-6 text-base text-[#1F2933] underline decoration-[#EFE7DC] underline-offset-2 transition-colors hover:text-[#f9ab7b] disabled:opacity-50"
          onClick={() => navigate("/signup")}
          disabled={loading}
        >
          Don’t have an account? Sign up
        </button>
      </div>
    </div>
  );
};

export default LoginPage;

