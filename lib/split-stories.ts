import type { Feature } from './types'

const COMPOUND_CONNECTORS = ['พร้อม', ' และ ', ' หรือ ', ' and ', ' or ']

function scoreMatch(title: string, featureTitle: string): number {
  const words = title.toLowerCase().split(/[\s/]+/).filter(w => w.length > 2)
  const ftLower = featureTitle.toLowerCase()
  return words.filter(w => ftLower.includes(w)).length
}

export function splitCompoundItems(items: any[], allFeatures: Feature[]): any[] {
  const result: any[] = []
  for (const item of items) {
    const connector = COMPOUND_CONNECTORS.find(c => item.title.includes(c))
    if (!connector) { result.push(item); continue }
    const idx = item.title.indexOf(connector)
    const part1 = item.title.slice(0, idx).trim()
    const part2 = item.title.slice(idx + connector.length).trim()
    if (!part1 || !part2) { result.push(item); continue }
    let bestId = `${item.featureId}__split1`
    let bestScore = 0
    for (const f of allFeatures) {
      if (f.id === item.featureId) continue
      const s = scoreMatch(part2, f.title)
      if (s > bestScore) { bestScore = s; bestId = f.id }
    }
    result.push({ ...item, title: part1 })
    result.push({ ...item, title: part2, featureId: bestId })
  }
  return result
}
