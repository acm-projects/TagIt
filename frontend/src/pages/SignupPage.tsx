import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";
import { signup, storeToken } from "../services/api";
import { useAuth } from "../services/auth/AuthContext";
import newBg from "../assets/NewBg.png";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError(null);

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup(username.trim(), password);
      if (res.success && res.data?.token) {
        await storeToken(res.data.token);
        await checkAuth();
        navigate("/authenticate");
      } else {
        setError(res.error ?? "Signup failed.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-[#fefcfb] p-4"
      style={{
        backgroundImage: `url(${newBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/72" aria-hidden />
      <PageTopBar back={{ label: "Back", useBrowserBack: true }} />
      <div className="relative z-10 flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-center px-10 pt-16">
        <h1 className="mb-10 font-instrument text-5xl font-normal text-[#1F2933]">
          Create Account
        </h1>

        {error && (
          <div className="mb-6 w-full max-w-md rounded-xl border border-[#fecdd3] bg-[#fee2e2] px-4 py-3">
            <p className="text-sm font-medium text-[#ef4444]">{error}</p>
          </div>
        )}

        <div className="w-full max-w-md space-y-6 text-left">
          <div className="space-y-2">
            <label className="block text-base font-medium text-[#1F2933]">
              Create Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25"
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
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25"
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
              className="w-full rounded-xl border border-[#EFE7DC] bg-white px-4 py-3 text-base text-[#111827] shadow-[0_6px_14px_rgba(17,24,39,0.05)] placeholder:text-[#9CA3AF] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#f9ab7b]/25"
            />
          </div>
        </div>

        <button
          className="mt-10 w-full max-w-md rounded-full bg-[#f9ab7b] py-3 text-base font-semibold text-white shadow-[0_6px_14px_rgba(249,171,123,0.35)] transition-colors transition-transform duration-200 hover:scale-[1.02] hover:bg-[#f0a068] disabled:opacity-60"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <button
          className="mt-6 text-base text-[#1F2933] underline decoration-[#EFE7DC] underline-offset-2 transition-colors hover:text-[#f9ab7b]"
          onClick={() => navigate("/login")}
        >
          Back again? Log in
        </button>
      </div>
    </div>
  );
};

export default SignupPage;

