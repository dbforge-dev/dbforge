import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { adminPool } from '../db'
import { requireJwt } from './auth'
import { planFromPriceId, PLAN_LIMITS } from '../plans'

const router = Router()

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key)
}

// GET /billing/status — current plan + project count
router.get('/status', requireJwt, async (req: any, res) => {
  const { rows } = await adminPool.query(
    `SELECT u.plan,
            (SELECT COUNT(*) FROM _dbforge.projects WHERE user_id = u.id) AS project_count
     FROM _dbforge.users u WHERE u.id = $1`,
    [req.user.userId]
  )
  const user = rows[0]
  const plan = user?.plan ?? 'hobby'
  res.json({
    plan,
    projectCount: Number(user?.project_count ?? 0),
    limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
  })
})

// POST /billing/checkout — create Stripe Checkout session
router.post('/checkout', requireJwt, async (req: any, res) => {
  const { plan } = req.body
  const priceId = plan === 'indie' ? process.env.STRIPE_PRICE_INDIE : process.env.STRIPE_PRICE_BUILDER
  if (!priceId) { res.status(400).json({ error: 'Invalid plan' }); return }

  const { rows } = await adminPool.query(
    `SELECT email, stripe_customer_id FROM _dbforge.users WHERE id = $1`,
    [req.user.userId]
  )
  const user = rows[0]
  const s = stripe()

  // Reuse or create Stripe customer
  let customerId = user.stripe_customer_id
  if (!customerId) {
    const customer = await s.customers.create({ email: user.email, metadata: { userId: String(req.user.userId) } })
    customerId = customer.id
    await adminPool.query(`UPDATE _dbforge.users SET stripe_customer_id = $1 WHERE id = $2`, [customerId, req.user.userId])
  }

  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.WEB_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.WEB_URL}/dashboard`,
    metadata: { userId: String(req.user.userId) },
  })

  res.json({ url: session.url })
})

// POST /billing/portal — Stripe customer portal (manage/cancel)
router.post('/portal', requireJwt, async (req: any, res) => {
  const { rows } = await adminPool.query(
    `SELECT stripe_customer_id FROM _dbforge.users WHERE id = $1`,
    [req.user.userId]
  )
  const customerId = rows[0]?.stripe_customer_id
  if (!customerId) { res.status(400).json({ error: 'No billing account found' }); return }

  const session = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.WEB_URL}/dashboard`,
  })
  res.json({ url: session.url })
})

// POST /billing/webhook — Stripe events
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) { res.status(500).send('Webhook secret not set'); return }

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch {
    res.status(400).send('Invalid signature')
    return
  }

  const s = event.data.object as any

  switch (event.type) {
    case 'checkout.session.completed': {
      // Subscription created — fetch line items to get price
      const session = await stripe().checkout.sessions.retrieve(s.id, { expand: ['line_items'] })
      const priceId = session.line_items?.data[0]?.price?.id ?? ''
      const plan = planFromPriceId(priceId)
      const userId = session.metadata?.userId
      if (userId) {
        await adminPool.query(
          `UPDATE _dbforge.users SET plan = $1, stripe_subscription_id = $2 WHERE id = $3`,
          [plan, session.subscription, userId]
        )
      }
      break
    }
    case 'customer.subscription.updated': {
      const priceId = s.items?.data[0]?.price?.id ?? ''
      const plan = planFromPriceId(priceId)
      await adminPool.query(
        `UPDATE _dbforge.users SET plan = $1 WHERE stripe_subscription_id = $2`,
        [plan, s.id]
      )
      break
    }
    case 'customer.subscription.deleted': {
      await adminPool.query(
        `UPDATE _dbforge.users SET plan = 'hobby', stripe_subscription_id = NULL WHERE stripe_subscription_id = $1`,
        [s.id]
      )
      break
    }
  }

  res.json({ received: true })
})

export default router
