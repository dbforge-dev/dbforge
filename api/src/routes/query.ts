import { Router } from 'express'
import { Pool } from 'pg'

const router = Router()

// Connection pool cache per project connection string
const pools = new Map<string, Pool>()

function getPool(connectionString: string) {
  if (!pools.has(connectionString)) {
    pools.set(connectionString, new Pool({ connectionString, max: 3, ssl: { rejectUnauthorized: false } }))
  }
  return pools.get(connectionString)!
}

// POST /projects/:id/query
// Body: { connectionString: string, sql: string, params?: any[] }
router.post('/', async (req, res) => {
  const { connectionString, sql, params } = req.body

  if (!connectionString || !sql) {
    res.status(400).json({ error: 'connectionString and sql are required' })
    return
  }

  try {
    const pool = getPool(connectionString)
    const result = await pool.query(sql, params ?? [])
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
