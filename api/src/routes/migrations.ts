import { Router } from 'express'
import { Pool } from 'pg'

const router = Router()

// POST /projects/:id/migrations
// Body: { connectionString: string, name: string, sql: string }
router.post('/', async (req, res) => {
  const { connectionString, name, sql } = req.body

  if (!connectionString || !name || !sql) {
    res.status(400).json({ error: 'connectionString, name, and sql are required' })
    return
  }

  const pool = new Pool({ connectionString, max: 1, ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false } })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Check not already applied
    const { rows } = await client.query(
      'SELECT id FROM _migrations WHERE name = $1',
      [name]
    )
    if (rows.length > 0) {
      await client.query('ROLLBACK')
      res.status(409).json({ error: `Migration "${name}" already applied` })
      return
    }

    // Run the migration SQL
    await client.query(sql)

    // Record it
    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name])

    await client.query('COMMIT')
    res.json({ applied: name })
  } catch (err: any) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
    await pool.end()
  }
})

// GET /projects/:id/migrations
// Body: { connectionString: string }
router.get('/', async (req, res) => {
  const connectionString = req.query.connectionString as string
  if (!connectionString) {
    res.status(400).json({ error: 'connectionString query param required' })
    return
  }

  const pool = new Pool({ connectionString, max: 1, ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false } })
  try {
    const { rows } = await pool.query(
      'SELECT name, applied_at FROM _migrations ORDER BY applied_at'
    )
    res.json({ migrations: rows })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  } finally {
    await pool.end()
  }
})

export default router
