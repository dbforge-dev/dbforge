import fetch from 'node-fetch'
import { getConfig } from './config.js'

async function request(method: string, path: string, body?: unknown) {
  const { apiUrl, apiKey } = getConfig()
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.error ?? res.statusText)
  return data
}

export const api = {
  createProject: (id?: string) =>
    request('POST', '/projects', id ? { id } : {}),

  deleteProject: (id: string) =>
    request('DELETE', `/projects/${id}`),

  query: (projectId: string, connectionString: string, sql: string, params?: any[]) =>
    request('POST', `/projects/${projectId}/query`, { connectionString, sql, params }),

  schema: (projectId: string) =>
    request('GET', `/projects/${projectId}/schema`),

  applyMigration: (projectId: string, connectionString: string, name: string, sql: string) =>
    request('POST', `/projects/${projectId}/migrations`, { connectionString, name, sql }),

  listMigrations: (projectId: string, connectionString: string) =>
    request('GET', `/projects/${projectId}/migrations?connectionString=${encodeURIComponent(connectionString)}`),
}
