export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { SprintReviewClient } from '../SprintReviewClient'
import { MockJobButton } from '@/components/MockJobButton'
import { ResetJobsButton } from '@/components/ResetJobsButton'
import type { DiffResult, Feature } from '@/lib/types'
import { getProjectMock } from '@/lib/sprint-mocks'

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ id: string; sprintId: string }>
}) {
  const { id, sprintId } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: { requirements: true },
  })
  if (!sprint || sprint.projectId !== id) notFound()

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

  const hasPendingDiff = !!latestJob?.updateDoc && latestJob.updateDoc.status === 'PENDING'
  const diffResult: DiffResult = hasPendingDiff
    ? latestJob!.updateDoc!.diff as unknown as DiffResult
    : { added: [], modified: [], removed: [] }

  const activeSprint = {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status as 'OPEN' | 'CLOSED',
    requirements: sprint.requirements.map(r => ({
      id: r.id,
      fileName: r.fileName ?? null,
      createdBy: r.createdBy,
      items: r.items as unknown as any[],
    })),
  }

  return (
    <SprintReviewClient
      projectId={id}
      jobId={latestJob?.id ?? ''}
      activeSprint={activeSprint}
      readOnly={sprint.status === 'CLOSED'}
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
