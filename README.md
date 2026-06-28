# basely

AI-native Postgres provisioning. Spin up isolated Postgres databases in under a second — built for AI agents, CLIs, and indie developers.

## Packages

| Package | Description |
|---------|-------------|
| [`api`](./api) | REST API — provisions schemas/roles on a shared RDS cluster |
| [`cli`](./cli) | `basely` CLI — manage projects, run SQL, apply migrations, generate types |
| [`mcp`](./mcp) | MCP server — exposes basely as tools Claude/Cursor can call directly |

## How it works

Each project gets an isolated Postgres **schema** and a scoped **role** on a shared RDS instance. Provisioning takes under a second. No containers, no per-project RDS instances.

```
Free tier:  shared RDS, schema isolation, ~10k projects per instance
Paid tier:  dedicated RDS instance per project
```

## Quickstart

### 1. Run the API

```bash
cd api
cp .env.example .env   # set DATABASE_URL + API_KEY_SECRET
npm install
npm run dev
```

### 2. Install the CLI

```bash
cd cli
npm install && npm run build && npm link

basely auth setup --url http://localhost:3000 --key your-key
```

### 3. Create a project

```bash
basely projects create myapp
# → connection string printed + saved to ~/.basely/projects.json
```

### 4. Use it

```bash
basely migration push myapp --name 001_init --file ./schema.sql
basely db execute myapp --sql "SELECT * FROM users"
basely db schema myapp
basely gen types myapp --out src/db.ts
```

## MCP (Claude / Cursor)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "basely": {
      "command": "node",
      "args": ["/path/to/basely/mcp/dist/index.js"],
      "env": {
        "BASELY_API_URL": "http://localhost:3000",
        "BASELY_API_KEY": "your-key"
      }
    }
  }
}
```

Claude can then provision a DB, run migrations, query data, and generate TypeScript types — zero human steps.

### Available MCP tools

- `create_project` — provision a new DB
- `execute_sql` — run any SQL
- `get_schema` — introspect tables + columns
- `apply_migration` — idempotent named migrations
- `list_migrations` — see what's applied
- `gen_types` — generate TypeScript interfaces
- `delete_project` — tear down

## License

MIT
