import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // ลบแค่ผลการวิเคราะห์ที่ยังไม่ approved — SprintRequirement และ KnowledgeDoc ยังอยู่
  await db.projectUpdateDoc.deleteMany({
    where: { projectId: id, status: 'PENDING' },
  })

  return NextResponse.json({ ok: true })
}
