"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { getJwt, getApiKey, clearSession } from "../../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://dbforge-api.fly.dev";

interface Project { id: string; schema_name: string; created_at: string }
interface BillingStatus { plan: string; projectCount: number; limit: { projects: number; label: string } }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-white/30 hover:text-white/60 transition-colors shrink-0">
      {copied ? "copied!" : "copy"}
    </button>
  );
}

const PLAN_BADGE: Record<string, string> = {
  hobby: "bg-white/10 text-white/40",
  indie: "bg-blue-400/10 text-blue-400",
  builder: "bg-purple-400/10 text-purple-400",
};

export default function DashboardPage() {
  return <Suspense><Dashboard /></Suspense>
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const [creating, setCreating] = useState(false);
  const [newConn, setNewConn] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const upgraded = searchParams.get("upgraded") === "1";

  useEffect(() => {
    const jwt = getJwt();
    const key = getApiKey();
    if (!jwt || !key) { router.replace("/login"); return; }
    setApiKey(key);

    Promise.all([
      api.listProjects(key),
      fetch(`${API}/billing/status`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json()),
    ]).then(([proj, bill]) => {
      setProjects(proj.projects);
      setBilling(bill);
    }).catch(() => { clearSession(); router.replace("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function createProject() {
    if (!apiKey) return;
    setCreating(true); setError(""); setNewConn(null);
    try {
      const p = await api.createProject(apiKey, newId.trim() || undefined);
      setProjects(prev => [{ id: p.id, schema_name: p.schema, created_at: new Date().toISOString() }, ...prev]);
      setNewConn(p.connectionString);
      setNewId("");
      if (billing) setBilling({ ...billing, projectCount: billing.projectCount + 1 });
    } catch (err: any) {
      if (err.message?.includes("upgradeRequired") || err.message?.includes("Plan limit")) {
        setError("upgrade");
      } else {
        setError(err.message);
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!apiKey || !confirm(`Delete "${id}"? This is permanent.`)) return;
    await api.deleteProject(apiKey, id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (newConn?.includes(id)) setNewConn(null);
    if (billing) setBilling({ ...billing, projectCount: Math.max(0, billing.projectCount - 1) });
  }

  async function upgrade(plan: string) {
    const jwt = getJwt();
    if (!jwt) return;
    setUpgrading(plan);
    try {
      const res = await fetch(`${API}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setUpgrading(null);
    }
  }

  async function manageSubscription() {
    const jwt = getJwt();
    if (!jwt) return;
    const res = await fetch(`${API}/billing/portal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/30 text-sm">Loading...</div>
    </div>
  );

  const atLimit = billing ? billing.projectCount >= billing.limit.projects : false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-white font-semibold tracking-tight">basely</a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/dashboard/keys" className="text-white/50 hover:text-white transition-colors">API keys</a>
            <button onClick={() => { clearSession(); router.push("/"); }} className="text-white/30 hover:text-white/60 transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Upgraded banner */}
        {upgraded && (
          <div className="bg-green-400/10 border border-green-400/20 rounded-xl px-5 py-4 mb-6 text-green-400 text-sm font-medium">
            ✓ Plan upgraded successfully — your new limits are active.
          </div>
        )}

        {/* Plan bar */}
        {billing && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${PLAN_BADGE[billing.plan] ?? PLAN_BADGE.hobby}`}>
                {billing.limit.label}
              </span>
              <span className="text-white/40 text-sm">
                {billing.projectCount} / {billing.limit.projects} projects
              </span>
              <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/40 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (billing.projectCount / billing.limit.projects) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {billing.plan === 'hobby' && (
                <>
                  <button onClick={() => upgrade('indie')} disabled={!!upgrading}
                    className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50">
                    {upgrading === 'indie' ? '...' : 'Indie $5/mo'}
                  </button>
                  <button onClick={() => upgrade('builder')} disabled={!!upgrading}
                    className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50">
                    {upgrading === 'builder' ? '...' : 'Builder $15/mo'}
                  </button>
                </>
              )}
              {billing.plan === 'indie' && (
                <>
                  <button onClick={() => upgrade('builder')} disabled={!!upgrading}
                    className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50">
                    {upgrading === 'builder' ? '...' : 'Upgrade to Builder'}
                  </button>
                  <button onClick={manageSubscription} className="text-xs text-white/30 hover:text-white/60 transition-colors">Manage</button>
                </>
              )}
              {billing.plan === 'builder' && (
                <button onClick={manageSubscription} className="text-xs text-white/30 hover:text-white/60 transition-colors">Manage subscription</button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl font-bold">Projects</h1>
        </div>

        {/* Create form */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <p className="text-white/50 text-sm mb-4">Create a new database — ready in under a second.</p>
          <div className="flex gap-3">
            <input value={newId} onChange={e => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="project-name (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors font-mono" />
            <button onClick={createProject} disabled={creating || atLimit}
              className="bg-white text-black px-5 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50">
              {creating ? "Creating..." : "Create project"}
            </button>
          </div>

          {error === "upgrade" && (
            <div className="mt-3 flex items-center gap-3 bg-orange-400/10 border border-orange-400/20 rounded-lg px-4 py-3">
              <p className="text-orange-400 text-sm flex-1">You&apos;ve hit your plan limit.</p>
              <button onClick={() => upgrade('indie')} className="text-xs bg-orange-400 text-black px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-300 transition-colors">
                Upgrade →
              </button>
            </div>
          )}
          {error && error !== "upgrade" && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* New connection string */}
        {newConn && (
          <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-5 mb-6">
            <p className="text-green-400 text-sm font-semibold mb-1">✓ Project created — save your connection string</p>
            <p className="text-white/40 text-xs mb-3">Shown once. Copy it now.</p>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5">
              <code className="text-white/70 text-xs font-mono flex-1 break-all">{newConn}</code>
              <CopyButton text={newConn} />
            </div>
          </div>
        )}

        {/* API key */}
        {apiKey && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <p className="text-white/40 text-xs mb-2">Your active API key</p>
            <div className="flex items-center gap-3">
              <code className="text-white/60 text-xs font-mono flex-1 break-all">{apiKey}</code>
              <CopyButton text={apiKey} />
            </div>
            <p className="text-white/20 text-xs mt-2 font-mono">basely auth setup --url https://api.basely.cc --key &lt;key&gt;</p>
          </div>
        )}

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="text-center py-20 text-white/20 text-sm">No projects yet. Create your first one above.</div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-mono font-semibold text-sm">{p.id}</p>
                  <p className="text-white/30 text-xs mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteProject(p.id)} className="text-white/20 hover:text-red-400 transition-colors text-sm">Delete</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
