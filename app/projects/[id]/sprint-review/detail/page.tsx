import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeftIcon, PresentationChartIcon } from '@phosphor-icons/react/dist/ssr'
import type { DiffResult, Feature } from '@/lib/types'
import { IMPACT } from '@/lib/impact-data'
import { SubcategoryList } from './SubcategoryList'
import type { SubcategoryGroup } from './SubcategoryList'

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cat?: string }>
}) {
  const { id } = await params
  const { cat } = await searchParams

  if (!cat) notFound()

  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const latestJob = await db.analysisJob.findFirst({
    where: { projectId: id, status: 'DONE', updateDoc: { status: 'PENDING' } },
    orderBy: { triggeredAt: 'desc' },
    include: { updateDoc: true },
  })

  if (!latestJob?.updateDoc) notFound()

  const diff = latestJob.updateDoc.diff as unknown as DiffResult

  const allSprintRequirements = await db.sprintRequirement.findMany({
    where: { job: { projectId: id } },
    orderBy: { createdAt: 'asc' },
  })

  // Build flat items filtered by category
  type RawItem = {
    id: string
    changeType: 'added' | 'modified' | 'removed'
    subcategory: string
    feature: Feature
    oldFeature: Feature | null
  }

  const allItems: RawItem[] = [
    ...(diff.added ?? []).map(f => ({ id: f.id, changeType: 'added' as const, subcategory: f.subcategory ?? '', feature: f, oldFeature: null })),
    ...(diff.modified ?? []).map(c => ({ id: c.new.id, changeType: 'modified' as const, subcategory: c.new.subcategory ?? '', feature: c.new, oldFeature: c.old })),
    ...(diff.removed ?? []).map(f => ({ id: f.id, changeType: 'removed' as const, subcategory: f.subcategory ?? '', feature: f, oldFeature: null })),
  ]

  const catItems = allItems.filter(i => (i.feature.category ?? 'ทั่วไป') === cat)

  // Group by subcategory
  const subMap = new Map<string, RawItem[]>()
  for (const item of catItems) {
    if (!subMap.has(item.subcategory)) subMap.set(item.subcategory, [])
    subMap.get(item.subcategory)!.push(item)
  }

  const groups: SubcategoryGroup[] = Array.from(subMap.entries()).map(([sub, its]) => ({
    sub,
    items: its.map(i => ({
      id: i.id,
      changeType: i.changeType,
      oldTitle: i.oldFeature?.title ?? null,
      oldDescription: i.oldFeature?.description ?? null,
      newTitle: i.feature.title,
      newDescription: i.feature.description ?? null,
      impact: IMPACT[i.feature.id] ?? null,
    })),
  }))

  const addedCount = (diff.added ?? []).length
  const modifiedCount = (diff.modified ?? []).length
  const removedCount = (diff.removed ?? []).length

  return (
    <div className="p-6 pr-[320px]">
      <div className="max-w-[832px] mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href={`/projects/${id}/sprint-review`}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <CaretLeftIcon size={14} />
            Sprint Review
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{cat}</span>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">ไม่มีรายการในหมวดนี้</p>
        ) : (
          <SubcategoryList groups={groups} />
        )}
      </div>

      {/* ─── Right panel (fixed) ─── */}
      <div className="fixed top-0 right-0 h-screen w-72 overflow-y-auto py-8 px-6 bg-[var(--bg-base)] z-10 space-y-4">
        {/* Commit info */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex flex-col gap-1.5">
          <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded self-start">
            {latestJob.commitSha.slice(0, 7)}
          </code>
          <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{latestJob.commitMsg || 'ไม่มี commit message'}</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {latestJob.author} · {new Date(latestJob.triggeredAt).toLocaleString('th-TH')}
          </p>
        </div>

        {/* Diff summary chips */}
        <div className="grid grid-cols-2 gap-2">
          {addedCount > 0 && (
            <div className="flex items-center gap-2 bg-green-900/15 border border-green-800/30 rounded-xl px-3 py-2.5">
              <span className="text-base font-bold text-[var(--status-green)]">{addedCount}</span>
              <span className="text-xs text-[var(--status-green)]">เพิ่มใหม่</span>
            </div>
          )}
          {modifiedCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-900/15 border border-yellow-800/30 rounded-xl px-3 py-2.5">
              <span className="text-base font-bold text-[var(--status-yellow)]">{modifiedCount}</span>
              <span className="text-xs text-[var(--status-yellow)]">แก้ไข</span>
            </div>
          )}
          {removedCount > 0 && (
            <div className="flex items-center gap-2 bg-red-900/15 border border-red-800/30 rounded-xl px-3 py-2.5">
              <span className="text-base font-bold text-[var(--status-red)]">{removedCount}</span>
              <span className="text-xs text-[var(--status-red)]">ลบออก</span>
            </div>
          )}
        </div>

        {/* Sprint docs */}
        {allSprintRequirements.map(r => (
          <div key={r.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{r.fileName ?? 'requirement.pdf'}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">โดย {r.createdBy}</p>
            </div>
          </div>
        ))}

        {/* Summary button */}
        <Link
          href={`/projects/${id}/sprint-review/summary`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PresentationChartIcon size={16} />
          สรุปการแก้ไข
        </Link>
      </div>
    </div>
  )
}
