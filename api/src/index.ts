import 'dotenv/config'
import express from 'express'
import { requireApiKey } from './auth'
import { bootstrapSystemTables } from './system'
import authRouter from './routes/auth'
import billingRouter from './routes/billing'
import projectsRouter from './routes/projects'
import queryRouter from './routes/query'
import schemaRouter from './routes/schema'
import migrationsRouter from './routes/migrations'

const app = express()

// Stripe webhook needs raw body — must be before express.json()
app.post('/billing/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  billingRouter(req, res, next)
})

app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// Public auth routes
app.use('/auth', authRouter)

// Billing status + checkout — requires JWT (not API key)
app.use('/billing', billingRouter)

// All project routes require API key
app.use(requireApiKey)
app.use('/projects', projectsRouter)
app.use('/projects/:projectId/query', (_req, _res, next) => { next() }, queryRouter)
app.use('/projects/:projectId/schema', (_req, _res, next) => { next() }, schemaRouter)
app.use('/projects/:projectId/migrations', (_req, _res, next) => { next() }, migrationsRouter)

const port = Number(process.env.PORT ?? 3000)

bootstrapSystemTables()
  .then(() => app.listen(port, () => console.log(`basely-api listening on :${port}`)))
  .catch(err => { console.error('Failed to bootstrap:', err); process.exit(1) })
