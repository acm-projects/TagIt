import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";
import authenticationBg from "../assets/AuthenticationBg.png";
import { signup, storeToken } from "../services/api";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await signup(username, password);

      if (!response.success) {
        setError(response.error || "Signup failed");
        setLoading(false);
        return;
      }

      if (response.data?.token) {
        await storeToken(response.data.token);
        // Navigate to setup page for user to configure preferences
        navigate("/setup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignup();
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
          Create Account
        </h1>

        <div className="w-full max-w-md space-y-6 text-left">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Create Username
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
              Create Password
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
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Verify Password
            </label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25 disabled:opacity-50"
            />
          </div>
        </div>

        <button
          className="mt-10 w-full max-w-md rounded-full bg-[#f9ab7b] py-3 text-base font-semibold text-white shadow-[0_6px_14px_rgba(249,171,123,0.35)] transition-colors transition-transform duration-200 hover:scale-[1.02] hover:bg-[#f0a068] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <button
          className="mt-6 text-base text-[#1F2933] underline decoration-[#EFE7DC] underline-offset-2 transition-colors hover:text-[#f9ab7b] disabled:opacity-50"
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Back again? Log in
        </button>
      </div>
    </div>
  );
};

export default SignupPage;

