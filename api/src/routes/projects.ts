import { Router } from 'express'
import { nanoid } from 'nanoid'
import { createProject, deleteProject } from '../provisioner'

const router = Router()

router.post('/', async (req, res) => {
  const projectId = (req.body.id as string | undefined) ?? nanoid(10).toLowerCase().replace(/[^a-z0-9]/g, 'x')

  try {
    const project = await createProject(projectId)
    res.status(201).json(project)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await deleteProject(req.params.id)
    res.json({ deleted: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

export default router
