import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { jobId, items, fileName, createdBy } = body

  if (!jobId || !items) {
    return NextResponse.json({ error: 'jobId and items required' }, { status: 400 })
  }

  const job = await db.analysisJob.findUnique({ where: { id: jobId } })
  if (!job || job.projectId !== id) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const sprintReq = await db.sprintRequirement.create({
    data: { jobId, projectId: id, items, fileName: fileName ?? null, createdBy: createdBy ?? 'BA' },
  })

  return NextResponse.json(sprintReq)
}
