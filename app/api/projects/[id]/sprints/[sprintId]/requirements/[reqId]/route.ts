import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string; reqId: string }> }
) {
  const { id, reqId } = await params

  const req = await db.sprintRequirement.findUnique({ where: { id: reqId } })
  if (!req || req.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.sprintRequirement.delete({ where: { id: reqId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string; reqId: string }> }
) {
  const { id, reqId } = await params
  const { items } = await req.json()

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const existing = await db.sprintRequirement.findUnique({ where: { id: reqId } })
  if (!existing || existing.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.sprintRequirement.update({
    where: { id: reqId },
    data: { items },
  })
  return NextResponse.json(updated)
}
