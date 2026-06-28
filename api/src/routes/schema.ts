import { Router } from 'express'
import { adminPool } from '../db'

const router = Router({ mergeParams: true })

// GET /projects/:id/schema
// Returns tables + columns for the project schema — useful for AI context
router.get('/', async (req: any, res) => {
  const schema = `proj_${req.params.projectId}`

  try {
    const { rows } = await adminPool.query(
      `
      SELECT
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.tables t
      JOIN information_schema.columns c
        ON c.table_schema = t.table_schema AND c.table_name = t.table_name
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
        AND t.table_name != '_migrations'
      ORDER BY t.table_name, c.ordinal_position
      `,
      [schema]
    )

    // Group into { tableName: columns[] }
    const tables: Record<string, any[]> = {}
    for (const row of rows) {
      if (!tables[row.table_name]) tables[row.table_name] = []
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
      })
    }

    res.json({ schema, tables })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
