"use client";

export function getJwt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dbforge_jwt");
}

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dbforge_api_key");
}

export function saveSession(jwt: string, apiKey: string) {
  localStorage.setItem("dbforge_jwt", jwt);
  localStorage.setItem("dbforge_api_key", apiKey);
}

export function clearSession() {
  localStorage.removeItem("dbforge_jwt");
  localStorage.removeItem("dbforge_api_key");
}
