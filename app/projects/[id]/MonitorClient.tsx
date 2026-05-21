'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Feature, DiffResult, ValidationResult, FeatureChange } from '@/lib/types'

interface MonitorClientProps {
  jobId: string
  projectId: string
  commitSha: string
  commitMsg: string
  author: string
  triggeredAt: string
  diffResult: DiffResult
  newFeatures: Feature[]
  oldFeatures: Feature[]
  reqFeatures: Feature[]
  validationResult: ValidationResult | null
  reviewedAt: string | null
  updateDocStatus: string
}

interface CategoryGroup {
  category: string
  added: Feature[]
  removed: Feature[]
  modified: FeatureChange[]
  matchedCount: number
  unmatchedCount: number
  absentCount: number
}

function groupByCategory(diffResult: DiffResult, reqFeatures: Feature[]): CategoryGroup[] {
  const reqIds = new Set(reqFeatures.map(r => r.id))
  const map = new Map<string, CategoryGroup>()

  const get = (cat: string) => {
    if (!map.has(cat)) map.set(cat, { category: cat, added: [], removed: [], modified: [], matchedCount: 0, unmatchedCount: 0, absentCount: 0 })
    return map.get(cat)!
  }

  for (const f of diffResult.added ?? []) {
    const g = get(f.category ?? 'ทั่วไป')
    g.added.push(f)
    reqIds.has(f.id) ? g.matchedCount++ : g.unmatchedCount++
  }
  for (const f of diffResult.removed ?? []) {
    const g = get(f.category ?? 'ทั่วไป')
    g.removed.push(f)
    if (reqIds.has(f.id)) g.unmatchedCount++
  }
  for (const c of diffResult.modified ?? []) {
    const g = get(c.new.category ?? c.old.category ?? 'ทั่วไป')
    g.modified.push(c)
    reqIds.has(c.new.id) ? g.matchedCount++ : g.unmatchedCount++
  }

  // นับ req features ที่อยู่ใน category นี้ แต่ไม่โผล่ใน diff เลย
  const allDiffIds = new Set([
    ...(diffResult.added ?? []).map(f => f.id),
    ...(diffResult.modified ?? []).map(c => c.new.id),
    ...(diffResult.modified ?? []).map(c => c.old.id),
    ...(diffResult.removed ?? []).map(f => f.id),
  ])
  for (const r of reqFeatures) {
    const cat = r.category ?? 'ทั่วไป'
    if (!allDiffIds.has(r.id) && map.has(cat)) {
      map.get(cat)!.absentCount++
    }
  }

  return Array.from(map.values())
}

function ReqNote({ feature, reqFeatures }: { feature: Feature | null; reqFeatures: Feature[] }) {
  if (!feature) return null
  const match = reqFeatures.find(r => r.id === feature.id)
  if (match) {
    return (
      <p className="text-xs mt-2 text-[var(--status-green)]">
        ** Requirement: {match.description} <span className="font-semibold">[ตรง]</span>
      </p>
    )
  }
  return <p className="text-xs mt-2 text-[var(--status-yellow)]">** ไม่มี Requirement</p>
}

function CompareRow({
  oldFeature,
  newFeature,
  reqFeatures,
}: {
  oldFeature: Feature | null
  newFeature: Feature | null
  reqFeatures: Feature[]
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-t border-[var(--border)]">
      {/* ของเดิม */}
      <div className="px-5 py-4">
        {oldFeature ? (
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{oldFeature.title}</p>
            {oldFeature.description && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{oldFeature.description}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">ไม่มีก่อนหน้านี้</p>
        )}
      </div>

      {/* ของใหม่ */}
      <div className="px-5 py-4">
        {newFeature ? (
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{newFeature.title}</p>
            {newFeature.description && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{newFeature.description}</p>
            )}
            <ReqNote feature={newFeature} reqFeatures={reqFeatures} />
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--status-red)]">ลบออก</p>
            <p className="text-xs mt-2 text-[var(--status-yellow)]">** ไม่มี Requirement</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryRow({ group, href }: { group: CategoryGroup; href: string }) {
  const totalBad = group.unmatchedCount + group.absentCount
  const isComplete = totalBad === 0

  return (
    <Link
      href={href}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex items-center justify-between gap-4 px-5 py-4 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)] transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{group.category}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {[
            group.added.length > 0 && `+${group.added.length} เพิ่ม`,
            group.modified.length > 0 && `~${group.modified.length} แก้ไข`,
            group.removed.length > 0 && `−${group.removed.length} ลบ`,
          ].filter(Boolean).join('  ')}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isComplete ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-[var(--status-green)] bg-green-900/20">
            ✓ ครบตาม Requirement
          </span>
        ) : (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-[var(--status-red)] bg-red-900/20">
            ✗ ไม่ครบตาม Requirement {totalBad}
          </span>
        )}
        <span className="text-[var(--text-muted)] text-sm ml-1">→</span>
      </div>
    </Link>
  )
}

export function MonitorClient({
  jobId,
  commitSha,
  commitMsg,
  author,
  triggeredAt,
  diffResult,
  reqFeatures,
  validationResult,
  reviewedAt,
  updateDocStatus,
  projectId,
}: MonitorClientProps) {
  const router = useRouter()
  const [marking, setMarking] = useState(false)
  const [isReviewed, setIsReviewed] = useState(!!reviewedAt)

  async function handleMarkReviewed() {
    setMarking(true)
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markReviewed: true }),
      })
      setIsReviewed(true)
      router.refresh()
    } finally {
      setMarking(false)
    }
  }

  const added = diffResult?.added ?? []
  const removed = diffResult?.removed ?? []
  const modified = diffResult?.modified ?? []
  const missingFromReq = validationResult?.missing ?? []
  const hasChanges = added.length + removed.length + modified.length > 0
  const groups = hasChanges ? groupByCategory(diffResult, reqFeatures) : []

  return (
    <div className="p-8 pb-28">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">งานวิเคราะห์ล่าสุด</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">ติดตามการเปลี่ยนแปลงของโปรเจกต์</p>
      </div>

      {/* Commit info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-1 rounded shrink-0">
            {commitSha.slice(0, 7)}
          </code>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{commitMsg || 'ไม่มี commit message'}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {author} · {new Date(triggeredAt).toLocaleString('th-TH')}
            </p>
          </div>
        </div>
        {isReviewed && (
          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full text-[var(--status-green)] bg-green-900/20">
            ✓ ตรวจแล้ว
          </span>
        )}
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-[var(--status-green)]">{added.length}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">เพิ่มใหม่</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-[var(--status-yellow)]">{modified.length}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">แก้ไข</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-[var(--status-red)]">{removed.length}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">ลบออก</p>
        </div>
      </div>

      {/* Missing from requirements warning */}
      {missingFromReq.length > 0 && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-800/30 rounded-xl flex items-center gap-3">
          <span className="text-[var(--status-red)] text-lg shrink-0">⚠</span>
          <p className="text-sm text-[var(--status-red)]">
            มี {missingFromReq.length} feature ที่อยู่ใน Requirement แต่ยังไม่มีในโค้ด
          </p>
        </div>
      )}

      {/* Category groups */}
      {!hasChanges ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--text-muted)]">ไม่มีการเปลี่ยนแปลง feature</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <CategoryRow
              key={group.category}
              group={group}
              href={`/projects/${projectId}/jobs/${jobId}/category/${encodeURIComponent(group.category)}`}
            />
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="fixed bottom-0 right-0 left-60 bg-[var(--bg-card)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between z-10">
        <p className="text-sm text-[var(--text-muted)]">
          {groups.length} หมวดหมู่ · {added.length + modified.length + removed.length} รายการเปลี่ยนแปลง
        </p>

        {updateDocStatus === 'PENDING' && (
          <button
            onClick={handleMarkReviewed}
            disabled={marking || isReviewed}
            className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
              isReviewed
                ? 'bg-green-900/20 text-[var(--status-green)] cursor-default'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white'
            }`}
          >
            {isReviewed ? '✓ ตรวจแล้ว' : marking ? 'กำลังบันทึก...' : 'ตรวจแล้ว'}
          </button>
        )}
      </div>
    </div>
  )
}
