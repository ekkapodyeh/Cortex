import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

  const requirement = await db.sprintRequirement.create({
    data: {
      sprintId,
      projectId: id,
      items,
      fileName: fileName ?? null,
      createdBy: createdBy ?? 'BA',
    },
  })
  return NextResponse.json(requirement)
}
