import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const jobs = await db.analysisJob.findMany({
    where: { projectId: id },
    include: { updateDoc: true },
    orderBy: { triggeredAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(jobs)
}
