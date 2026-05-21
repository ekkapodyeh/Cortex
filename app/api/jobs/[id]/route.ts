import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await db.analysisJob.findUnique({
    where: { id },
    include: { updateDoc: true },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const job = await db.analysisJob.findUnique({
    where: { id },
    include: { updateDoc: true },
  })
  if (!job?.updateDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.markReviewed === true) data.reviewedAt = new Date()

  await db.projectUpdateDoc.update({
    where: { jobId: id },
    data,
  })

  return NextResponse.json({ ok: true })
}
