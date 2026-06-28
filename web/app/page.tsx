import { CodeBlock } from "./components/CodeBlock";

const QUICKSTART = `# Install
npm install -g dbforge

# Configure
dbforge auth setup --url https://dbforge-api.fly.dev --key <your-key>

# Create a database (< 1 second)
dbforge projects create myapp

# Run a migration
dbforge migration push myapp --name 001_init --file schema.sql

# Generate TypeScript types
dbforge gen types myapp --out src/db.ts`;

const MCP_CONFIG = `// claude_desktop_config.json
{
  "mcpServers": {
    "dbforge": {
      "command": "node",
      "args": ["/path/to/dbforge-mcp/dist/index.js"],
      "env": {
        "DBFORGE_API_URL": "https://dbforge-api.fly.dev",
        "DBFORGE_API_KEY": "dbf_..."
      }
    }
  }
}`;

const AGENT_LOOP = `# Claude can now call these tools with no human steps:
create_project     → spins up a DB, returns connection string
apply_migration    → runs your schema SQL
execute_sql        → queries and inserts data
get_schema         → introspects tables for context
gen_types          → outputs TypeScript interfaces
delete_project     → tears it all down`;

const API_ROUTES = [
  { method: "POST",   path: "/auth/signup",               desc: "Create account → JWT" },
  { method: "POST",   path: "/auth/login",                desc: "Login → JWT" },
  { method: "POST",   path: "/auth/keys",                 desc: "Generate API key (use JWT)" },
  { method: "GET",    path: "/auth/keys",                 desc: "List API keys" },
  { method: "POST",   path: "/projects",                  desc: "Provision database → connection string" },
  { method: "GET",    path: "/projects",                  desc: "List your projects" },
  { method: "POST",   path: "/projects/:id/query",        desc: "Execute SQL" },
  { method: "GET",    path: "/projects/:id/schema",       desc: "Introspect schema" },
  { method: "POST",   path: "/projects/:id/migrations",   desc: "Apply named migration" },
  { method: "GET",    path: "/projects/:id/migrations",   desc: "List applied migrations" },
  { method: "DELETE", path: "/projects/:id",              desc: "Drop project + schema" },
];

const PLANS = [
  { name: "Hobby",   price: "$0",  period: "forever",    features: ["1 project", "500 MB storage", "Never pauses", "Community support"], cta: "Start free",   highlight: false },
  { name: "Indie",   price: "$5",  period: "/ month",    features: ["3 projects", "2 GB storage",  "Never pauses", "Email support"],      cta: "Get started", highlight: true  },
  { name: "Builder", price: "$15", period: "/ month",    features: ["10 projects","10 GB storage", "Never pauses", "Priority support"],   cta: "Get started", highlight: false },
];

const FEATURES = [
  { icon: "⚡", title: "Sub-second provisioning", body: "Schema-per-tenant on a shared cluster. No container spin-up, no waiting. Your DB is ready before your next line of code." },
  { icon: "🤖", title: "MCP-native",              body: "7 tools Claude and Cursor can call directly. create_project, execute_sql, gen_types — zero human steps from idea to running DB." },
  { icon: "💸", title: "Indie-friendly pricing",  body: "Free tier never pauses after 7 days. Paid tier starts at $5/mo. No surprise bills from forgotten databases." },
];

const methodColor: Record<string, string> = {
  GET: "text-blue-400",
  POST: "text-green-400",
  DELETE: "text-red-400",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed]">

      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-white font-semibold text-lg tracking-tight">dbforge</span>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <a href="#docs"    className="hover:text-white transition-colors">Docs</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com/dbforge-dev/dbforge" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://dbforge-api.fly.dev" className="bg-white text-black px-4 py-1.5 rounded-md font-medium hover:bg-white/90 transition-colors">
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-1 rounded-full mb-6 font-mono">
          open source · MCP-ready · self-hostable
        </div>
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          Postgres in under a second.<br />
          <span className="text-white/40">For AI agents and indie devs.</span>
        </h1>
        <p className="text-white/50 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          dbforge provisions isolated Postgres databases instantly — no containers, no waiting.
          Claude, Cursor, and your CLI can create databases, run migrations, and generate TypeScript types without any human steps.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="#docs" className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors">
            Quickstart →
          </a>
          <a href="https://github.com/dbforge-dev/dbforge" target="_blank" rel="noopener" className="border border-white/20 text-white/60 px-6 py-3 rounded-lg font-medium hover:border-white/40 hover:text-white transition-colors">
            View on GitHub
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map(f => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Docs */}
      <section id="docs" className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-white mb-2">Quickstart</h2>
        <p className="text-white/40 mb-10">Up and running in 2 minutes.</p>

        <div className="space-y-10">
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded font-mono">1</span>
              CLI
            </h3>
            <CodeBlock code={QUICKSTART} lang="bash" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded font-mono">2</span>
              MCP — Claude & Cursor
            </h3>
            <CodeBlock code={MCP_CONFIG} lang="json" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="bg-white/10 text-white/50 text-xs px-2 py-0.5 rounded font-mono">3</span>
              What your agent can do
            </h3>
            <CodeBlock code={AGENT_LOOP} lang="bash" />
          </div>
        </div>

        {/* API reference */}
        <div className="mt-16">
          <h3 className="text-white font-semibold text-xl mb-6">REST API</h3>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            {API_ROUTES.map((r, i) => (
              <div key={r.path} className={`flex items-center gap-4 px-5 py-3 ${i < API_ROUTES.length - 1 ? "border-b border-white/5" : ""}`}>
                <span className={`text-xs font-mono font-bold w-14 shrink-0 ${methodColor[r.method]}`}>{r.method}</span>
                <code className="text-white/70 text-sm font-mono flex-1">{r.path}</code>
                <span className="text-white/30 text-sm hidden md:block">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-white mb-2">Pricing</h2>
        <p className="text-white/40 mb-10">No credit card required to start.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => (
            <div key={p.name} className={`rounded-xl p-6 border ${p.highlight ? "bg-white text-black border-white" : "bg-white/5 border-white/10"}`}>
              <div className={`text-sm font-medium mb-1 ${p.highlight ? "text-black/50" : "text-white/40"}`}>{p.name}</div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className={`text-4xl font-bold ${p.highlight ? "text-black" : "text-white"}`}>{p.price}</span>
                <span className={`text-sm ${p.highlight ? "text-black/40" : "text-white/30"}`}>{p.period}</span>
              </div>
              <ul className="space-y-2 mb-8">
                {p.features.map(f => (
                  <li key={f} className={`text-sm flex items-center gap-2 ${p.highlight ? "text-black/70" : "text-white/50"}`}>
                    <span className={p.highlight ? "text-black/40" : "text-white/30"}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="https://dbforge-api.fly.dev" className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                p.highlight
                  ? "bg-black text-white hover:bg-black/80"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}>{p.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-white/30 text-sm">
          <span className="font-medium">dbforge</span>
          <div className="flex gap-6">
            <a href="https://github.com/dbforge-dev/dbforge" target="_blank" rel="noopener" className="hover:text-white/60 transition-colors">GitHub</a>
            <a href="mailto:hello@dbforge.dev" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
