export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { DiffResult, Feature } from '@/lib/types'
import { SummaryTable } from './SummaryTable'
import { UpdateKnowledgeButton } from './UpdateKnowledgeButton'
import { SprintReviewRightPanel } from '../SprintReviewRightPanel'
import { getProjectMock } from '@/lib/sprint-mocks'

interface SprintReqItem {
  id: string
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add' | 'modify' | 'remove'
}

type DiffChangeType = 'added' | 'modified' | 'removed'
type Status = 'done' | 'partial' | 'not-done'

export default async function SprintSummaryPage({
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
    },
  })

  if (!latestJob?.updateDoc) notFound()

  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })
  const activeSprintRaw = sprints.find(s => s.status === 'OPEN') ?? null
  const activeSprint = activeSprintRaw ? {
    id: activeSprintRaw.id,
    name: activeSprintRaw.name,
    status: activeSprintRaw.status as 'OPEN' | 'CLOSED',
    requirements: activeSprintRaw.requirements.map(r => ({
      id: r.id,
      fileName: r.fileName ?? null,
      createdBy: r.createdBy,
      items: r.items as unknown as any[],
    })),
  } : null

  const lastKnowledge = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const nextVersion = (lastKnowledge?.version ?? 0) + 1
  const alreadyApproved = latestJob.updateDoc.status === 'APPROVED'

  const diff = latestJob.updateDoc.diff as unknown as DiffResult

  interface DiffItem { feature: Feature; oldFeature: Feature | null; changeType: DiffChangeType }
  const diffItems: DiffItem[] = [
    ...(diff.added    ?? []).map(f  => ({ feature: f,     oldFeature: null,  changeType: 'added'    as const })),
    ...(diff.modified ?? []).map(c  => ({ feature: c.new, oldFeature: c.old, changeType: 'modified' as const })),
    ...(diff.removed  ?? []).map(f  => ({ feature: f,     oldFeature: null,  changeType: 'removed'  as const })),
  ]
  const diffMap = new Map(diffItems.map(d => [d.feature.id, d]))

  const allReqItems = (activeSprint?.requirements ?? []).flatMap(r => r.items as unknown as SprintReqItem[])

  const reqRows = allReqItems.map(req => {
    const diffItem = diffMap.get(req.featureId) ?? null
    const status: Status = (() => {
      if (!diffItem) return 'not-done'
      if (
        (req.changeType === 'add'    && diffItem.changeType === 'added')    ||
        (req.changeType === 'modify' && diffItem.changeType === 'modified') ||
        (req.changeType === 'remove' && diffItem.changeType === 'removed')
      ) return 'done'
      return 'partial'
    })()

    const beforeFeature: Feature | null = diffItem
      ? diffItem.changeType === 'added'   ? null
      : diffItem.changeType === 'removed' ? diffItem.feature
      : diffItem.oldFeature
      : null
    const afterFeature: Feature | null = diffItem
      ? diffItem.changeType === 'removed' ? null
      : diffItem.feature
      : null

    return {
      req: { id: req.id, featureId: req.featureId, title: req.title, description: req.description, changeType: req.changeType },
      beforeTitle: beforeFeature?.title ?? null,
      beforeDesc: beforeFeature?.description ?? null,
      afterTitle: afterFeature?.title ?? null,
      afterDesc: afterFeature?.description ?? null,
      diffChangeType: diffItem?.changeType ?? null,
      status,
    }
  }).filter(r => r.status === 'done')

  return (
    <div className="pt-[48px] px-[32px] pb-24 pr-[320px]">
      <div className="max-w-[808px] mx-auto flex flex-col gap-[48px]">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/projects/${id}/sprint-review`}
            className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <CaretLeftIcon size={12} />
            BoltCheck
          </Link>
          <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">สรุปการแก้ไข</h2>
        </div>

        {/* Table */}
        {allReqItems.length > 0 ? (
          <SummaryTable rows={reqRows} />
        ) : (
          <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl">
            <p className="text-sm text-[var(--text-muted)]">ยังไม่มี Bolt Requirement — กลับไปอัปโหลดที่หน้า BoltCheck</p>
          </div>
        )}
      </div>

      <SprintReviewRightPanel
        projectId={id}
        jobId={latestJob.id}
        commitSha={latestJob.commitSha}
        commitMsg={latestJob.commitMsg ?? ''}
        author={latestJob.author}
        triggeredAt={latestJob.triggeredAt.toISOString()}
        diffResult={diff}
        activeSprint={activeSprint}
        noDiff={false}
        mockRequirements={getProjectMock(project.name)?.requirements ?? []}
      />
    </div>
  )
}
