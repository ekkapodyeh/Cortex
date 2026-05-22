import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { jobId: rawJobId, items, fileName, createdBy } = body

  if (!items) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  let jobId = rawJobId
  if (!jobId) {
    // No job yet — create a stub job so requirements have somewhere to live
    const stubJob = await db.analysisJob.create({
      data: {
        projectId: id,
        status: 'DONE',
        commitSha: 'initial',
        commitMsg: 'stub job for requirements',
        author: 'system',
        triggeredAt: new Date(),
      },
    })
    jobId = stubJob.id
  } else {
    const job = await db.analysisJob.findUnique({ where: { id: jobId } })
    if (!job || job.projectId !== id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
  }

  const sprintReq = await db.sprintRequirement.create({
    data: { jobId, projectId: id, items, fileName: fileName ?? null, createdBy: createdBy ?? 'BA' },
  })

  return NextResponse.json(sprintReq)
}
