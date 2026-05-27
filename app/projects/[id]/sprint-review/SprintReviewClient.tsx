'use client'

import Link from 'next/link'
import type { Feature, DiffResult } from '@/lib/types'
import { CaretRightIcon } from '@phosphor-icons/react'
import { SprintReviewRightPanel, type SprintDoc } from './SprintReviewRightPanel'

type ChangeType = 'added' | 'modified' | 'removed'

interface FeatureItem {
  feature: Feature
  oldFeature: Feature | null
  changeType: ChangeType
  category: string
  subcategory: string
}

function CategoryCard({ cat, items, projectId, updatedAt, reqMap, pendingCount }: {
  cat: string; items: FeatureItem[]; projectId: string; updatedAt: string
  reqMap: Map<string, string> | null
  pendingCount: number
}) {
  const addedCount = items.filter(i => i.changeType === 'added').length
  const modifiedCount = items.filter(i => i.changeType === 'modified').length
  const removedCount = items.filter(i => i.changeType === 'removed').length

  let doneCount = 0, totalReq = 0
  if (reqMap) {
    for (const item of items) {
      const reqChangeType = reqMap.get(item.feature.id)
      if (!reqChangeType) continue
      totalReq++
      const match =
        (reqChangeType === 'add' && item.changeType === 'added') ||
        (reqChangeType === 'modify' && item.changeType === 'modified') ||
        (reqChangeType === 'remove' && item.changeType === 'removed')
      if (match) doneCount++
    }
    totalReq += pendingCount
  }

  const hasReq = reqMap !== null && totalReq > 0
  const allDone = hasReq && doneCount === totalReq

  return (
    <Link
      href={`/projects/${projectId}/sprint-review/detail?cat=${encodeURIComponent(cat)}`}
      className="bg-[#222] rounded-xl p-5 flex items-center gap-4 hover:brightness-105 transition-all"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="font-['IBM_Plex_Sans_Thai',_sans-serif] font-semibold text-base text-[var(--text-primary)]">{cat}</p>
        <p className="font-['IBM_Plex_Sans_Thai',_sans-serif] text-xs text-[var(--text-muted)]">อัปเดตล่าสุด {new Date(updatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasReq ? (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            allDone
              ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
              : 'text-[var(--status-yellow)] bg-[rgba(115,62,10,0.15)]'
          }`}>
            {doneCount}/{totalReq} สำเร็จ
          </span>
        ) : (
          <>
            {addedCount > 0 && <span className="text-xs font-medium text-[var(--status-green)] bg-[rgba(13,84,43,0.15)] px-2 py-0.5 rounded">+{addedCount}</span>}
            {modifiedCount > 0 && <span className="text-xs font-medium text-[var(--status-yellow)] bg-[rgba(115,62,10,0.15)] px-2 py-0.5 rounded">~{modifiedCount}</span>}
            {removedCount > 0 && <span className="text-xs font-medium text-[var(--status-red)] bg-[rgba(130,24,26,0.15)] px-2 py-0.5 rounded">-{removedCount}</span>}
          </>
        )}
        <CaretRightIcon size={14} className="text-[var(--text-muted)]" />
      </div>
    </Link>
  )
}

interface Props {
  projectId: string
  jobId: string
  diffResult: DiffResult
  sprintDocs: SprintDoc[]
  commitSha: string
  commitMsg: string
  author: string
  triggeredAt: string
  mockButton?: React.ReactNode
  resetButton?: React.ReactNode
  historyHref?: string
  noDiff?: boolean
}

export function SprintReviewClient({ projectId, jobId, diffResult, sprintDocs, commitSha, commitMsg, author, triggeredAt, mockButton, resetButton, noDiff }: Props) {
  const items: FeatureItem[] = [
    ...(diffResult.added ?? []).map(f => ({ feature: f, oldFeature: null, changeType: 'added' as const, category: f.category ?? 'ทั่วไป', subcategory: f.subcategory ?? '' })),
    ...(diffResult.modified ?? []).map(c => ({ feature: c.new, oldFeature: c.old, changeType: 'modified' as const, category: c.new.category ?? 'ทั่วไป', subcategory: c.new.subcategory ?? '' })),
    ...(diffResult.removed ?? []).map(f => ({ feature: f, oldFeature: null, changeType: 'removed' as const, category: f.category ?? 'ทั่วไป', subcategory: f.subcategory ?? '' })),
  ]

  const categoryMap = new Map<string, FeatureItem[]>()
  for (const item of items) {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, [])
    categoryMap.get(item.category)!.push(item)
  }
  const groups = Array.from(categoryMap.entries()).map(([cat, features]) => ({ cat, features }))

  const allReqItems = sprintDocs.flatMap(d => d.items as any[])
  const reqMap: Map<string, string> | null = sprintDocs.length > 0
    ? new Map(allReqItems.map((r: any) => [r.featureId, r.changeType]))
    : null

  const diffFeatureIds = new Set([
    ...(diffResult.added ?? []).map(f => f.id),
    ...(diffResult.modified ?? []).map(c => c.new.id),
    ...(diffResult.removed ?? []).map(f => f.id),
  ])

  // Pending count per category: req items not yet in any diff
  const pendingByCategory = new Map<string, number>()
  if (reqMap) {
    for (const r of allReqItems as any[]) {
      if (!diffFeatureIds.has(r.featureId)) {
        const c = r.category ?? 'ทั่วไป'
        pendingByCategory.set(c, (pendingByCategory.get(c) ?? 0) + 1)
      }
    }
  }

  return (
    <div className="pt-[48px] px-[32px] pb-24 pr-[320px]">
      <div className="max-w-[896px] mx-auto flex flex-col gap-[48px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-['Poppins',_sans-serif] font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">Sprint Review</h2>
            <p className="font-['IBM_Plex_Sans_Thai',_sans-serif] text-sm text-[var(--text-muted)]">ติดตามการเปลี่ยนแปลงจากโค้ดปัจจุบัน</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mockButton}
            {resetButton}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {noDiff && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse shrink-0" />
              <p className="text-sm text-[var(--text-muted)]">รอการวิเคราะห์โค้ด — ยังไม่มี Code Push ใหม่ รายการด้านล่างจึงแสดงเป็น <span className="text-[var(--status-red)]">ยังไม่ครบ</span> ทั้งหมด</p>
            </div>
          )}

          {reqMap ? (() => {
            const getDone = (features: FeatureItem[]) => {
              let done = 0, total = 0
              for (const item of features) {
                const req = reqMap.get(item.feature.id)
                if (!req) continue
                total++
                if ((req === 'add' && item.changeType === 'added') || (req === 'modify' && item.changeType === 'modified') || (req === 'remove' && item.changeType === 'removed')) done++
              }
              return { done, total }
            }
            const notDone = groups.filter(({ features }) => { const { done, total } = getDone(features); return total > 0 && done < total })
            const done = groups.filter(({ features }) => { const { done, total } = getDone(features); return total === 0 || done === total })

            return (
              <div className="flex flex-col gap-[48px]">
                {notDone.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[20px] font-semibold text-[var(--status-red)]">ยังไม่สำเร็จ ({notDone.length})</p>
                    {notDone.map(({ cat, features }) => (
                      <CategoryCard key={cat} cat={cat} items={features} projectId={projectId} updatedAt={triggeredAt} reqMap={reqMap} pendingCount={pendingByCategory.get(cat) ?? 0} />
                    ))}
                  </div>
                )}
                {done.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[20px] font-semibold text-[var(--status-green)]">สำเร็จแล้ว ({done.length})</p>
                    {done.map(({ cat, features }) => (
                      <CategoryCard key={cat} cat={cat} items={features} projectId={projectId} updatedAt={triggeredAt} reqMap={reqMap} pendingCount={pendingByCategory.get(cat) ?? 0} />
                    ))}
                  </div>
                )}
              </div>
            )
          })() : (
            <div className="flex flex-col gap-4">
              {groups.map(({ cat, features }) => (
                <CategoryCard key={cat} cat={cat} items={features} projectId={projectId} updatedAt={triggeredAt} reqMap={reqMap} pendingCount={pendingByCategory.get(cat) ?? 0} />
              ))}
            </div>
          )}
        </div>
      </div>

      <SprintReviewRightPanel
        projectId={projectId}
        jobId={jobId}
        commitSha={commitSha}
        commitMsg={commitMsg}
        author={author}
        triggeredAt={triggeredAt}
        diffResult={diffResult}
        sprintDocs={sprintDocs}
        noDiff={noDiff ?? false}
      />
    </div>
  )
}
