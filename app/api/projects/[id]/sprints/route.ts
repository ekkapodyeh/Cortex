import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(sprints)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name } = await req.json()

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const openSprint = await db.sprint.findFirst({ where: { projectId: id, status: 'OPEN' } })
  if (openSprint) return NextResponse.json({ error: 'ปิด Sprint ปัจจุบันก่อน' }, { status: 409 })

  const sprint = await db.sprint.create({
    data: { projectId: id, name },
    include: { requirements: true },
  })
  return NextResponse.json(sprint)
}
