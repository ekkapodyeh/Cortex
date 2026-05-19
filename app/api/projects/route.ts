import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function GET() {
  const projects = await db.project.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const { name, repoUrl, platform } = await req.json()
  const webhookSecret = randomBytes(32).toString('hex')
  const project = await db.project.create({
    data: { name, repoUrl, platform, webhookSecret },
  })
  return NextResponse.json(project, { status: 201 })
}
