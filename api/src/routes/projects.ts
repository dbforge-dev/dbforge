import { Router } from 'express'
import { nanoid } from 'nanoid'
import { createProject, deleteProject } from '../provisioner'
import { adminPool } from '../db'
import { PLAN_LIMITS } from '../plans'

const router = Router()

router.post('/', async (req: any, res) => {
  const projectId = (req.body.id as string | undefined) ?? nanoid(10).toLowerCase().replace(/[^a-z0-9]/g, 'x')

  try {
    // Enforce plan limits
    const { rows: userRows } = await adminPool.query(
      `SELECT u.plan, COUNT(p.id) AS project_count
       FROM _dbforge.users u
       LEFT JOIN _dbforge.projects p ON p.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.plan`,
      [req.userId]
    )
    const plan = (userRows[0]?.plan ?? 'hobby') as keyof typeof PLAN_LIMITS
    const count = Number(userRows[0]?.project_count ?? 0)
    const limit = PLAN_LIMITS[plan]?.projects ?? 1

    if (count >= limit) {
      res.status(403).json({
        error: `Plan limit reached (${count}/${limit} projects on ${plan} plan). Upgrade to create more.`,
        upgradeRequired: true,
      })
      return
    }

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
