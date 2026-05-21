export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { MonitorClient } from '../MonitorClient'
import type { Feature, DiffResult, ValidationResult } from '@/lib/types'

export default async function MonitorPage({
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
      project: {
        include: {
          knowledgeDocs: { orderBy: { version: 'desc' }, take: 1 },
          requirements: { orderBy: { version: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!latestJob?.updateDoc) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">งานวิเคราะห์</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">ติดตามการเปลี่ยนแปลงของโปรเจกต์</p>
        </div>
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)] text-lg">ยังไม่มีการวิเคราะห์</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">ระบบจะวิเคราะห์โค้ดอัตโนมัติเมื่อมีการ push</p>
        </div>
      </div>
    )
  }

  const diffResult = latestJob.updateDoc.diff as unknown as DiffResult
  const newFeatures = (latestJob.updateDoc.featuresNew as unknown as Feature[]) ?? []
  const oldFeatures = (latestJob.project.knowledgeDocs[0]?.features as unknown as Feature[]) ?? []
  const reqFeatures = (latestJob.project.requirements[0]?.features as unknown as Feature[]) ?? []
  const validationResult = latestJob.updateDoc.validation as unknown as ValidationResult | null

  return (
    <MonitorClient
      jobId={latestJob.id}
      commitSha={latestJob.commitSha}
      commitMsg={latestJob.commitMsg}
      author={latestJob.author}
      triggeredAt={latestJob.triggeredAt.toISOString()}
      diffResult={diffResult}
      newFeatures={newFeatures}
      oldFeatures={oldFeatures}
      reqFeatures={reqFeatures}
      validationResult={validationResult}
      reviewedAt={latestJob.updateDoc.reviewedAt?.toISOString() ?? null}
      updateDocStatus={latestJob.updateDoc.status}
      projectId={id}
    />
  )
}
