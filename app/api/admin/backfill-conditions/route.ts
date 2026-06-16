import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractConditionsForItems } from '@/lib/extract-conditions'

export async function POST() {
  const allReqs = await db.sprintRequirement.findMany()

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const req of allReqs) {
    const items = req.items as any[]
    // force re-extract ทุกครั้ง เพื่อ demo
    const _ = items

    try {
      const conditionsMap = await extractConditionsForItems(
        items.map((i: any) => ({
          featureId: i.featureId,
          title: i.title,
          description: i.description ?? '',
        }))
      )

      const updatedItems = items.map((i: any) => ({
        ...i,
        conditions: i.conditions ?? conditionsMap[i.featureId] ?? [],
      }))

      await db.sprintRequirement.update({
        where: { id: req.id },
        data: { items: updatedItems },
      })

      updated++
      // small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 5000))
    } catch (e: any) {
      errors.push(`${req.id}: ${e.message}`)
    }
  }

  return NextResponse.json({ updated, skipped, errors })
}
