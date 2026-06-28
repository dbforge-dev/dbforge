import { adminPool } from './db'

// Bootstrap system tables in a _dbforge schema on first boot
export async function bootstrapSystemTables() {
  const client = await adminPool.connect()
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS _dbforge`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS _dbforge.users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS _dbforge.api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES _dbforge.users(id) ON DELETE CASCADE,
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'default',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMPTZ
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS _dbforge.projects (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES _dbforge.users(id) ON DELETE CASCADE,
        schema_name TEXT NOT NULL,
        role_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    console.log('System tables ready')
  } finally {
    client.release()
  }
}
