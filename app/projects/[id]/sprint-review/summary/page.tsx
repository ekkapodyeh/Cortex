export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { DiffResult, Feature } from '@/lib/types'
import { SummaryTable } from './SummaryTable'
import { UpdateKnowledgeButton } from './UpdateKnowledgeButton'

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

function DiffTypeBadge({ type }: { type: DiffChangeType }) {
  const map = {
    added:    { label: '+ เพิ่มใหม่', cls: 'text-[var(--status-green)]  bg-green-900/10'  },
    modified: { label: '~ แก้ไข',    cls: 'text-[var(--status-yellow)] bg-yellow-900/10' },
    removed:  { label: '− ลบออก',   cls: 'text-[var(--status-red)]    bg-red-900/10'    },
  }
  const { label, cls } = map[type]
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${cls}`}>{label}</span>
}

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
      sprintRequirements: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!latestJob?.updateDoc) notFound()

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

  const allReqItems = latestJob.sprintRequirements.flatMap(r => r.items as unknown as SprintReqItem[])
  const reqFeatureIds = new Set(allReqItems.map(r => r.featureId))

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
      beforeId: beforeFeature?.id ?? null,
      afterTitle: afterFeature?.title ?? null,
      afterDesc: afterFeature?.description ?? null,
      afterId: afterFeature?.id ?? null,
      diffChangeType: diffItem?.changeType ?? null,
      status,
    }
  })

  const noReqItems = diffItems.filter(d => !reqFeatureIds.has(d.feature.id))

  const doneCount    = reqRows.filter(r => r.status === 'done').length
  const partialCount = reqRows.filter(r => r.status === 'partial').length
  const notDoneCount = reqRows.filter(r => r.status === 'not-done').length

  const thCls = 'text-left px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider'

  return (
    <div className="p-8 pb-24 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/projects/${id}/sprint-review`} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1 mb-3">
          ← Sprint Review
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">สรุปการแก้ไข</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">เปรียบเทียบ Requirement กับโค้ดจริง</p>
          </div>
          <div className="flex items-center gap-4">
            {allReqItems.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[var(--status-green)]">✓ {doneCount} เสร็จ</span>
                <span className="text-[var(--status-yellow)]">! {partialCount} ไม่ถูก</span>
                <span className="text-[var(--status-red)]">✗ {notDoneCount} ยังไม่ครบ</span>
              </div>
            )}
            <UpdateKnowledgeButton
              projectId={id}
              jobId={latestJob.id}
              nextVersion={nextVersion}
              alreadyApproved={alreadyApproved}
            />
          </div>
        </div>
      </div>

      {/* Comparison table */}
      {allReqItems.length > 0 ? (
        <div className="mb-10">
          <SummaryTable rows={reqRows} />
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl mb-10">
          <p className="text-sm text-[var(--text-muted)]">ยังไม่มี Sprint Requirement — กลับไปอัปโหลดที่หน้า Sprint Review</p>
        </div>
      )}

      {/* No-req diff items */}
      {noReqItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold text-[var(--text-muted)]">โค้ดที่เปลี่ยนแต่ไม่มีใน Requirement</p>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">{noReqItems.length} รายการ</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                  <th className={thCls}>ประเภท</th>
                  <th className={`${thCls} w-[30%]`}>ก่อนแก้</th>
                  <th className={`${thCls} w-[30%]`}>หลังแก้</th>
                  <th className={thCls}>หมวดหมู่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {noReqItems.map(item => {
                  const beforeFeature: Feature | null =
                    item.changeType === 'added'   ? null :
                    item.changeType === 'removed' ? item.feature :
                    item.oldFeature
                  const afterFeature: Feature | null =
                    item.changeType === 'removed' ? null : item.feature
                  return (
                    <tr key={item.feature.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-4 py-4">
                        <DiffTypeBadge type={item.changeType} />
                      </td>
                      <td className="px-4 py-4">
                        {beforeFeature ? (
                          <>
                            <p className="text-sm text-[var(--text-primary)] leading-snug">{beforeFeature.title}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{beforeFeature.id}</p>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">ไม่มีก่อนหน้านี้</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {afterFeature ? (
                          <>
                            <p className="text-sm text-[var(--text-primary)] leading-snug">{afterFeature.title}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{afterFeature.id}</p>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">ถูกลบออกแล้ว</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-[var(--text-muted)]">{item.feature.category ?? '—'}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
