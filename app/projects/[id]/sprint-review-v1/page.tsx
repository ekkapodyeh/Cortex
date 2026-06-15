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

  // ดึง job ล่าสุด (อาจไม่มี updateDoc ถ้าเพิ่ง reset)
  const latestJob = await db.analysisJob.findFirst({
    where: { projectId: id, status: 'DONE' },
    orderBy: { triggeredAt: 'desc' },
    include: { updateDoc: true },
  })

  // ดึง features จาก KnowledgeDoc ล่าสุดเพื่อ map featureId → title/category
  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  const allFeatures = (latestDoc?.features as unknown as Feature[]) ?? []

  // ดึง SprintRequirement จากทุก job ของ project เพื่อให้ persist ข้าม reset
  const allSprintRequirements = await db.sprintRequirement.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' },
  })

  const sprintDocs = allSprintRequirements.map(r => ({
    id: r.id,
    fileName: r.fileName ?? null,
    createdBy: r.createdBy,
    items: r.items as unknown as any[],
  }))

  // ถ้าไม่มี job เลย → empty state
  if (!latestJob) {
    return (
      <SprintReviewClient
        projectId={id}
        jobId=""
        sprintDocs={sprintDocs}
        diffResult={{ added: [], modified: [], removed: [] }}
        commitSha=""
        commitMsg=""
        author=""
        triggeredAt={new Date().toISOString()}
        mockButton={<MockJobButton projectId={id} />}
        resetButton={<ResetJobsButton projectId={id} />}
        historyHref={`/projects/${id}/sprint-review/history`}
        mockRequirements={mockRequirements}
        allFeatures={allFeatures}
        noDiff
      />
    )
  }

  // ถือว่า "มี diff" เฉพาะเมื่อ updateDoc ยังเป็น PENDING เท่านั้น
  // APPROVED = ถูกบันทึกเป็น Knowledge Doc แล้ว → กลับไปรอ push ใหม่
  const hasPendingDiff = !!latestJob.updateDoc && latestJob.updateDoc.status === 'PENDING'
  const diffResult: DiffResult = hasPendingDiff
    ? latestJob.updateDoc!.diff as unknown as DiffResult
    : { added: [], modified: [], removed: [] }

  return (
    <SprintReviewClient
      projectId={id}
      jobId={latestJob.id}
      sprintDocs={sprintDocs}
      diffResult={diffResult}
      commitSha={latestJob.commitSha}
      commitMsg={latestJob.commitMsg ?? ''}
      author={latestJob.author}
      triggeredAt={latestJob.triggeredAt.toISOString()}
      mockButton={<MockJobButton projectId={id} />}
      resetButton={<ResetJobsButton projectId={id} />}
      historyHref={`/projects/${id}/sprint-review/history`}
      mockRequirements={mockRequirements}
      allFeatures={allFeatures}
      noDiff={!hasPendingDiff}
    />
  )
}