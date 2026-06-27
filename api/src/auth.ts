import { Request, Response, NextFunction } from 'express'

// Simple bearer token auth — swap for a real DB-backed key lookup later
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'] ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token || token !== process.env.API_KEY_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
