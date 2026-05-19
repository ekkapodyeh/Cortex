import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const docs = await db.knowledgeDoc.findMany({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { jobId, approvedBy } = await req.json()

  const updateDoc = await db.projectUpdateDoc.findUnique({ where: { jobId } })
  if (!updateDoc) return NextResponse.json({ error: 'Update doc not found' }, { status: 404 })

  const last = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  const version = (last?.version ?? 0) + 1

  const [knowledgeDoc] = await db.$transaction([
    db.knowledgeDoc.create({
      data: {
        projectId: id,
        version,
        features: updateDoc.featuresNew as any,
        approvedBy,
        sourceJobId: jobId,
      },
    }),
    db.projectUpdateDoc.update({
      where: { jobId },
      data: { status: 'APPROVED' },
    }),
  ])

  return NextResponse.json(knowledgeDoc, { status: 201 })
}
