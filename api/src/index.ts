import 'dotenv/config'
import express from 'express'
import { requireApiKey } from './auth'
import { bootstrapSystemTables } from './system'
import authRouter from './routes/auth'
import projectsRouter from './routes/projects'
import queryRouter from './routes/query'
import schemaRouter from './routes/schema'
import migrationsRouter from './routes/migrations'

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// Auth routes — no API key required
app.use('/auth', authRouter)

// All other routes require a valid per-user API key
app.use(requireApiKey)
app.use('/projects', projectsRouter)

app.use('/projects/:projectId/query', (req, _res, next) => { next() }, queryRouter)
app.use('/projects/:projectId/schema', (req, _res, next) => { next() }, schemaRouter)
app.use('/projects/:projectId/migrations', (req, _res, next) => { next() }, migrationsRouter)

const port = Number(process.env.PORT ?? 3000)

bootstrapSystemTables()
  .then(() => app.listen(port, () => console.log(`dbforge-api listening on :${port}`)))
  .catch(err => { console.error('Failed to bootstrap:', err); process.exit(1) })
