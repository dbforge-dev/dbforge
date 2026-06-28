import { Router } from 'express'
import { nanoid } from 'nanoid'
import { createProject, deleteProject } from '../provisioner'
import { adminPool } from '../db'

const router = Router()

router.post('/', async (req: any, res) => {
  const projectId = (req.body.id as string | undefined) ?? nanoid(10).toLowerCase().replace(/[^a-z0-9]/g, 'x')

  try {
    const project = await createProject(projectId)

    await adminPool.query(
      `INSERT INTO _dbforge.projects (id, user_id, schema_name, role_name) VALUES ($1, $2, $3, $4)`,
      [project.id, req.userId, project.schema, project.role]
    )

    res.status(201).json(project)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/', async (req: any, res) => {
  const { rows } = await adminPool.query(
    `SELECT id, schema_name, created_at FROM _dbforge.projects WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  )
  res.json({ projects: rows })
})

router.delete('/:id', async (req: any, res) => {
  // Verify ownership before deleting
  const { rows } = await adminPool.query(
    `SELECT id FROM _dbforge.projects WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId]
  )
  if (!rows.length) { res.status(404).json({ error: 'Project not found' }); return }

  try {
    await deleteProject(req.params.id)
    await adminPool.query(`DELETE FROM _dbforge.projects WHERE id = $1`, [req.params.id])
    res.json({ deleted: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
