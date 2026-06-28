"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { getJwt, clearSession } from "../../../lib/auth";

interface Key {
  id: number;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export default function KeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<Key[]>([]);
  const [jwt, setJwt] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getJwt();
    if (!token) { router.replace("/login"); return; }
    setJwt(token);
    api.listKeys(token)
      .then(r => setKeys(r.keys))
      .catch(() => { clearSession(); router.replace("/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  async function createKey() {
    if (!jwt) return;
    setCreating(true);
    setNewKey(null);
    try {
      const name = newKeyName.trim() || "default";
      const { key } = await api.createKey(jwt, name);
      setNewKey(key);
      setNewKeyName("");
      const r = await api.listKeys(jwt);
      setKeys(r.keys);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: number) {
    if (!jwt) return;
    if (!confirm("Revoke this key? Any CLI or agent using it will stop working.")) return;
    await api.deleteKey(jwt, id);
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/30 text-sm">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-white font-semibold tracking-tight">basely</a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/dashboard" className="text-white/50 hover:text-white transition-colors">Projects</a>
            <button onClick={() => { clearSession(); router.push("/"); }} className="text-white/30 hover:text-white/60 transition-colors">Log out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-white text-2xl font-bold mb-8">API Keys</h1>

        {/* Create key */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <p className="text-white/50 text-sm mb-4">Create a new API key for the CLI or your agent.</p>
          <div className="flex gap-3">
            <input
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. laptop, agent)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              onClick={createKey}
              disabled={creating}
              className="bg-white text-black px-5 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {creating ? "..." : "Create key"}
            </button>
          </div>
        </div>

        {/* New key reveal */}
        {newKey && (
          <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-5 mb-6">
            <p className="text-green-400 text-sm font-semibold mb-1">✓ Key created — copy it now</p>
            <p className="text-white/40 text-xs mb-3">This is shown once. We don&apos;t store the plaintext.</p>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5">
              <code className="text-white/80 text-xs font-mono flex-1 break-all">{newKey}</code>
              <button
                onClick={() => copy(newKey)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors shrink-0"
              >
                {copied ? "copied!" : "copy"}
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        {keys.length === 0 ? (
          <div className="text-center py-20 text-white/20 text-sm">No API keys yet.</div>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <div key={k.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-white font-mono text-sm">{k.key_prefix}...</code>
                    <span className="text-white/30 text-xs">{k.name}</span>
                  </div>
                  <p className="text-white/25 text-xs mt-1">
                    Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => revokeKey(k.id)}
                  className="text-white/20 hover:text-red-400 transition-colors text-sm shrink-0"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
