import { Pool } from 'pg'

// Fly Postgres uses sslmode=disable on internal network; RDS requires SSL
function sslConfig(connectionString: string) {
  return connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
}

// Admin pool — superuser, used only for provisioning
export const adminPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ssl: sslConfig(process.env.DATABASE_URL ?? ''),
})

// Return a pool scoped to a specific project schema
export function projectPool(connectionString: string) {
  return new Pool({ connectionString, max: 3, ssl: sslConfig(connectionString) })
}
