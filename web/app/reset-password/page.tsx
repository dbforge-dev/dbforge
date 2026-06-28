"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://dbforge-api.fly.dev";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return; }
      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-red-400 text-sm">Invalid reset link. <a href="/forgot-password" className="underline">Request a new one</a>.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-white/50 text-xs block mb-1.5">New password</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="min 8 characters"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>
      <div>
        <label className="text-white/50 text-xs block mb-1.5">Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="same as above"
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
        {loading ? "..." : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <a href="/" className="text-white font-semibold text-xl mb-10 tracking-tight">basely</a>
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-white text-2xl font-bold mb-1">New password</h1>
        <p className="text-white/40 text-sm mb-8">Choose a strong password for your account.</p>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
