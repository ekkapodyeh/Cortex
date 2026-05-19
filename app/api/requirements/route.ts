import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const requirements = await db.documentRequirement.findMany({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  return NextResponse.json(requirements)
}
