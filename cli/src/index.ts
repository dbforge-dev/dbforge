#!/usr/bin/env node
import { program } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs'
import { saveConfig, getConfig, getProjects, saveProject, removeProject, getProject } from './config.js'
import { api } from './api.js'

program.name('basely').description('AI-native Postgres provisioning').version('0.1.0')

// ── auth ──────────────────────────────────────────────────────────────────────
const auth = program.command('auth')

auth
  .command('setup')
  .description('Configure API URL and key')
  .requiredOption('--url <url>', 'basely API URL')
  .requiredOption('--key <key>', 'API key')
  .action(({ url, key }) => {
    saveConfig({ apiUrl: url.replace(/\/$/, ''), apiKey: key })
    console.log(chalk.green('✓ Configured'))
  })

auth
  .command('whoami')
  .description('Show current config')
  .action(() => {
    const config = getConfig()
    console.log(`API URL: ${config.apiUrl}`)
    console.log(`API Key: ${config.apiKey.slice(0, 6)}...`)
  })

// ── projects ──────────────────────────────────────────────────────────────────
const projects = program.command('projects')

projects
  .command('create [id]')
  .description('Provision a new Postgres project')
  .action(async (id?: string) => {
    const spinner = ora('Provisioning...').start()
    try {
      const project = await api.createProject(id)
      saveProject({ ...project, createdAt: new Date().toISOString() })
      spinner.succeed(chalk.green(`Project created: ${project.id}`))
      console.log(`\nConnection string:\n${chalk.cyan(project.connectionString)}\n`)
      console.log(chalk.dim('Saved to ~/.basely/projects.json'))
    } catch (err: any) {
      spinner.fail(err.message)
      process.exit(1)
    }
  })

projects
  .command('list')
  .description('List local projects')
  .action(() => {
    const ps = getProjects()
    const entries = Object.values(ps)
    if (!entries.length) {
      console.log('No projects. Run: basely projects create')
      return
    }
    for (const p of entries) {
      console.log(`${chalk.bold(p.id)}  ${chalk.dim(p.createdAt)}`)
      console.log(`  ${chalk.cyan(p.connectionString)}\n`)
    }
  })

projects
  .command('delete <id>')
  .description('Delete a project and its schema')
  .action(async (id: string) => {
    const spinner = ora(`Deleting ${id}...`).start()
    try {
      await api.deleteProject(id)
      removeProject(id)
      spinner.succeed(`Deleted ${id}`)
    } catch (err: any) {
      spinner.fail(err.message)
      process.exit(1)
    }
  })

// ── db ────────────────────────────────────────────────────────────────────────
const db = program.command('db')

db
  .command('execute <projectId>')
  .description('Run SQL against a project')
  .requiredOption('--sql <sql>', 'SQL to execute')
  .action(async (projectId: string, opts) => {
    const project = getProject(projectId)
    try {
      const result = await api.query(projectId, project.connectionString, opts.sql)
      if (result.rows?.length) {
        console.table(result.rows)
      } else {
        console.log(chalk.dim(`${result.rowCount ?? 0} row(s) affected`))
      }
    } catch (err: any) {
      console.error(chalk.red(err.message))
      process.exit(1)
    }
  })

db
  .command('schema <projectId>')
  .description('Print schema for a project')
  .action(async (projectId: string) => {
    try {
      const result = await api.schema(projectId)
      for (const [table, cols] of Object.entries(result.tables as Record<string, any[]>)) {
        console.log(chalk.bold(`\n${table}`))
        for (const col of cols) {
          const nullable = col.nullable ? chalk.dim('?') : ''
          console.log(`  ${col.column}${nullable}  ${chalk.cyan(col.type)}`)
        }
      }
    } catch (err: any) {
      console.error(chalk.red(err.message))
      process.exit(1)
    }
  })

// ── migrations ────────────────────────────────────────────────────────────────
const mig = program.command('migration')

mig
  .command('push <projectId>')
  .description('Apply a migration SQL file')
  .requiredOption('--name <name>', 'Migration name (must be unique)')
  .requiredOption('--file <file>', 'Path to .sql file')
  .action(async (projectId: string, opts) => {
    const project = getProject(projectId)
    const sql = fs.readFileSync(opts.file, 'utf8')
    const spinner = ora(`Applying ${opts.name}...`).start()
    try {
      await api.applyMigration(projectId, project.connectionString, opts.name, sql)
      spinner.succeed(`Applied: ${opts.name}`)
    } catch (err: any) {
      spinner.fail(err.message)
      process.exit(1)
    }
  })

mig
  .command('list <projectId>')
  .description('List applied migrations')
  .action(async (projectId: string) => {
    const project = getProject(projectId)
    try {
      const result = await api.listMigrations(projectId, project.connectionString)
      for (const m of result.migrations) {
        console.log(`${chalk.green('✓')} ${m.name}  ${chalk.dim(m.applied_at)}`)
      }
    } catch (err: any) {
      console.error(chalk.red(err.message))
      process.exit(1)
    }
  })

// ── gen ───────────────────────────────────────────────────────────────────────
const gen = program.command('gen')

const PG_TO_TS: Record<string, string> = {
  'integer': 'number',
  'bigint': 'number',
  'smallint': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'boolean': 'boolean',
  'text': 'string',
  'varchar': 'string',
  'character varying': 'string',
  'char': 'string',
  'uuid': 'string',
  'json': 'Record<string, unknown>',
  'jsonb': 'Record<string, unknown>',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'timestamptz': 'string',
  'date': 'string',
  'time': 'string',
  'bytea': 'Buffer',
}

function pgToTs(pgType: string): string {
  return PG_TO_TS[pgType.toLowerCase()] ?? 'unknown'
}

function toInterfaceName(tableName: string): string {
  return tableName
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

gen
  .command('types <projectId>')
  .description('Generate TypeScript interfaces from the project schema')
  .option('--out <file>', 'Write output to file instead of stdout')
  .action(async (projectId: string, opts) => {
    try {
      const result = await api.schema(projectId)
      const tables = result.tables as Record<string, { column: string; type: string; nullable: boolean; default: string | null }[]>

      const lines: string[] = [
        `// Generated by basely — project: ${projectId}`,
        `// Do not edit manually. Re-run: basely gen types ${projectId}`,
        '',
      ]

      for (const [tableName, cols] of Object.entries(tables)) {
        const iface = toInterfaceName(tableName)
        lines.push(`export interface ${iface} {`)
        for (const col of cols) {
          const tsType = pgToTs(col.type)
          const optional = col.nullable || col.default !== null ? '?' : ''
          lines.push(`  ${col.column}${optional}: ${tsType}${col.nullable ? ' | null' : ''}`)
        }
        lines.push('}')
        lines.push('')
      }

      const output = lines.join('\n')

      if (opts.out) {
        fs.writeFileSync(opts.out, output)
        console.log(chalk.green(`✓ Written to ${opts.out}`))
      } else {
        console.log(output)
      }
    } catch (err: any) {
      console.error(chalk.red(err.message))
      process.exit(1)
    }
  })

program.parse()
