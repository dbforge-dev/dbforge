import 'dotenv/config'
import express from 'express'
import { requireApiKey } from './auth'
import projectsRouter from './routes/projects'
import queryRouter from './routes/query'
import schemaRouter from './routes/schema'
import migrationsRouter from './routes/migrations'

const app = express()
app.use(express.json())
app.use(requireApiKey)

app.use('/projects', projectsRouter)

// Routes that need projectId param threaded through
app.use('/projects/:projectId/query', (req, _res, next) => {
  // make projectId available to nested routers
  next()
}, queryRouter)

app.use('/projects/:projectId/schema', (req, _res, next) => {
  next()
}, schemaRouter)

app.use('/projects/:projectId/migrations', (req, _res, next) => {
  next()
}, migrationsRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => console.log(`dbforge-api listening on :${port}`))
