import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { adminPool } from '../db'

const router = Router()

function jwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not set')
  return s
}

function requireJwt(req: any, res: any, next: any) {
  const header = req.headers['authorization'] ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return }
  try {
    req.user = jwt.verify(token, jwtSecret())
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return }
  if (password.length < 8) { res.status(400).json({ error: 'Password must be at least 8 characters' }); return }

  const hash = await bcrypt.hash(password, 10)
  try {
    const { rows } = await adminPool.query(
      `INSERT INTO _dbforge.users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email.toLowerCase(), hash]
    )
    const user = rows[0]
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: '30d' })
    res.status(201).json({ user: { id: user.id, email: user.email }, token })
  } catch (err: any) {
    if (err.code === '23505') { res.status(409).json({ error: 'Email already registered' }); return }
    throw err
  }
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return }

  const { rows } = await adminPool.query(
    `SELECT id, email, password_hash FROM _dbforge.users WHERE email = $1`,
    [email.toLowerCase()]
  )
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: '30d' })
  res.json({ user: { id: user.id, email: user.email }, token })
})

// POST /auth/keys — create API key
router.post('/keys', requireJwt, async (req: any, res) => {
  const { name = 'default' } = req.body
  const rawKey = `dbf_${crypto.randomBytes(32).toString('base64url')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12)

  await adminPool.query(
    `INSERT INTO _dbforge.api_keys (user_id, key_hash, key_prefix, name) VALUES ($1, $2, $3, $4)`,
    [req.user.userId, keyHash, keyPrefix, name]
  )

  // Return raw key once — never stored in plaintext
  res.status(201).json({ key: rawKey, prefix: keyPrefix, name })
})

// GET /auth/keys — list keys (prefix only)
router.get('/keys', requireJwt, async (req: any, res) => {
  const { rows } = await adminPool.query(
    `SELECT id, key_prefix, name, created_at, last_used_at FROM _dbforge.api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.userId]
  )
  res.json({ keys: rows })
})

// DELETE /auth/keys/:id — revoke key
router.delete('/keys/:id', requireJwt, async (req: any, res) => {
  const { rowCount } = await adminPool.query(
    `DELETE FROM _dbforge.api_keys WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.userId]
  )
  if (!rowCount) { res.status(404).json({ error: 'Key not found' }); return }
  res.json({ revoked: true })
})

export { requireJwt }
export default router
