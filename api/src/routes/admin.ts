import { Router } from 'express'
import { adminPool } from '../db'

const router = Router()

router.get('/stats', async (req, res) => {
  const secret = req.headers['x-admin-secret']
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  try {
    const [
      { rows: usersTotal },
      { rows: usersLast7 },
      { rows: usersByPlan },
      { rows: projectsTotal },
      { rows: projectsLast7 },
      { rows: mrrPlans },
    ] = await Promise.all([
      adminPool.query(`SELECT COUNT(*) FROM _dbforge.users`),
      adminPool.query(`SELECT COUNT(*) FROM _dbforge.users WHERE created_at > NOW() - INTERVAL '7 days'`),
      adminPool.query(`SELECT plan, COUNT(*) as count FROM _dbforge.users GROUP BY plan`),
      adminPool.query(`SELECT COUNT(*) FROM _dbforge.projects`),
      adminPool.query(`SELECT COUNT(*) FROM _dbforge.projects WHERE created_at > NOW() - INTERVAL '7 days'`),
      adminPool.query(`SELECT plan, COUNT(*) as count FROM _dbforge.users WHERE plan != 'hobby' GROUP BY plan`),
    ])

    const byPlan: Record<string, number> = {}
    for (const row of usersByPlan) {
      byPlan[row.plan] = Number(row.count)
    }

    let mrr = 0
    for (const row of mrrPlans) {
      const count = Number(row.count)
      if (row.plan === 'indie') mrr += count * 5
      else if (row.plan === 'builder') mrr += count * 15
    }

    res.json({
      users: {
        total: Number(usersTotal[0].count),
        last7days: Number(usersLast7[0].count),
        byPlan,
      },
      projects: {
        total: Number(projectsTotal[0].count),
        last7days: Number(projectsLast7[0].count),
      },
      mrr,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
