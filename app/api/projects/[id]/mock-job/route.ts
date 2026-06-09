import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Feature, DiffResult } from '@/lib/types'
import { getProjectMock } from '@/lib/sprint-mocks'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const mock = getProjectMock(project.name)
  if (!mock) {
    return NextResponse.json({ error: `No mock data for project "${project.name}"` }, { status: 400 })
  }

  const latestKnowledge = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  const existingFeatures = (latestKnowledge?.features as unknown as Feature[]) ?? []

  const modifiedIds = new Set(mock.modified.map(m => m.new.id))
  const removedIds  = new Set(mock.removed.map(f => f.id))
  const addedIds    = new Set(mock.added.map(f => f.id))

  const featuresNew: Feature[] = [
    ...existingFeatures.filter(f => !modifiedIds.has(f.id) && !removedIds.has(f.id) && !addedIds.has(f.id)),
    ...mock.modified.map(m => m.new),
    ...mock.added,
  ]

  const diff: DiffResult = {
    added: mock.added,
    modified: mock.modified,
    removed: mock.removed,
  }

  const commit = mock.commits[Math.floor(Math.random() * mock.commits.length)]
  const sha = commit.sha.slice(0, 5) + Math.random().toString(36).slice(2, 5)

  const job = await db.analysisJob.create({
    data: {
      projectId: id,
      commitSha: sha,
      commitMsg: commit.msg,
      author: commit.author,
      status: 'DONE',
      updateDoc: {
        create: {
          projectId: id,
          featuresNew: featuresNew as any,
          diff: diff as any,
          validation: { passed: true, errors: [] } as any,
          status: 'PENDING',
        },
      },
    },
  })

  return NextResponse.json({ jobId: job.id }, { status: 201 })
}
