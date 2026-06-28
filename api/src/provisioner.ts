import { adminPool } from './db'
import crypto from 'crypto'

function safeId(id: string) {
  // Only allow alphanumeric + underscore to prevent SQL injection in identifiers
  if (!/^[a-z0-9_]+$/.test(id)) throw new Error('Invalid project id')
  return id
}

function generatePassword() {
  return crypto.randomBytes(24).toString('base64url')
}

export interface Project {
  id: string
  schema: string
  role: string
  connectionString: string
}

export async function createProject(projectId: string): Promise<Project> {
  const schema = `proj_${safeId(projectId)}`
  const role = `role_${safeId(projectId)}`
  const password = generatePassword()

  const client = await adminPool.connect()
  try {
    await client.query('BEGIN')

    // Create schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)

    // Create role scoped to this schema only
    await client.query(`CREATE ROLE "${role}" WITH LOGIN PASSWORD '${password}'`)
    await client.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}"`)
    await client.query(`GRANT CREATE ON SCHEMA "${schema}" TO "${role}"`)
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT ALL ON TABLES TO "${role}"`
    )
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" GRANT ALL ON SEQUENCES TO "${role}"`
    )

    // Resource limits — prevent noisy neighbours
    await client.query(`ALTER ROLE "${role}" CONNECTION LIMIT 5`)
    await client.query(`ALTER ROLE "${role}" SET statement_timeout = '30s'`)
    await client.query(`ALTER ROLE "${role}" SET search_path = "${schema}"`)
    await client.query(`ALTER ROLE "${role}" SET work_mem = '16MB'`)

    // Migration tracking table in the new schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schema}"._migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`GRANT ALL ON "${schema}"._migrations TO "${role}"`)
    await client.query(`GRANT ALL ON "${schema}"._migrations_id_seq TO "${role}"`)

    await client.query('COMMIT')

    const url = new URL(process.env.DATABASE_URL!)
    const isFly = (process.env.DATABASE_URL ?? '').includes('sslmode=disable')
    const sslParam = isFly ? '&sslmode=disable' : ''
    const connectionString =
      `postgres://${role}:${password}@${url.host}${url.pathname}` +
      `?options=-csearch_path%3D"${schema}"${sslParam}`

    return { id: projectId, schema, role, connectionString }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteProject(projectId: string) {
  const schema = `proj_${safeId(projectId)}`
  const role = `role_${safeId(projectId)}`

  const client = await adminPool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await client.query(`DROP ROLE IF EXISTS "${role}"`)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
