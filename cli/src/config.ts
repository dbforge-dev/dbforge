import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_DIR = path.join(os.homedir(), '.dbforge')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const PROJECTS_FILE = path.join(CONFIG_DIR, 'projects.json')

export interface Config {
  apiUrl: string
  apiKey: string
}

export interface ProjectEntry {
  id: string
  schema: string
  connectionString: string
  createdAt: string
}

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true })
}

export function getConfig(): Config {
  ensureDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('Not configured. Run: dbforge auth setup')
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
}

export function saveConfig(config: Config) {
  ensureDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export function getProjects(): Record<string, ProjectEntry> {
  ensureDir()
  if (!fs.existsSync(PROJECTS_FILE)) return {}
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'))
}

export function saveProject(entry: ProjectEntry) {
  const projects = getProjects()
  projects[entry.id] = entry
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2))
}

export function removeProject(id: string) {
  const projects = getProjects()
  delete projects[id]
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2))
}

export function getProject(id: string): ProjectEntry {
  const projects = getProjects()
  const p = projects[id]
  if (!p) {
    console.error(`Project "${id}" not found. Run: dbforge projects list`)
    process.exit(1)
  }
  return p
}
