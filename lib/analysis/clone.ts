import { execSync } from 'child_process'
import { mkdtempSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export function cloneAtCommit(repoUrl: string, commitSha: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'cortex-'))
  execSync(`git clone --depth 50 ${repoUrl} ${dir}`, { stdio: 'pipe' })
  execSync(`git -C ${dir} checkout ${commitSha}`, { stdio: 'pipe' })
  return dir
}

export function collectCodeFiles(dir: string, maxChars = 100000): string {
  const files: string = execSync(
    `find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.java" -o -name "*.js" \\) | grep -v node_modules | grep -v .git | head -100`,
    { encoding: 'utf-8' }
  )
  let result = ''
  for (const file of files.trim().split('\n').filter(Boolean)) {
    try {
      const content = readFileSync(file, 'utf-8')
      result += `\n\n// FILE: ${file.replace(dir, '')}\n${content}`
      if (result.length > maxChars) break
    } catch {}
  }
  return result.slice(0, maxChars)
}

export function cleanup(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}
