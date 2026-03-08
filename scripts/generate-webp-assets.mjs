import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const root = 'public/assets'
const supported = new Set(['.png', '.jpg', '.jpeg'])

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (supported.has(extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

function qualityFor(relPath) {
  if (relPath.includes('/textures/')) return { q: 72, alphaQ: 80 }
  if (relPath.includes('/scenes/')) return { q: 80, alphaQ: 86 }
  if (relPath.includes('/characters/')) return { q: 84, alphaQ: 90 }
  if (relPath.includes('/weapons/')) return { q: 84, alphaQ: 90 }
  if (relPath.includes('/ui/materials/')) return { q: 86, alphaQ: 92 }
  if (relPath.includes('/ui/')) return { q: 84, alphaQ: 90 }
  if (relPath.includes('/decorations/')) return { q: 84, alphaQ: 90 }
  return { q: 82, alphaQ: 88 }
}

function toWebpPath(file) {
  return file.replace(/\.(png|jpe?g)$/i, '.webp')
}

const files = walk(root)
let processed = 0
let skipped = 0
let originalBytes = 0
let webpBytes = 0

for (const file of files) {
  const rel = relative('.', file).replace(/\\/g, '/')
  const out = toWebpPath(file)
  const inputStat = statSync(file)
  originalBytes += inputStat.size
  if (existsSync(out) && statSync(out).mtimeMs >= inputStat.mtimeMs) {
    webpBytes += statSync(out).size
    skipped += 1
    continue
  }
  const { q, alphaQ } = qualityFor(rel)
  execFileSync('cwebp', ['-quiet', '-mt', '-m', '6', '-af', '-q', String(q), '-alpha_q', String(alphaQ), file, '-o', out], {
    stdio: 'inherit',
  })
  webpBytes += statSync(out).size
  processed += 1
}

const originalMb = (originalBytes / 1024 / 1024).toFixed(2)
const webpMb = (webpBytes / 1024 / 1024).toFixed(2)
const savedMb = ((originalBytes - webpBytes) / 1024 / 1024).toFixed(2)
const ratio = originalBytes > 0 ? (((originalBytes - webpBytes) / originalBytes) * 100).toFixed(1) : '0.0'

console.log(`Processed: ${processed}, skipped: ${skipped}`)
console.log(`Original total: ${originalMb} MB`)
console.log(`WebP total: ${webpMb} MB`)
console.log(`Saved: ${savedMb} MB (${ratio}%)`)
