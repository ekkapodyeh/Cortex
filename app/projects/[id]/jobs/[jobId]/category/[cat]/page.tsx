export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Feature, DiffResult, ValidationResult } from '@/lib/types'

type MatchStatus = 'correct' | 'partial' | 'missing'

function MatchBadge({ status }: { status: MatchStatus }) {
  if (status === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-[var(--status-green)] bg-green-900/20">
        ✓ ถูกต้องตาม Requirement
      </span>
    )
  }
  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-[var(--status-yellow)] bg-yellow-900/20">
        ~ ไม่ถูกต้องตาม Requirement
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-[var(--status-red)] bg-red-900/20">
      ✗ ไม่มีใน Requirement
    </span>
  )
}

function ChangeBadge({ type }: { type: 'added' | 'modified' | 'removed' }) {
  const styles = {
    added:    'text-[var(--status-green)] bg-green-900/10',
    modified: 'text-[var(--status-yellow)] bg-yellow-900/10',
    removed:  'text-[var(--status-red)] bg-red-900/10',
  }
  const labels = { added: '+ เพิ่มใหม่', modified: '~ แก้ไข', removed: '− ลบออก' }
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function FeatureCard({ item, borderColor }: { item: FeatureItem; borderColor: string }) {
  return (
    <div className={`bg-[var(--bg-card)] border ${borderColor} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{item.feature.title}</p>
        <MatchBadge status={item.status} />
      </div>

      {/* Compare grid: change type | ของเดิม | ของใหม่ | Requirement */}
      <div className="grid grid-cols-[110px_1fr_1fr_1fr] divide-x divide-[var(--border)]">
        {/* Change type column */}
        <div className="px-3 py-4 flex items-center justify-center">
          <ChangeBadge type={item.changeType} />
        </div>

        {/* ของเดิม */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">ของเดิม</p>
          {item.oldFeature ? (
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.oldFeature.title}</p>
              {item.oldFeature.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.oldFeature.description}</p>
              )}
            </div>
          ) : item.changeType === 'added' ? (
            <p className="text-xs text-[var(--text-muted)] italic">ไม่มีก่อนหน้านี้</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.feature.title}</p>
              {item.feature.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.feature.description}</p>
              )}
            </div>
          )}
        </div>

        {/* ของใหม่ */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">ของใหม่</p>
          {item.changeType === 'removed' ? (
            <p className="text-xs text-[var(--status-red)] italic">ถูกลบออกจากโค้ดแล้ว</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.feature.title}</p>
              {item.feature.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.feature.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Requirement */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Requirement</p>
          {item.reqDescription ? (
            <p className="text-xs text-[var(--status-green)] leading-relaxed">{item.reqDescription}</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">ไม่มีใน Requirement</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface FeatureItem {
  feature: Feature
  changeType: 'added' | 'modified' | 'removed'
  oldFeature?: Feature | null
  status: MatchStatus
  reqDescription?: string
}

function resolveStatus(changeType: 'added' | 'modified' | 'removed', inReq: boolean): MatchStatus {
  if (!inReq) return 'missing'
  if (changeType === 'modified') return 'partial'
  return 'correct'
}

function AbsentCard({ feature }: { feature: Feature }) {
  return (
    <div className="bg-[var(--bg-card)] border border-orange-800/30 rounded-xl overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{feature.title}</p>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-orange-400 bg-orange-900/20">
          ⚠ ขาดใน Requirement
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">ของเดิม</p>
          <p className="text-xs text-[var(--text-muted)] italic">ไม่มีในโค้ด</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">ของใหม่</p>
          <p className="text-xs text-[var(--text-muted)] italic">ไม่มีในโค้ด</p>
          {feature.description && (
            <p className="text-xs text-orange-400 mt-2">Requirement: {feature.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string; cat: string }>
}) {
  const { id, jobId, cat } = await params
  const category = decodeURIComponent(cat)

  const job = await db.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      updateDoc: true,
      project: {
        include: {
          requirements: { orderBy: { version: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!job || job.projectId !== id || !job.updateDoc) notFound()

  const diffResult = job.updateDoc.diff as unknown as DiffResult
  const reqFeatures = (job.project.requirements[0]?.features as unknown as Feature[]) ?? []
  const reqMap = new Map(reqFeatures.map(r => [r.id, r]))

  const added   = (diffResult?.added ?? []).filter(f => (f.category ?? 'ทั่วไป') === category)
  const removed = (diffResult?.removed ?? []).filter(f => (f.category ?? 'ทั่วไป') === category)
  const modified = (diffResult?.modified ?? []).filter(
    c => (c.new.category ?? c.old.category ?? 'ทั่วไป') === category
  )

  if (added.length + removed.length + modified.length === 0) notFound()

  // Build unified feature list
  const items: FeatureItem[] = [
    ...added.map(f => ({
      feature: f,
      changeType: 'added' as const,
      status: resolveStatus('added', reqMap.has(f.id)),
      reqDescription: reqMap.get(f.id)?.description,
    })),
    ...modified.map(c => ({
      feature: c.new,
      changeType: 'modified' as const,
      oldFeature: c.old,
      status: resolveStatus('modified', reqMap.has(c.new.id)),
      reqDescription: reqMap.get(c.new.id)?.description,
    })),
    ...removed.map(f => ({
      feature: f,
      changeType: 'removed' as const,
      status: 'missing' as const,
      reqDescription: undefined,
    })),
  ]

  const correctItems  = items.filter(i => i.status === 'correct')
  const partialItems  = items.filter(i => i.status === 'partial')
  const missingItems  = items.filter(i => i.status === 'missing')

  // Req features ที่อยู่ใน category นี้ แต่ไม่โผล่ใน diff เลย
  const diffIds = new Set([
    ...added.map(f => f.id),
    ...modified.map(c => c.new.id),
    ...modified.map(c => c.old.id),
    ...removed.map(f => f.id),
  ])
  const absentReqFeatures = reqFeatures.filter(
    r => (r.category ?? 'ทั่วไป') === category && !diffIds.has(r.id)
  )

  return (
    <div className="p-8 pb-24">
      {/* Back */}
      <Link
        href={`/projects/${id}`}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        ← งานวิเคราะห์ล่าสุด
      </Link>

      {/* Header */}
      <div className="mt-4 mb-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{category}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">เปรียบเทียบกับ Document Requirement</p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 mt-5 mb-8 flex-wrap">
        <div className="flex items-center gap-2 bg-green-900/15 border border-green-800/30 rounded-xl px-5 py-3">
          <span className="text-xl font-bold text-[var(--status-green)]">{correctItems.length}</span>
          <span className="text-sm text-[var(--status-green)]">ถูกต้องตาม Requirement</span>
        </div>
        {partialItems.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-900/15 border border-yellow-800/30 rounded-xl px-5 py-3">
            <span className="text-xl font-bold text-[var(--status-yellow)]">{partialItems.length}</span>
            <span className="text-sm text-[var(--status-yellow)]">ไม่มีตาม Requirement</span>
          </div>
        )}
        {missingItems.length > 0 && (
          <div className="flex items-center gap-2 bg-red-900/15 border border-red-800/30 rounded-xl px-5 py-3">
            <span className="text-xl font-bold text-[var(--status-red)]">{missingItems.length}</span>
            <span className="text-sm text-[var(--status-red)]">ไม่มีใน Requirement</span>
          </div>
        )}
        {absentReqFeatures.length > 0 && (
          <div className="flex items-center gap-2 bg-orange-900/15 border border-orange-800/30 rounded-xl px-5 py-3">
            <span className="text-xl font-bold text-orange-400">{absentReqFeatures.length}</span>
            <span className="text-sm text-orange-400">ขาดใน Requirement</span>
          </div>
        )}
      </div>

      {/* Correct section */}
      {correctItems.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-semibold text-[var(--status-green)] uppercase tracking-wider mb-3">
            ✓ ถูกต้องตาม Requirement
          </p>
          <div className="space-y-3">
            {correctItems.map((item, i) => (
              <FeatureCard key={`${item.feature.id}-${i}`} item={item} borderColor="border-green-800/25" />
            ))}
          </div>
        </section>
      )}

      {/* Partial section */}
      {partialItems.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-semibold text-[var(--status-yellow)] uppercase tracking-wider mb-3">
            ~ ไม่ถูกต้องตาม Requirement
          </p>
          <div className="space-y-3">
            {partialItems.map((item, i) => (
              <FeatureCard key={`${item.feature.id}-${i}`} item={item} borderColor="border-yellow-800/25" />
            ))}
          </div>
        </section>
      )}

      {/* Missing section */}
      {missingItems.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-semibold text-[var(--status-red)] uppercase tracking-wider mb-3">
            ✗ ไม่มีใน Requirement
          </p>
          <div className="space-y-3">
            {missingItems.map((item, i) => (
              <FeatureCard key={`${item.feature.id}-${i}`} item={item} borderColor="border-red-800/25" />
            ))}
          </div>
        </section>
      )}

      {/* Absent-from-code section */}
      {absentReqFeatures.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">
            ⚠ ขาดใน Requirement — มีใน Req แต่ไม่ปรากฏในโค้ดเลย
          </p>
          <div className="space-y-3">
            {absentReqFeatures.map(f => (
              <AbsentCard key={f.id} feature={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
