"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "../components/AuthForm";
import { api } from "../../lib/api";
import { getApiKey, getJwt, saveSession } from "../../lib/auth";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (getJwt() && getApiKey()) router.replace("/dashboard");
  }, [router]);

  async function handleLogin(email: string, password: string) {
    const { token } = await api.login(email, password);
    // Fetch existing keys and use the first one, or create one
    const { keys } = await api.listKeys(token);
    let apiKey: string;
    if (keys.length > 0) {
      // Can't retrieve plaintext of existing keys — create a fresh session key
      const { key } = await api.createKey(token, "session");
      apiKey = key;
    } else {
      const { key } = await api.createKey(token, "default");
      apiKey = key;
    }
    saveSession(token, apiKey);
    router.push("/dashboard");
  }

  const resetSuccess = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "1";

  return (
    <>
      {resetSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-400/10 border border-green-400/20 text-green-400 text-sm px-5 py-3 rounded-xl z-50">
          Password reset — log in with your new password.
        </div>
      )}
      <AuthForm
        title="Welcome back"
        subtitle={<>No account? <a href="/signup" className="text-white hover:underline">Sign up free</a> · <a href="/forgot-password" className="text-white/50 hover:text-white transition-colors">Forgot password?</a></>}
        cta="Log in"
        onSubmit={handleLogin}
      />
    </>
  );
}
