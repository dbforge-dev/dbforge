import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { adminPool } from './db'

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'] ?? ''
  const key = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!key) { res.status(401).json({ error: 'Unauthorized' }); return }

  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  const { rows } = await adminPool.query(
    `SELECT id, user_id FROM _dbforge.api_keys WHERE key_hash = $1`,
    [keyHash]
  )

  if (!rows.length) { res.status(401).json({ error: 'Invalid API key' }); return }

  // Update last_used_at async — don't block the request
  adminPool.query(
    `UPDATE _dbforge.api_keys SET last_used_at = NOW() WHERE id = $1`,
    [rows[0].id]
  ).catch(() => {})

  ;(req as any).userId = rows[0].user_id
  next()
}
