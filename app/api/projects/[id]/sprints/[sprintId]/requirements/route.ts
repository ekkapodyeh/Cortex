import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractConditionsForItems } from '@/lib/extract-conditions'
import { splitStoriesWithAI } from '@/lib/split-stories-ai'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { id, sprintId } = await params
  const { items, fileName, createdBy } = await req.json()

  if (!items) return NextResponse.json({ error: 'items required' }, { status: 400 })

  const sprint = await db.sprint.findUnique({ where: { id: sprintId } })
  if (!sprint || sprint.projectId !== id) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  }

  // Split compound stories via AI
  let splitItems = items
  try {
    splitItems = await splitStoriesWithAI(items)
  } catch (e) {
    console.error('splitStories failed, using original items:', e)
  }

  // Extract conditions via AI
  let itemsWithConditions = splitItems
  try {
    const conditionsMap = await extractConditionsForItems(
      splitItems.map((r: any) => ({ featureId: r.featureId, title: r.title, description: r.description ?? '' }))
    )
    itemsWithConditions = splitItems.map((r: any) => ({
      ...r,
      conditions: conditionsMap[r.featureId] ?? [],
    }))
  } catch (e) {
    console.error('extractConditions failed, saving without conditions:', e)
  }

  const requirement = await db.sprintRequirement.create({
    data: {
      sprintId,
      projectId: id,
      items: itemsWithConditions,
      fileName: fileName ?? null,
      createdBy: createdBy ?? 'BA',
    },
  })
  return NextResponse.json(requirement)
}
