import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { splitStoriesWithAI } from '@/lib/split-stories-ai'

export async function POST() {
  const allReqs = await db.sprintRequirement.findMany()
  const updated: string[] = []
  const errors: string[] = []

  for (const req of allReqs) {
    try {
      const items = req.items as any[]

      // Split stories (rule-based, no AI)
      const splitItems = await splitStoriesWithAI(items)

      // Preserve existing conditions from original items (by base featureId)
      const conditionsByBase = new Map(items.map((r: any) => [r.featureId, r.conditions ?? []]))
      const itemsWithConditions = splitItems.map((r: any) => {
        // part items: featureId = "origId-part1" → base = "origId"
        const baseId = r.featureId.replace(/-part\d+$/, '')
        return { ...r, conditions: r.conditions?.length ? r.conditions : (conditionsByBase.get(baseId) ?? []) }
      })

      await db.sprintRequirement.update({
        where: { id: req.id },
        data: { items: itemsWithConditions },
      })
      updated.push(req.id)

    } catch (e: any) {
      errors.push(`${req.id}: ${e?.message ?? e}`)
    }
  }

  return NextResponse.json({ updated: updated.length, errors })
}
