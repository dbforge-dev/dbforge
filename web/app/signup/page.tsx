"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "../components/AuthForm";
import { api } from "../../lib/api";
import { saveSession } from "../../lib/auth";

export default function SignupPage() {
  const router = useRouter();

  async function handleSignup(email: string, password: string) {
    const { token } = await api.signup(email, password);
    // Auto-create a default API key on signup
    const { key } = await api.createKey(token, "default");
    saveSession(token, key);
    router.push("/dashboard");
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle={<>Already have one? <a href="/login" className="text-white hover:underline">Log in</a></>}
      cta="Create account"
      onSubmit={handleSignup}
    />
  );
}
