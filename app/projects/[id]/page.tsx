export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { DiffResult } from '@/lib/types'
import { MockJobButton } from '@/components/MockJobButton'
import { ResetJobsButton } from '@/components/ResetJobsButton'

interface SprintReqItem {
  featureId: string
  changeType: 'add' | 'modify' | 'remove'
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const [jobs, knowledgeDocs, latestDoneJob] = await Promise.all([
    db.analysisJob.findMany({ where: { projectId: id }, select: { status: true } }),
    db.knowledgeDoc.findMany({
      where: { projectId: id },
      orderBy: { version: 'desc' },
    }),
    db.analysisJob.findFirst({
      where: { projectId: id, status: 'DONE' },
      orderBy: { triggeredAt: 'desc' },
      include: {
        updateDoc: { select: { diff: true } },
        sprintRequirements: true,
      },
    }),
  ])

  // ── Code diff stats (current code vs Knowledge Doc v1) ──
  const diff = latestDoneJob?.updateDoc?.diff as DiffResult | undefined
  const addedCount    = diff?.added?.length ?? 0
  const modifiedCount = diff?.modified?.length ?? 0
  const removedCount  = diff?.removed?.length ?? 0

  // ── Sprint requirement stats ──
  const sprintRequirements = latestDoneJob?.sprintRequirements ?? []
  const hasReq = sprintRequirements.length > 0

  let doneCount = 0
  let partialCount = 0
  let notDoneCount = 0

  if (hasReq && diff) {
    const allReqItems = sprintRequirements.flatMap(r => r.items as unknown as SprintReqItem[])
    const reqMap = new Map(allReqItems.map(r => [r.featureId, r]))

    const diffItems = [
      ...(diff.added ?? []).map(f => ({ featureId: f.id, changeType: 'added' as const, req: reqMap.get(f.id) ?? null })),
      ...(diff.modified ?? []).map(c => ({ featureId: c.new.id, changeType: 'modified' as const, req: reqMap.get(c.new.id) ?? null })),
      ...(diff.removed ?? []).map(f => ({ featureId: f.id, changeType: 'removed' as const, req: reqMap.get(f.id) ?? null })),
    ]

    const diffFeatureIds = new Set(diffItems.map(i => i.featureId))

    for (const item of diffItems) {
      if (!item.req) continue
      const match =
        (item.req.changeType === 'add'    && item.changeType === 'added') ||
        (item.req.changeType === 'modify' && item.changeType === 'modified') ||
        (item.req.changeType === 'remove' && item.changeType === 'removed')
      if (match) doneCount++
      else partialCount++
    }

    const seen = new Set<string>()
    for (const r of allReqItems) {
      if (!diffFeatureIds.has(r.featureId) && !seen.has(r.featureId)) {
        notDoneCount++
        seen.add(r.featureId)
      }
    }
  }

  return (
    <div className="p-8 pb-24 max-w-2xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">ภาพรวมโปรเจกต์</p>
        </div>
        <MockJobButton projectId={id} label="จำลอง Code Push" />
        <ResetJobsButton projectId={id} />
      </div>

      {/* ── Code diff vs Knowledge Doc v1 ── */}
      {(addedCount + modifiedCount + removedCount) > 0 && (
        <section className="mb-6">
          <p className="text-xs text-[var(--text-muted)] mb-3">การเปลี่ยนแปลงโค้ดล่าสุด เทียบกับ Knowledge Doc</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-card)] border border-green-800/25 rounded-xl px-4 py-4">
              <p className="text-2xl font-bold text-[var(--status-green)]">{addedCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">เพิ่มใหม่</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-yellow-800/25 rounded-xl px-4 py-4">
              <p className="text-2xl font-bold text-[var(--status-yellow)]">{modifiedCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">แก้ไข</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-red-800/25 rounded-xl px-4 py-4">
              <p className="text-2xl font-bold text-[var(--status-red)]">{removedCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">ลบออก</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Sprint requirement progress (shown only if req uploaded) ── */}
      {hasReq && (
        <section className="mb-10">
          <p className="text-xs text-[var(--text-muted)] mb-3">ความคืบหน้า Sprint Requirement</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-card)] border border-green-800/25 rounded-xl px-4 py-4">
              <p className="text-2xl font-bold text-[var(--status-green)]">{doneCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">เสร็จแล้ว</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-yellow-800/25 rounded-xl px-4 py-4">
              <p className="text-2xl font-bold text-[var(--status-yellow)]">{partialCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">ไม่ถูกต้อง</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-red-800/25 rounded-xl px-4 py-4">
              <p className="text-2xl font-bold text-[var(--status-red)]">{notDoneCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">ยังไม่ครบ</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Knowledge Docs ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Knowledge Doc</h3>
          <Link href={`/projects/${id}/knowledge`} className="text-xs text-[var(--accent)] hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>

        {knowledgeDocs.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
            <p className="text-xs text-[var(--text-muted)]">ยังไม่มี Knowledge Doc</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {knowledgeDocs.map(doc => {
              const features = (doc.features as unknown as any[]) ?? []
              return (
                <Link
                  key={doc.id}
                  href={`/projects/${id}/knowledge`}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3.5 hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-[var(--text-primary)]">v{doc.version}</span>
                    <span className="text-[10px] text-[var(--status-green)] bg-green-900/15 px-2 py-0.5 rounded-full">อนุมัติแล้ว</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">{features.length} ฟีเจอร์</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[var(--text-muted)]">โดย {doc.approvedBy}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {new Date(doc.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
