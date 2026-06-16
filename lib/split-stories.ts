import type { Feature } from './types'

function scoreMatch(reqText: string, featureTitle: string): number {
  const words = reqText.toLowerCase().split(/[\s/()]+/).filter(w => w.length > 2)
  const ftLower = featureTitle.toLowerCase()
  return words.filter(w => ftLower.includes(w)).length
}

export function splitCompoundItems(items: any[], allFeatures: Feature[]): any[] {
  const result: any[] = []

  for (const item of items) {
    const reqText = `${item.title} ${item.description ?? ''}`

    // หา features ทั้งหมดที่ req นี้น่าจะครอบคลุม (score >= 2)
    const matches = allFeatures
      .map(f => ({ f, score: scoreMatch(reqText, f.title) }))
      .filter(({ score }) => score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // ไม่เกิน 3 features

    if (matches.length <= 1) {
      // match เดียว → ใช้ featureId เดิม
      result.push(item)
      continue
    }

    // match หลายอัน → สร้าง card ต่อ feature
    for (const { f } of matches) {
      result.push({ ...item, featureId: f.id })
    }
  }

  return result
}
