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
  const { status, comment } = await req.json()

  const job = await db.analysisJob.findUnique({
    where: { id },
    include: { updateDoc: true },
  })
  if (!job?.updateDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.projectUpdateDoc.update({
    where: { jobId: id },
    data: { status },
  })

  return NextResponse.json({ ok: true, comment })
}
