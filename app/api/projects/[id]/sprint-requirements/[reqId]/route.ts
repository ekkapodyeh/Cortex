import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  const { id, reqId } = await params

  const req = await db.sprintRequirement.findUnique({ where: { id: reqId } })
  if (!req || req.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.sprintRequirement.delete({ where: { id: reqId } })
  return NextResponse.json({ ok: true })
}
