import { adminPool } from './db'

export async function bootstrapSystemTables() {
  const client = await adminPool.connect()
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS _dbforge`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS _dbforge.users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'hobby',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // Add billing columns if they don't exist (safe migration for existing installs)
    await client.query(`ALTER TABLE _dbforge.users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'hobby'`)
    await client.query(`ALTER TABLE _dbforge.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`)
    await client.query(`ALTER TABLE _dbforge.users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`)

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS _dbforge.password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES _dbforge.users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    console.log('System tables ready')
  } finally {
    client.release()
  }
}
