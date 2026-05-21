'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureRow } from '@/components/FeatureRow'
import { ApproveRejectBar } from '@/components/ApproveRejectBar'
import type { Feature, ValidationResult, DiffResult } from '@/lib/types'

type RowType = 'unchanged' | 'added' | 'removed' | 'modified'

interface DiffRow {
  id: string
  type: RowType
  old: Feature | null
  new: Feature | null
}

interface ReviewClientProps {
  jobId: string
  projectId: string
  oldFeatures: Feature[]
  newFeatures: Feature[]
  requirementFeatures: Feature[]
  validationResult: ValidationResult | null
  diffResult: DiffResult | null
  updateDocStatus: string
  commitSha: string
  commitMsg: string
}

function buildDiffRows(oldFeatures: Feature[], newFeatures: Feature[]): DiffRow[] {
  const oldMap = new Map(oldFeatures.map(f => [f.id, f]))
  const allIds = Array.from(new Set([...oldFeatures.map(f => f.id), ...newFeatures.map(f => f.id)]))
  return allIds.map(id => {
    const old = oldMap.get(id) ?? null
    const nw = newFeatures.find(f => f.id === id) ?? null
    let type: RowType = 'unchanged'
    if (!old) type = 'added'
    else if (!nw) type = 'removed'
    else if (old.title !== nw.title || old.description !== nw.description) type = 'modified'
    return { id, type, old, new: nw }
  })
}

const rowBg: Record<RowType, string> = {
  added:     'bg-green-950/30 border-l-2 border-green-700/50',
  removed:   'bg-red-950/30 border-l-2 border-red-700/50',
  modified:  'bg-yellow-950/30 border-l-2 border-yellow-700/50',
  unchanged: '',
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="h-full min-h-[72px] rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  )
}

function NewFeatureCard({
  feature,
  req,
  rowType,
  hasRequirements,
}: {
  feature: Feature
  req: Feature | null
  rowType: RowType
  hasRequirements: boolean
}) {
  const inReq = !hasRequirements || req !== null
  const badge =
    rowType === 'added'
      ? inReq ? 'เพิ่มใหม่ ✓ Req' : 'เพิ่มใหม่ — ไม่อยู่ใน Req'
      : inReq ? 'ตรง Req' : 'ไม่อยู่ใน Req'
  const badgeColor = inReq
    ? 'text-[var(--status-green)] bg-green-900/20'
    : 'text-[var(--status-yellow)] bg-yellow-900/20'

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Feature */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {feature.category && (
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{feature.category}</p>
          )}
          <p className="text-sm font-medium text-[var(--text-primary)]">{feature.title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{feature.description}</p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${badgeColor}`}>
          {badge}
        </span>
      </div>

      {/* Requirement comparison */}
      {hasRequirements && (
        <div className={`border-t border-[var(--border)] px-4 py-2.5 flex items-start gap-2 ${
          req ? 'bg-green-950/10' : 'bg-red-950/10'
        }`}>
          <span className={`text-xs shrink-0 mt-0.5 font-bold ${req ? 'text-[var(--status-green)]' : 'text-[var(--status-red)]'}`}>
            {req ? '✓' : '✗'}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Req ระบุ</p>
            {req ? (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{req.description}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">ไม่มีใน Document Requirement</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ReviewClient({
  jobId,
  projectId,
  oldFeatures,
  newFeatures,
  requirementFeatures,
  validationResult,
  diffResult,
  updateDocStatus,
  commitSha,
  commitMsg,
}: ReviewClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const missingFeatures = validationResult?.missing ?? []
  const diffRows = buildDiffRows(oldFeatures, newFeatures)
  const isDone = updateDocStatus === 'APPROVED' || updateDocStatus === 'REJECTED'
  const hasRequirements = requirementFeatures.length > 0
  const reqMap = new Map(requirementFeatures.map(r => [r.id, r]))

  const coveredCount = hasRequirements
    ? newFeatures.filter(f => reqMap.has(f.id)).length
    : 0
  const missingReqCount = hasRequirements
    ? requirementFeatures.filter(r => !newFeatures.some(f => f.id === r.id)).length
    : 0
  const score = hasRequirements
    ? Math.round((coveredCount / requirementFeatures.length) * 100)
    : 0
  const scoreColor =
    score === 100 ? 'var(--status-green)' : score >= 60 ? 'var(--status-yellow)' : 'var(--status-red)'

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) throw new Error('Approve failed')
      router.push(`/projects/${projectId}/knowledge`)
      router.refresh()
    } catch {
      setLoading(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function handleReject() {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', comment: rejectComment }),
      })
      if (!res.ok) throw new Error('Reject failed')
      setShowRejectModal(false)
      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch {
      setLoading(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  return (
    <div className="p-8 pb-28">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)]">
            {commitSha.slice(0, 7)}
          </code>
          {isDone && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              updateDocStatus === 'APPROVED'
                ? 'text-[var(--status-green)] bg-green-900/20'
                : 'text-[var(--status-red)] bg-red-900/20'
            }`}>
              {updateDocStatus === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Review การเปลี่ยนแปลง</h2>
        {commitMsg && <p className="text-sm text-[var(--text-muted)] mt-1">{commitMsg}</p>}
      </div>

      {/* Diff stats */}
      {diffResult && (
        <div className="flex items-center gap-4 mb-6 text-sm">
          {diffResult.added.length > 0 && <span className="text-[var(--status-green)]">+{diffResult.added.length} เพิ่ม</span>}
          {diffResult.modified.length > 0 && <span className="text-[var(--status-yellow)]">~{diffResult.modified.length} แก้ไข</span>}
          {diffResult.removed.length > 0 && <span className="text-[var(--status-red)]">-{diffResult.removed.length} ลบ</span>}
          {missingFeatures.length > 0 && <span className="text-[var(--status-red)]">⚠ {missingFeatures.length} ขาดจาก Req</span>}
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-6 mb-3 items-end">
        {/* Left header */}
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Knowledge Doc เดิม
          {oldFeatures.length > 0 && <span className="text-[var(--text-muted)] ml-1">({oldFeatures.length})</span>}
        </h3>

        {/* Right header + score bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Project Update Doc ใหม่
              <span className="text-[var(--text-muted)] ml-1">({newFeatures.length})</span>
            </h3>
            {hasRequirements && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="text-[var(--status-green)]">{coveredCount} ผ่านครบ</span>
                {missingReqCount > 0 && <span className="text-[var(--status-red)]">{missingReqCount} ไม่พบ</span>}
              </div>
            )}
          </div>
          {hasRequirements && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, backgroundColor: scoreColor }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor }}>
                {score}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* First version */}
      {oldFeatures.length === 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
            <p className="text-[var(--text-muted)] text-sm">ยังไม่มี Knowledge Doc</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">นี่คือ version แรก</p>
          </div>
          <div className="space-y-2">
            {newFeatures.map(f => (
              <NewFeatureCard
                key={f.id}
                feature={f}
                req={reqMap.get(f.id) ?? null}
                rowType="added"
                hasRequirements={hasRequirements}
              />
            ))}
          </div>
        </div>
      )}

      {/* Aligned diff rows */}
      {oldFeatures.length > 0 && (
        <div className="space-y-2">
          {diffRows.map(row => (
            <div key={row.id} className={`grid grid-cols-2 gap-6 rounded-lg px-2 py-1 ${rowBg[row.type]}`}>
              <div>
                {row.old ? (
                  <FeatureRow
                    id={row.old.id}
                    title={row.old.title}
                    description={row.old.description}
                    category={row.old.category}
                    status={row.type === 'removed' ? 'REMOVED' : undefined}
                    dimmed={row.type === 'removed'}
                  />
                ) : (
                  <EmptySlot label="ไม่มีก่อนหน้านี้" />
                )}
              </div>
              <div>
                {row.new ? (
                  <NewFeatureCard
                    feature={row.new}
                    req={reqMap.get(row.id) ?? null}
                    rowType={row.type}
                    hasRequirements={hasRequirements}
                  />
                ) : (
                  <EmptySlot label="ถูกลบออกแล้ว" />
                )}
              </div>
            </div>
          ))}

          {/* Missing requirements */}
          {missingFeatures.map(f => (
            <div key={`missing-${f.id}`} className="grid grid-cols-2 gap-6 rounded-lg px-2 py-1 bg-red-950/20 border-l-2 border-red-700/30">
              <EmptySlot label="ไม่ได้ implement" />
              <FeatureRow id={f.id} title={f.title} description={f.description}
                category={f.category} status="MISSING" dimmed />
            </div>
          ))}
        </div>
      )}

      {/* Approve/Reject bar */}
      {!isDone && (
        <ApproveRejectBar
          jobId={jobId}
          onApprove={handleApprove}
          onReject={() => setShowRejectModal(true)}
          loading={loading}
        />
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">ส่งกลับให้ Dev แก้ไข</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">ระบุสิ่งที่ต้องการให้ Dev แก้ไข</p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="เช่น ขาด feature X ที่อยู่ใน requirement..."
              rows={4}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm py-2 rounded-lg hover:bg-[var(--border)] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 bg-[var(--status-red)] hover:opacity-90 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งกลับ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
