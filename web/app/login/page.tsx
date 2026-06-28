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

  return (
    <AuthForm
      title="Welcome back"
      subtitle={<>No account? <a href="/signup" className="text-white hover:underline">Sign up free</a></>}
      cta="Log in"
      onSubmit={handleLogin}
    />
  );
}
