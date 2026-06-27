import { Pool } from 'pg'

// Admin pool — superuser, used only for provisioning
export const adminPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
})

// Return a pool scoped to a specific project schema
export function projectPool(connectionString: string) {
  return new Pool({ connectionString, max: 3 })
}
