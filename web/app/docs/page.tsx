"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "cli-reference", label: "CLI Reference" },
  { id: "mcp-ai-agents", label: "MCP / AI Agents" },
  { id: "rest-api", label: "REST API" },
  { id: "plans-billing", label: "Plans & Billing" },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm font-mono text-white/80 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-semibold text-white mb-6 pt-2 scroll-mt-24">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-medium text-white/90 mb-3 mt-8">{children}</h3>;
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-white/60 leading-relaxed mb-4">{children}</p>;
}

const API_ROUTES = [
  { method: "POST",   path: "/auth/signup",              auth: "—",       desc: "Create account" },
  { method: "POST",   path: "/auth/login",               auth: "—",       desc: "Get JWT" },
  { method: "POST",   path: "/auth/forgot-password",     auth: "—",       desc: "Send reset email" },
  { method: "POST",   path: "/auth/reset-password",      auth: "—",       desc: "Reset with token" },
  { method: "POST",   path: "/auth/keys",                auth: "JWT",     desc: "Create API key" },
  { method: "GET",    path: "/auth/keys",                auth: "JWT",     desc: "List API keys" },
  { method: "DELETE", path: "/auth/keys/:id",            auth: "JWT",     desc: "Revoke key" },
  { method: "GET",    path: "/projects",                 auth: "API key", desc: "List projects" },
  { method: "POST",   path: "/projects",                 auth: "API key", desc: "Create project" },
  { method: "DELETE", path: "/projects/:id",             auth: "API key", desc: "Delete project" },
  { method: "POST",   path: "/projects/:id/query",       auth: "API key", desc: "Execute SQL" },
  { method: "GET",    path: "/projects/:id/schema",      auth: "API key", desc: "Get schema" },
  { method: "POST",   path: "/projects/:id/migrations",  auth: "API key", desc: "Apply migration" },
  { method: "GET",    path: "/projects/:id/migrations",  auth: "API key", desc: "List migrations" },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "text-emerald-400",
  POST:   "text-blue-400",
  DELETE: "text-red-400",
};

const PLANS = [
  { name: "Hobby",   price: "Free",   projects: "1" },
  { name: "Indie",   price: "$5/mo",  projects: "3" },
  { name: "Builder", price: "$15/mo", projects: "10" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-white tracking-tight text-lg">
            basely
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="text-sm bg-white text-black font-medium px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              Sign up free
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-white/60 hover:text-white"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label="Toggle nav"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <nav className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === id ? "text-white bg-white/8" : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-[220px] shrink-0">
          <nav className="sticky top-20 pt-10 pb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4 px-3">
              Documentation
            </p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(({ id, label }) => (
                <li key={id}>
                  <button
                    onClick={() => scrollTo(id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSection === id
                        ? "text-white bg-white/8 font-medium"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pt-10 pb-24">

          {/* Getting Started */}
          <section className="mb-16">
            <SectionHeading id="getting-started">Getting Started</SectionHeading>
            <Prose>Get a Postgres database running in under a minute.</Prose>

            <SubHeading>1. Sign up</SubHeading>
            <Prose>
              Create an account at{" "}
              <a href="https://basely.cc" className="text-white/80 underline underline-offset-2 hover:text-white">
                basely.cc
              </a>
              .
            </Prose>

            <SubHeading>2. Get your API key</SubHeading>
            <Prose>Copy your API key from the dashboard. Keep it secret — treat it like a password.</Prose>

            <SubHeading>3. Install the CLI</SubHeading>
            <CodeBlock>npm install -g @basely-cli/cli</CodeBlock>

            <SubHeading>4. Connect</SubHeading>
            <CodeBlock>basely auth setup --url https://api.basely.cc --key &lt;your-key&gt;</CodeBlock>

            <SubHeading>5. Create a project</SubHeading>
            <CodeBlock>{`basely projects create myapp
→ Returns a Postgres connection string. Save it — shown once.`}</CodeBlock>

            <SubHeading>6. Run a migration</SubHeading>
            <CodeBlock>basely migration push myapp --name 001_init --file ./schema.sql</CodeBlock>
          </section>

          {/* CLI Reference */}
          <section className="mb-16">
            <SectionHeading id="cli-reference">CLI Reference</SectionHeading>
            <Prose>All available commands.</Prose>

            <SubHeading>Auth</SubHeading>
            <CodeBlock>basely auth setup --url &lt;url&gt; --key &lt;key&gt;</CodeBlock>

            <SubHeading>Projects</SubHeading>
            <CodeBlock>{`basely projects create [id]
basely projects list
basely projects delete <id>`}</CodeBlock>

            <SubHeading>Database</SubHeading>
            <CodeBlock>{`basely db execute <project> --sql "SELECT 1"
basely db schema <project>`}</CodeBlock>

            <SubHeading>Migrations</SubHeading>
            <CodeBlock>{`basely migration push <project> --name <name> --file <file>
basely migration list <project>`}</CodeBlock>

            <SubHeading>Type Generation</SubHeading>
            <CodeBlock>basely gen types &lt;project&gt; --out src/db.ts</CodeBlock>
          </section>

          {/* MCP / AI Agents */}
          <section className="mb-16">
            <SectionHeading id="mcp-ai-agents">MCP / AI Agents</SectionHeading>
            <Prose>
              basely ships an MCP server so AI tools like Claude and Cursor can manage databases directly — no copy-paste, no context switching.
            </Prose>

            <SubHeading>Configuration</SubHeading>
            <Prose>
              Add this to your <code className="font-mono text-white/70 text-sm bg-white/5 px-1.5 py-0.5 rounded">claude_desktop_config.json</code>{" "}
              or Cursor <code className="font-mono text-white/70 text-sm bg-white/5 px-1.5 py-0.5 rounded">mcp.json</code>:
            </Prose>
            <CodeBlock>{`{
  "mcpServers": {
    "basely": {
      "command": "npx",
      "args": ["-y", "@basely-cli/cli", "mcp"],
      "env": {
        "BASELY_API_URL": "https://api.basely.cc",
        "BASELY_API_KEY": "your-api-key"
      }
    }
  }
}`}</CodeBlock>

            <SubHeading>Available tools</SubHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {["create_project","delete_project","execute_sql","get_schema","apply_migration","list_migrations","gen_types"].map((t) => (
                <div key={t} className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm font-mono text-white/70">
                  {t}
                </div>
              ))}
            </div>

            <SubHeading>Example prompt</SubHeading>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-white/70 text-sm leading-relaxed italic">
              "Create a Postgres project called myapp, run this migration: CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL), then generate TypeScript types."
            </div>
          </section>

          {/* REST API */}
          <section className="mb-16">
            <SectionHeading id="rest-api">REST API</SectionHeading>
            <Prose>
              Base URL:{" "}
              <code className="font-mono text-white/70 text-sm bg-white/5 px-1.5 py-0.5 rounded">
                https://api.basely.cc
              </code>
            </Prose>
            <Prose>
              Auth: pass your API key as{" "}
              <code className="font-mono text-white/70 text-sm bg-white/5 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code>{" "}
              for project routes. Account/key management routes accept a JWT from <code className="font-mono text-white/70 text-sm bg-white/5 px-1.5 py-0.5 rounded">/auth/login</code>.
            </Prose>

            <div className="overflow-x-auto mt-6 rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-4 py-3 text-white/50 font-medium">Method</th>
                    <th className="text-left px-4 py-3 text-white/50 font-medium">Path</th>
                    <th className="text-left px-4 py-3 text-white/50 font-medium">Auth</th>
                    <th className="text-left px-4 py-3 text-white/50 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {API_ROUTES.map(({ method, path, auth, desc }, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className={`px-4 py-3 font-mono font-medium ${METHOD_COLORS[method] ?? "text-white/60"}`}>
                        {method}
                      </td>
                      <td className="px-4 py-3 font-mono text-white/70">{path}</td>
                      <td className="px-4 py-3 text-white/40 whitespace-nowrap">{auth}</td>
                      <td className="px-4 py-3 text-white/60">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Plans & Billing */}
          <section className="mb-16">
            <SectionHeading id="plans-billing">Plans & Billing</SectionHeading>
            <Prose>Start for free. Upgrade when you need more projects.</Prose>

            <div className="grid sm:grid-cols-3 gap-4 mt-6 mb-8">
              {PLANS.map(({ name, price, projects }) => (
                <div key={name} className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                  <p className="text-white font-semibold text-base mb-1">{name}</p>
                  <p className="text-2xl font-bold text-white mb-3">{price}</p>
                  <p className="text-white/50 text-sm">
                    {projects} {parseInt(projects) === 1 ? "project" : "projects"}
                  </p>
                </div>
              ))}
            </div>

            <Prose>
              Upgrade, downgrade, or cancel anytime from the dashboard. Billing is handled securely via Stripe. Downgrades take effect at the end of your billing period.
            </Prose>
          </section>

        </main>
      </div>
    </div>
  );
}
