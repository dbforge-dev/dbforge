const API = process.env.NEXT_PUBLIC_API_URL ?? "https://dbforge-api.fly.dev";

async function request(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

export const api = {
  signup: (email: string, password: string) =>
    request("POST", "/auth/signup", { email, password }),

  login: (email: string, password: string) =>
    request("POST", "/auth/login", { email, password }),

  createKey: (jwt: string, name: string) =>
    request("POST", "/auth/keys", { name }, jwt),

  listKeys: (jwt: string) =>
    request("GET", "/auth/keys", undefined, jwt),

  deleteKey: (jwt: string, id: number) =>
    request("DELETE", `/auth/keys/${id}`, undefined, jwt),

  listProjects: (apiKey: string) =>
    request("GET", "/projects", undefined, apiKey),

  createProject: (apiKey: string, id?: string) =>
    request("POST", "/projects", id ? { id } : {}, apiKey),

  deleteProject: (apiKey: string, id: string) =>
    request("DELETE", `/projects/${id}`, undefined, apiKey),
};
