import { mkdir, access, copyFile, readdir, stat, readFile } from 'node:fs/promises'
import path from 'node:path'

type ManifestEntry = {
  file: string
  prompt: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  category: string
  note?: string
}

type SyncResult = {
  entry: ManifestEntry
  status: 'present' | 'copied' | 'missing'
  source?: string
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectFilesRecursive(rootDir: string): Promise<string[]> {
  const out: string[] = []
  async function walk(current: string): Promise<void> {
    const children = await readdir(current, { withFileTypes: true })
    for (const child of children) {
      const full = path.join(current, child.name)
      if (child.isDirectory()) {
        await walk(full)
        continue
      }
      if (child.isFile()) out.push(full)
    }
  }
  if (await exists(rootDir)) {
    await walk(rootDir)
  }
  return out
}

function parseManifest(content: string): ManifestEntry[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ManifestEntry)
}

function resolveAliasBasenames(targetBasename: string): string[] {
  if (targetBasename === 'hero.png') {
    return ['player-sword.png', 'player-staff.png', 'hero_sword.png', 'hero_staff.png']
  }
  return []
}

function groupCountByPriority(results: SyncResult[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const result of results) {
    counts[result.entry.priority] = (counts[result.entry.priority] ?? 0) + 1
  }
  return counts
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply')
  const cwd = process.cwd()
  const manifestPath = path.resolve(cwd, 'docs/banana-missing-assets.jsonl')
  const sourceDir = path.resolve(cwd, 'pic')

  if (!(await exists(manifestPath))) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const raw = await readFile(manifestPath, 'utf8')
  const entries = parseManifest(raw)
  const sourceFiles = await collectFilesRecursive(sourceDir)

  const sourceByBasename = new Map<string, string[]>()
  for (const srcFile of sourceFiles) {
    const base = path.basename(srcFile)
    const list = sourceByBasename.get(base) ?? []
    list.push(srcFile)
    sourceByBasename.set(base, list)
  }

  const results: SyncResult[] = []

  for (const entry of entries) {
    const targetAbs = path.resolve(cwd, entry.file)
    if (await exists(targetAbs)) {
      results.push({ entry, status: 'present' })
      continue
    }

    const basename = path.basename(entry.file)
    const candidateBasenames = [basename, ...resolveAliasBasenames(basename)]
    let matchedSource: string | null = null
    for (const candidate of candidateBasenames) {
      const sources = sourceByBasename.get(candidate)
      if (sources && sources.length > 0) {
        matchedSource = sources[0]
        break
      }
    }

    if (!matchedSource) {
      results.push({ entry, status: 'missing' })
      continue
    }

    if (apply) {
      await mkdir(path.dirname(targetAbs), { recursive: true })
      await copyFile(matchedSource, targetAbs)
      results.push({ entry, status: 'copied', source: matchedSource })
    } else {
      results.push({ entry, status: 'copied', source: matchedSource })
    }
  }

  const presentCount = results.filter((r) => r.status === 'present').length
  const copiedCount = results.filter((r) => r.status === 'copied').length
  const missingCount = results.filter((r) => r.status === 'missing').length

  const modeLabel = apply ? 'APPLY' : 'CHECK'
  console.log(`[${modeLabel}] manifest: ${manifestPath}`)
  console.log(`[${modeLabel}] source: ${sourceDir}`)
  console.log(`[${modeLabel}] total=${results.length} present=${presentCount} matched=${copiedCount} missing=${missingCount}`)

  const missingByPriority: Record<string, number> = {}
  for (const item of results.filter((r) => r.status === 'missing')) {
    missingByPriority[item.entry.priority] = (missingByPriority[item.entry.priority] ?? 0) + 1
  }
  if (Object.keys(missingByPriority).length > 0) {
    console.log(`[${modeLabel}] missing by priority: ${JSON.stringify(missingByPriority)}`)
  }

  const copiedByPriority = groupCountByPriority(results.filter((r) => r.status === 'copied'))
  if (Object.keys(copiedByPriority).length > 0) {
    console.log(`[${modeLabel}] matched by priority: ${JSON.stringify(copiedByPriority)}`)
  }

  const unresolved = results.filter((r) => r.status === 'missing')
  if (unresolved.length > 0) {
    console.log(`[${modeLabel}] unresolved targets:`)
    for (const item of unresolved) {
      console.log(`- ${item.entry.file} [${item.entry.priority}/${item.entry.category}]`)
    }
  }

  if (apply) {
    const createdTargets = results.filter((r) => r.status === 'copied')
    if (createdTargets.length > 0) {
      console.log('[APPLY] copied targets:')
      for (const item of createdTargets) {
        console.log(`- ${item.entry.file} <= ${item.source}`)
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
