import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { id, sprintId } = await params
  const { status } = await req.json()

  if (status !== 'CLOSED') return NextResponse.json({ error: 'invalid status' }, { status: 400 })

  const sprint = await db.sprint.findUnique({ where: { id: sprintId } })
  if (!sprint || sprint.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.sprint.update({
    where: { id: sprintId },
    data: { status: 'CLOSED' },
    include: { requirements: true },
  })
  return NextResponse.json(updated)
}
