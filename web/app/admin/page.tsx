"use client"

import { useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://dbforge-api.fly.dev"

interface Stats {
  users: {
    total: number
    last7days: number
    byPlan: Record<string, number>
  }
  projects: {
    total: number
    last7days: number
  }
  mrr: number
}

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { "x-admin-secret": secret },
      })

      if (res.status === 403) {
        setError("Wrong secret")
        setSubmitted(false)
        return
      }

      const data = await res.json()
      setStats(data)
    } catch {
      setError("Request failed")
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">

        {!stats ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-white mb-6">basely admin</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/40 mb-1.5">Admin secret</label>
                <input
                  type="password"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || submitted}
                className="w-full bg-white text-black py-2.5 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading…" : "View stats"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white mb-8">basely admin</h1>
            <div className="grid grid-cols-2 gap-4">

              {/* Users */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-sm text-white/40 mb-1">Users</div>
                <div className="text-4xl font-bold text-white mb-1">{stats.users.total}</div>
                <div className="text-sm text-white/40">+{stats.users.last7days} last 7 days</div>
              </div>

              {/* Plans */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-sm text-white/40 mb-3">Plans</div>
                <div className="space-y-1.5">
                  {["hobby", "indie", "builder"].map(plan => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="text-sm text-white/40 capitalize">{plan}</span>
                      <span className="text-sm font-semibold text-white">{stats.users.byPlan[plan] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-sm text-white/40 mb-1">Projects</div>
                <div className="text-4xl font-bold text-white mb-1">{stats.projects.total}</div>
                <div className="text-sm text-white/40">+{stats.projects.last7days} last 7 days</div>
              </div>

              {/* MRR */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-sm text-white/40 mb-1">MRR</div>
                <div className="text-4xl font-bold text-white">${stats.mrr}</div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}
