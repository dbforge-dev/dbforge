"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { getJwt, getApiKey, clearSession } from "../../lib/auth";

interface Project {
  id: string;
  schema_name: string;
  created_at: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs text-white/30 hover:text-white/60 transition-colors shrink-0"
    >
      {copied ? "copied!" : "copy"}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const [creating, setCreating] = useState(false);
  const [newConn, setNewConn] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jwt = getJwt();
    const key = getApiKey();
    if (!jwt || !key) { router.replace("/login"); return; }
    setApiKey(key);
    api.listProjects(key)
      .then(r => setProjects(r.projects))
      .catch(() => { clearSession(); router.replace("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function createProject() {
    if (!apiKey) return;
    setCreating(true);
    setError("");
    setNewConn(null);
    try {
      const id = newId.trim() || undefined;
      const p = await api.createProject(apiKey, id);
      setProjects(prev => [{ id: p.id, schema_name: p.schema, created_at: new Date().toISOString() }, ...prev]);
      setNewConn(p.connectionString);
      setNewId("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!apiKey) return;
    if (!confirm(`Delete project "${id}"? This is permanent.`)) return;
    try {
      await api.deleteProject(apiKey, id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (newConn?.includes(id)) setNewConn(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function logout() { clearSession(); router.push("/"); }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/30 text-sm">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-white font-semibold tracking-tight">dbforge</a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/dashboard/keys" className="text-white/50 hover:text-white transition-colors">API keys</a>
            <button onClick={logout} className="text-white/30 hover:text-white/60 transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header + create */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-bold">Projects</h1>
        </div>

        {/* Create form */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <p className="text-white/50 text-sm mb-4">Create a new database — ready in under a second.</p>
          <div className="flex gap-3">
            <input
              value={newId}
              onChange={e => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="project-name (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors font-mono"
            />
            <button
              onClick={createProject}
              disabled={creating}
              className="bg-white text-black px-5 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create project"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* New connection string banner */}
        {newConn && (
          <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-5 mb-6">
            <p className="text-green-400 text-sm font-semibold mb-2">✓ Project created — save your connection string</p>
            <p className="text-white/40 text-xs mb-3">This is the only time it&apos;s shown. Copy it now.</p>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5">
              <code className="text-white/70 text-xs font-mono flex-1 break-all">{newConn}</code>
              <CopyButton text={newConn} />
            </div>
          </div>
        )}

        {/* Your API key */}
        {apiKey && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <p className="text-white/50 text-xs mb-2">Your active API key</p>
            <div className="flex items-center gap-3">
              <code className="text-white/60 text-xs font-mono flex-1 break-all">{apiKey}</code>
              <CopyButton text={apiKey} />
            </div>
            <p className="text-white/25 text-xs mt-2">Use this with the CLI: <span className="font-mono">dbforge auth setup --url https://dbforge-api.fly.dev --key &lt;key&gt;</span></p>
          </div>
        )}

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="text-center py-20 text-white/20 text-sm">
            No projects yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-mono font-semibold text-sm">{p.id}</p>
                  <p className="text-white/30 text-xs mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => deleteProject(p.id)}
                  className="text-white/20 hover:text-red-400 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
