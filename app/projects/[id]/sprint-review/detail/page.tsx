import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { DiffResult, Feature } from '@/lib/types'
import { IMPACT } from '@/lib/impact-data'
import { SubcategoryList } from './SubcategoryList'
import type { SubcategoryGroup, JobCommit } from './SubcategoryList'
import { SprintReviewRightPanel } from '../SprintReviewRightPanel'
import { getProjectMock } from '@/lib/sprint-mocks'
import { compareConditions } from '@/lib/compare-conditions'
import type { ConditionResult } from '@/lib/types'

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cat?: string; sprintId?: string }>
}) {
  const { id } = await params
  const { cat, sprintId } = await searchParams

  if (!cat) notFound()

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

  const hasPendingDiff = !!latestJob?.updateDoc && latestJob.updateDoc.status === 'PENDING'
  const diff: DiffResult = hasPendingDiff
    ? (latestJob!.updateDoc!.diff as unknown as DiffResult)
    : { added: [], modified: [], removed: [] }

  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })
  const activeSprintRaw = (sprintId ? sprints.find(s => s.id === sprintId) : null) ?? sprints.find(s => s.status === 'OPEN') ?? sprints[sprints.length - 1] ?? null
  const allSprintRequirements = activeSprintRaw?.requirements ?? []
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

  if (!hasPendingDiff && allSprintRequirements.length === 0) notFound()

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

  const allReqCategories = allSprintRequirements
    .flatMap(r => r.items as any[])
    .map(r => (r.category ?? 'ทั่วไป') as string)

  const allCategories = [...new Set([
    ...allItems.map(i => i.feature.category ?? 'ทั่วไป'),
    ...allReqCategories,
  ])]

  const catItems = allItems.filter(i => (i.feature.category ?? 'ทั่วไป') === cat)

  const subMap = new Map<string, RawItem[]>()
  for (const item of catItems) {
    if (!subMap.has(item.subcategory)) subMap.set(item.subcategory, [])
    subMap.get(item.subcategory)!.push(item)
  }

  const allReqItems: any[] = allSprintRequirements.flatMap(r => r.items as any[])
  const reqMap = new Map<string, any>()
  for (const r of allReqItems) {
    reqMap.set(r.featureId, r)
    // also map base featureId (strip -partN suffix) so diff items still match
    const baseId = r.featureId.replace(/-part\d+$/, '')
    if (baseId !== r.featureId && !reqMap.has(baseId)) reqMap.set(baseId, r)
  }
  const hasReq = allReqItems.length > 0

  // Requirements for this category not yet implemented (not in diff) → show as pending or incorrect
  const diffFeatureIds = new Set(allItems.map(i => i.id))
  const pendingReqItems = hasReq
    ? allReqItems.filter((r: any) => {
        if (r.category !== cat) return false
        if (diffFeatureIds.has(r.featureId)) return false
        // ถ้าเป็น split item (part1) และ base featureId อยู่ใน diff แล้ว → ไม่ต้องแสดงซ้ำ
        const baseId = r.featureId.replace(/-part\d+$/, '')
        if (baseId !== r.featureId && diffFeatureIds.has(baseId)) return false
        return true
      })
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

  const jobCommit: JobCommit | null = latestJob ? {
    sha: latestJob.commitSha,
    message: latestJob.commitMsg ?? '',
    author: latestJob.author,
    date: latestJob.triggeredAt.toISOString(),
  } : null

  const groups: SubcategoryGroup[] = await Promise.all(
    Array.from(subMap.entries()).map(async ([sub, its]) => ({
      sub,
      items: await Promise.all(its.map(async (i: any) => {
        if (i._synthetic) {
          const reqEntry = i._reqEntry as any
          // ยังไม่มีโค้ด → ทุก condition เป็น missing อัตโนมัติ
          const rawConditions: any[] = reqEntry.conditions?.length
            ? reqEntry.conditions
            : [{ id: `mock-${i.id}-1`, description: reqEntry.title ?? i.feature.title }]
          const conditions: ConditionResult[] = rawConditions.map((c: any) => ({
            id: c.id,
            description: c.description,
            status: 'missing' as const,
          }))
          return {
            id: i.id,
            changeType: i.changeType,
            oldTitle: null,
            oldDescription: null,
            newTitle: reqEntry.title ?? i.feature.title,
            newDescription: reqEntry.description ?? i.feature.description ?? null,
            impact: null,
            reqStatus: 'pending' as const,
            reqNote: reqEntry.title ?? null,
            reqChangeType: (reqEntry.changeType ?? null) as 'add' | 'modify' | 'remove' | null,
            isSynthetic: true,
            commits: [],
            conditions,
          }
        }

        const req = reqMap.get(i.id)
        const reqChangeType = req?.changeType as string | undefined
        let reqStatus: 'done' | 'incorrect' | 'no-req' | null = null
        let changeTypeMismatchReason: string | null = null
        if (hasReq) {
          if (reqChangeType === 'add' && i.changeType === 'added') {
            reqStatus = 'done'
          } else if (reqChangeType === 'add') {
            reqStatus = 'incorrect'
            const actual = i.changeType === 'modified' ? 'แก้ไขของเดิม' : i.changeType === 'removed' ? 'ลบออก' : i.changeType
            changeTypeMismatchReason = `Req ต้องการเพิ่มฟีเจอร์ใหม่ แต่โค้ดทำการ${actual}`
          } else {
            reqStatus = 'no-req'
          }
        }

        let conditions: ConditionResult[] = []
        let conditionsCompared = false
        const reqConditions = (req as any)?.conditions?.length
          ? (req as any).conditions
          : req ? [{ id: `mock-${i.id}-1`, description: (req as any).title ?? i.feature.title }] : []

        if (reqConditions.length) {
          try {
            conditions = await compareConditions(reqConditions, i.feature.description ?? '')
            conditionsCompared = true
          } catch {
            // mock: ถ้า reqStatus done → match ทั้งหมด, ถ้าไม่ → สลับ wrong/missing
            conditions = reqConditions.map((c: any, idx: number) => ({
              id: c.id,
              description: c.description,
              status: reqStatus === 'done' ? ('match' as const) : idx % 2 === 0 ? ('wrong' as const) : ('missing' as const),
              note: reqStatus !== 'done' && idx % 2 === 0 ? `โค้ดทำ: ${i.feature.description?.slice(0, 60) ?? '—'}` : undefined,
            }))
            conditionsCompared = true
          }
          // ให้ conditions เป็นตัวตัดสิน reqStatus เฉพาะเมื่อ compare สำเร็จ
          if (conditionsCompared && reqStatus === 'done') {
            const hasIssue = conditions.some(c => c.status === 'wrong' || c.status === 'missing')
            if (hasIssue) reqStatus = 'incorrect'
          }
        }

        return {
          id: i.id,
          changeType: i.changeType,
          oldTitle: null,
          oldDescription: null,
          newTitle: i.feature.title,
          newDescription: i.feature.description ?? null,
          impact: IMPACT[i.feature.id] ?? null,
          reqStatus,
          reqNote: (req as any)?.title ?? null,
          reqChangeType: (req as any)?.changeType ?? null,
          isSynthetic: false,
          commits: jobCommit ? [jobCommit] : [],
          conditions,
          changeTypeMismatchReason,
        }
      })).then(items => items.sort((a, b) => {
        const order = { pending: 0, 'no-req': 1, incorrect: 2, done: 3, null: 4 }
        return (order[a.reqStatus as keyof typeof order] ?? 4) - (order[b.reqStatus as keyof typeof order] ?? 4)
      })),
    }))
  )

  // MOCK: แสดงครบ 4 เคส พร้อมข้อมูลสมจริง
  const mockGroups: SubcategoryGroup[] = [
    {
      sub: 'การจัดการสต็อกสินค้า',
      items: [
        // เคส 1: ถูกต้อง — ทำครบตาม Req ทุก condition
        {
          id: 'mock-done-1',
          changeType: 'added' as const,
          oldTitle: null,
          oldDescription: null,
          newTitle: 'เพิ่มสินค้าใหม่เข้าคลัง',
          newDescription: 'พนักงานกรอก ชื่อสินค้า หมวดหมู่ จำนวน ราคาต้นทุน และกำหนด Reorder Point ระบบบันทึกและแสดงสินค้าใหม่ในรายการทันที',
          impact: null,
          reqStatus: 'done' as const,
          reqNote: 'พนักงานสามารถเพิ่มสินค้าใหม่พร้อมกำหนด Reorder Point ได้',
          reqChangeType: 'add' as const,
          isSynthetic: false,
          commits: [],
          changeTypeMismatchReason: null,
          conditions: [
            { id: 'mock-d1-c1', description: 'กรอกชื่อสินค้า หมวดหมู่ จำนวน และราคาต้นทุนได้', status: 'match' as const, note: undefined },
            { id: 'mock-d1-c2', description: 'กำหนดค่า Reorder Point ต่อสินค้าได้', status: 'match' as const, note: undefined },
            { id: 'mock-d1-c3', description: 'สินค้าใหม่แสดงในรายการทันทีหลังบันทึก', status: 'match' as const, note: undefined },
          ],
        },
        // เคส 2: ไม่ถูกต้อง — ทำไม่ครบ Req บางข้อยังขาด
        {
          id: 'mock-wrong-1',
          changeType: 'added' as const,
          oldTitle: null,
          oldDescription: null,
          newTitle: 'ค้นหาสินค้าในคลัง',
          newDescription: 'ค้นหาด้วย keyword ชื่อสินค้า แสดงผลทันทีขณะพิมพ์ ยังไม่รองรับกรองหลายเงื่อนไขพร้อมกัน',
          impact: null,
          reqStatus: 'incorrect' as const,
          reqNote: 'ค้นหาสินค้าได้หลายเงื่อนไขพร้อมกัน และบันทึกประวัติการค้นหา',
          reqChangeType: 'add' as const,
          isSynthetic: false,
          commits: [],
          changeTypeMismatchReason: null,
          conditions: [
            { id: 'mock-w1-c1', description: 'ค้นหาได้หลายเงื่อนไขพร้อมกัน (ชื่อ + หมวดหมู่ + ราคา)', status: 'wrong' as const, note: 'โค้ดทำ: ค้นหาได้เฉพาะชื่อสินค้าเท่านั้น ยังไม่รองรับกรองหลายเงื่อนไข' },
            { id: 'mock-w1-c2', description: 'แสดงผลการค้นหาแบบ real-time ขณะพิมพ์', status: 'match' as const, note: undefined },
            { id: 'mock-w1-c3', description: 'บันทึกประวัติการค้นหา 10 รายการล่าสุด', status: 'missing' as const, note: undefined },
          ],
        },
        // เคส 3: ยังไม่เริ่ม — Req กำหนดมาแต่ยังไม่มีโค้ดเลย
        {
          id: 'mock-pending-1',
          changeType: 'added' as const,
          oldTitle: null,
          oldDescription: null,
          newTitle: 'แจ้งเตือนเมื่อสินค้าใกล้หมด',
          newDescription: 'ระบบตรวจสอบ stock เทียบกับ Reorder Point และแจ้งเตือนผ่าน LINE Notify',
          impact: null,
          reqStatus: 'pending' as const,
          reqNote: 'แจ้งเตือนผ่าน LINE Notify เมื่อสินค้าต่ำกว่า Reorder Point',
          reqChangeType: 'add' as const,
          isSynthetic: true,
          commits: [],
          changeTypeMismatchReason: null,
          conditions: [
            { id: 'mock-p1-c1', description: 'ตรวจสอบ stock เทียบ Reorder Point ทุก 1 ชั่วโมง', status: 'missing' as const, note: undefined },
            { id: 'mock-p1-c2', description: 'ส่งข้อความแจ้งเตือนผ่าน LINE Notify พร้อมชื่อสินค้าและจำนวนคงเหลือ', status: 'missing' as const, note: undefined },
          ],
        },
        // เคส 4: ไม่มีใน Req — โค้ดทำมาแต่ Req ไม่ได้สั่ง
        {
          id: 'mock-noreq-1',
          changeType: 'added' as const,
          oldTitle: null,
          oldDescription: null,
          newTitle: 'Export รายงานสต็อกเป็น PDF',
          newDescription: 'ส่งออกรายงานสรุปสินค้าทั้งหมดพร้อมสถานะ stock เป็นไฟล์ PDF',
          impact: null,
          reqStatus: 'no-req' as const,
          reqNote: null,
          reqChangeType: null,
          isSynthetic: false,
          commits: [],
          changeTypeMismatchReason: null,
          conditions: [],
        },
      ],
    },
  ]
  const groupsWithMock = [...mockGroups, ...groups]

  return (
    <div className="pt-[48px] px-[32px] pb-24 pr-[320px]">
      <div className="max-w-[1200px] mx-auto flex gap-8 items-start">
        {/* Category side nav */}
        <nav className="w-[200px] max-w-[200px] shrink-0 pt-1">
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
              BoltCheck
            </Link>
            <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">{cat}</h2>
          </div>

          {/* Content */}
          {groups.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">ไม่มีรายการในหมวดนี้</p>
          ) : (
            <SubcategoryList groups={groupsWithMock} hasReq={hasReq} />
          )}
        </div>
      </div>

      <SprintReviewRightPanel
        projectId={id}
        jobId={latestJob?.id ?? ''}
        commitSha={latestJob?.commitSha ?? ''}
        commitMsg={latestJob?.commitMsg ?? ''}
        author={latestJob?.author ?? ''}
        triggeredAt={(latestJob?.triggeredAt ?? new Date()).toISOString()}
        diffResult={diff}
        activeSprint={activeSprint}
        noDiff={!hasPendingDiff}
        mockRequirements={mockRequirements}
      />
    </div>
  )
}
