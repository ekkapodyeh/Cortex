import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { SprintReviewClient } from './SprintReviewClient'
import type { DiffResult } from '@/lib/types'

export default async function SprintReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const latestJob = await db.analysisJob.findFirst({
    where: { projectId: id, status: 'DONE' },
    orderBy: { triggeredAt: 'desc' },
    include: {
      updateDoc: true,
      sprintRequirements: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!latestJob?.updateDoc) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sprint Review</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">เทียบโค้ดกับ Sprint Requirement</p>
        </div>
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--text-muted)] text-lg">ยังไม่มีการวิเคราะห์</p>
        </div>
      </div>
    )
  }

  const diffResult = latestJob.updateDoc.diff as unknown as DiffResult

  const sprintDocs = latestJob.sprintRequirements.map(r => ({
    id: r.id,
    fileName: r.fileName ?? null,
    createdBy: r.createdBy,
    items: r.items as unknown as any[],
  }))

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
    />
  )
}
