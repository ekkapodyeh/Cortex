export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { SprintReviewClient } from './SprintReviewClient'
import { MockJobButton } from '@/components/MockJobButton'
import { ResetJobsButton } from '@/components/ResetJobsButton'
import type { DiffResult, Feature } from '@/lib/types'
import { getProjectMock } from '@/lib/sprint-mocks'

export default async function SprintReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const projectMock = getProjectMock(project.name)
  const mockRequirements = projectMock?.requirements ?? []

  const latestJob = await db.analysisJob.findFirst({
    where: { projectId: id, status: 'DONE' },
    orderBy: { triggeredAt: 'desc' },
    include: { updateDoc: true },
  })

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  const allFeatures = (latestDoc?.features as unknown as Feature[]) ?? []

  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })

  const activeSprint = sprints.find(s => s.status === 'OPEN') ?? null

  const hasPendingDiff = !!latestJob?.updateDoc && latestJob.updateDoc.status === 'PENDING'
  const diffResult: DiffResult = hasPendingDiff
    ? latestJob!.updateDoc!.diff as unknown as DiffResult
    : { added: [], modified: [], removed: [] }

  return (
    <SprintReviewClient
      projectId={id}
      jobId={latestJob?.id ?? ''}
      activeSprint={activeSprint ? {
        id: activeSprint.id,
        name: activeSprint.name,
        status: activeSprint.status as 'OPEN' | 'CLOSED',
        requirements: activeSprint.requirements.map(r => ({
          id: r.id,
          fileName: r.fileName ?? null,
          createdBy: r.createdBy,
          items: r.items as unknown as any[],
        })),
      } : null}
      diffResult={diffResult}
      commitSha={latestJob?.commitSha ?? ''}
      commitMsg={latestJob?.commitMsg ?? ''}
      author={latestJob?.author ?? ''}
      triggeredAt={(latestJob?.triggeredAt ?? new Date()).toISOString()}
      mockButton={<MockJobButton projectId={id} />}
      resetButton={<ResetJobsButton projectId={id} />}
      historyHref={`/projects/${id}/sprint-review/history`}
      mockRequirements={mockRequirements}
      allFeatures={allFeatures}
      noDiff={!hasPendingDiff}
    />
  )
}
