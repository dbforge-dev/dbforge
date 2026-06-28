export type Plan = 'hobby' | 'indie' | 'builder'

export const PLAN_LIMITS: Record<Plan, { projects: number; label: string; price: number }> = {
  hobby:   { projects: 1,  label: 'Hobby',   price: 0  },
  indie:   { projects: 3,  label: 'Indie',   price: 5  },
  builder: { projects: 10, label: 'Builder', price: 15 },
}

export function planFromPriceId(priceId: string): Plan {
  const map: Record<string, Plan> = {
    [process.env.STRIPE_PRICE_INDIE   ?? '']: 'indie',
    [process.env.STRIPE_PRICE_BUILDER ?? '']: 'builder',
  }
  return map[priceId] ?? 'hobby'
}
