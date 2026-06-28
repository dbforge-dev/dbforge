"use client";

import { useState, FormEvent } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://dbforge-api.fly.dev";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <a href="/" className="text-white font-semibold text-xl mb-10 tracking-tight">basely</a>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        {sent ? (
          <>
            <h1 className="text-white text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-white/40 text-sm">If that email exists, we sent a reset link. It expires in 1 hour.</p>
            <a href="/login" className="block mt-6 text-center text-white/40 text-sm hover:text-white transition-colors">
              Back to login
            </a>
          </>
        ) : (
          <>
            <h1 className="text-white text-2xl font-bold mb-1">Reset password</h1>
            <p className="text-white/40 text-sm mb-8">
              Remember it? <a href="/login" className="text-white hover:underline">Log in</a>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/50 text-xs block mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-2.5 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
