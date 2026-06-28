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
  const rawKey = `bly_${crypto.randomBytes(32).toString('base64url')}`
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

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) { res.json({ ok: true }); return }

  const { rows } = await adminPool.query(
    `SELECT id FROM _dbforge.users WHERE email = $1`,
    [email.toLowerCase()]
  )
  const user = rows[0]

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    await adminPool.query(
      `INSERT INTO _dbforge.password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.id, tokenHash]
    )

    const webUrl = process.env.WEB_URL ?? 'https://basely.cc'
    const resetUrl = `${webUrl}/reset-password?token=${rawToken}`

    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'basely <noreply@basely.cc>',
          to: [email],
          subject: 'Reset your basely password',
          html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
        }),
      })
    } else {
      console.log(`[forgot-password] Reset URL (RESEND_API_KEY not set): ${resetUrl}`)
    }
  }

  res.json({ ok: true })
})

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) { res.status(400).json({ error: 'token and password required' }); return }
  if (password.length < 8) { res.status(400).json({ error: 'Password must be at least 8 characters' }); return }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const { rows } = await adminPool.query(
    `SELECT id, user_id FROM _dbforge.password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  )
  const record = rows[0]
  if (!record) { res.status(400).json({ error: 'Invalid or expired token' }); return }

  const passwordHash = await bcrypt.hash(password, 10)

  await adminPool.query(
    `UPDATE _dbforge.users SET password_hash = $1 WHERE id = $2`,
    [passwordHash, record.user_id]
  )
  await adminPool.query(
    `UPDATE _dbforge.password_reset_tokens SET used_at = NOW() WHERE id = $1`,
    [record.id]
  )

  res.json({ ok: true })
})

export { requireJwt }
export default router
