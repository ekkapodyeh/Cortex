import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { DiffResult, Feature } from '@/lib/types'
import { IMPACT } from '@/lib/impact-data'
import { SubcategoryList } from './SubcategoryList'
import type { SubcategoryGroup } from './SubcategoryList'
import { SprintReviewRightPanel } from '../SprintReviewRightPanel'

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

  // All categories for the side nav
  const allCategories = [...new Set(allItems.map(i => i.feature.category ?? 'ทั่วไป'))]

  const catItems = allItems.filter(i => (i.feature.category ?? 'ทั่วไป') === cat)

  const subMap = new Map<string, RawItem[]>()
  for (const item of catItems) {
    if (!subMap.has(item.subcategory)) subMap.set(item.subcategory, [])
    subMap.get(item.subcategory)!.push(item)
  }

  const allReqItems = allSprintRequirements.flatMap(r => r.items as any[])
  const reqMap = new Map(allReqItems.map((r: any) => [r.featureId, r as any]))
  const hasReq = allSprintRequirements.length > 0

  // Requirements for this category not yet implemented (not in diff) → show as pending or incorrect
  const diffFeatureIds = new Set(allItems.map(i => i.id))
  const pendingReqItems = hasReq
    ? allReqItems.filter((r: any) => r.category === cat && !diffFeatureIds.has(r.featureId))
    : []

  for (const r of pendingReqItems) {
    const sub: string = r.subcategory ?? ''
    if (!subMap.has(sub)) subMap.set(sub, [])
    subMap.get(sub)!.push({
      id: r.featureId,
      changeType: r.changeType === 'remove' ? 'removed' : r.changeType === 'modify' ? 'modified' : 'added',
      subcategory: sub,
      feature: { id: r.featureId, title: r.title, description: r.description, category: cat, subcategory: sub } as Feature,
      oldFeature: null,
      _synthetic: true,
      _reqChangeType: r.changeType as string,
      _reqEntry: r,
    } as any)
  }

  const groups: SubcategoryGroup[] = Array.from(subMap.entries()).map(([sub, its]) => ({
    sub,
    items: its.map((i: any) => {
      if (i._synthetic) {
        const reqChangeType = i._reqChangeType as string
        const reqEntry = i._reqEntry as any
        return {
          id: i.id,
          changeType: i.changeType,
          oldTitle: reqChangeType !== 'add' ? (reqEntry.title ?? null) : null,
          oldDescription: null,
          newTitle: reqEntry.title ?? i.feature.title,
          newDescription: reqEntry.description ?? i.feature.description ?? null,
          impact: null,
          reqStatus: (reqChangeType === 'add' ? 'pending' : 'incorrect') as 'pending' | 'incorrect',
          reqNote: reqEntry.description ?? reqEntry.title ?? null,
          isSynthetic: true,
        }
      }

      const req = reqMap.get(i.id)
      const reqChangeType = req?.changeType as string | undefined
      let reqStatus: 'done' | 'incorrect' | 'no-req' | null = null
      if (hasReq) {
        if (!reqChangeType) {
          reqStatus = 'no-req'
        } else {
          const match =
            (reqChangeType === 'add' && i.changeType === 'added') ||
            (reqChangeType === 'modify' && i.changeType === 'modified') ||
            (reqChangeType === 'remove' && i.changeType === 'removed')
          reqStatus = match ? 'done' : 'incorrect'
        }
      }
      return {
        id: i.id,
        changeType: i.changeType,
        oldTitle: i.oldFeature?.title ?? null,
        oldDescription: i.oldFeature?.description ?? null,
        newTitle: i.feature.title,
        newDescription: i.feature.description ?? null,
        impact: IMPACT[i.feature.id] ?? null,
        reqStatus,
        reqNote: (req as any)?.description ?? (req as any)?.title ?? null,
        isSynthetic: false,
      }
    }),
  }))

  const sprintDocs = allSprintRequirements.map(r => ({
    id: r.id,
    fileName: r.fileName ?? null,
    createdBy: r.createdBy,
    items: r.items as unknown as any[],
  }))

  return (
    <div className="pt-[48px] px-[32px] pb-24 pr-[320px]">
      <div className="max-w-[808px] mx-auto flex gap-8">
        {/* Category side nav */}
        <nav className="w-[200px] shrink-0 pt-1">
          <div className="sticky top-12 flex flex-col gap-0.5">
            {allCategories.map(c => (
              <Link
                key={c}
                href={`/projects/${id}/sprint-review/detail?cat=${encodeURIComponent(c)}`}
                className={`text-[14px] px-3 py-2 transition-colors leading-snug ${
                  c === cat
                    ? 'font-semibold text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-[48px]">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/projects/${id}/sprint-review`}
              className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[var(--text-primary)] transition-colors w-fit"
            >
              <CaretLeftIcon size={12} />
              Sprint Review
            </Link>
            <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">{cat}</h2>
          </div>

          {/* Content */}
          {groups.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">ไม่มีรายการในหมวดนี้</p>
          ) : (
            <SubcategoryList groups={groups} hasReq={hasReq} />
          )}
        </div>
      </div>

      <SprintReviewRightPanel
        projectId={id}
        jobId={latestJob.id}
        commitSha={latestJob.commitSha}
        commitMsg={latestJob.commitMsg ?? ''}
        author={latestJob.author}
        triggeredAt={latestJob.triggeredAt.toISOString()}
        diffResult={diff}
        sprintDocs={sprintDocs}
        noDiff={false}
      />
    </div>
  )
}
