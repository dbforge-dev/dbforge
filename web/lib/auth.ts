"use client";

export function getJwt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("basely_jwt");
}

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("basely_api_key");
}

export function saveSession(jwt: string, apiKey: string) {
  localStorage.setItem("basely_jwt", jwt);
  localStorage.setItem("basely_api_key", apiKey);
}

export function clearSession() {
  localStorage.removeItem("basely_jwt");
  localStorage.removeItem("basely_api_key");
}
