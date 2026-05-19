'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureRow } from '@/components/FeatureRow'
import { ApproveRejectBar } from '@/components/ApproveRejectBar'
import type { Feature, ValidationResult, DiffResult } from '@/lib/types'

type FeatureStatus = 'MATCHED' | 'EXTRA' | 'MISSING' | 'REMOVED'

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

function getFeatureStatus(feature: Feature, requirementFeatures: Feature[]): FeatureStatus {
  if (requirementFeatures.length === 0) return 'EXTRA'
  const inReq = requirementFeatures.some(r => r.id === feature.id)
  return inReq ? 'MATCHED' : 'EXTRA'
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

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateDocId: jobId }),
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

  const isDone = updateDocStatus === 'APPROVED' || updateDocStatus === 'REJECTED'

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

      {/* Stats bar */}
      {diffResult && (
        <div className="flex items-center gap-4 mb-6 text-sm">
          {diffResult.added.length > 0 && (
            <span className="text-[var(--status-green)]">+{diffResult.added.length} เพิ่ม</span>
          )}
          {diffResult.modified.length > 0 && (
            <span className="text-[var(--status-yellow)]">~{diffResult.modified.length} แก้ไข</span>
          )}
          {diffResult.removed.length > 0 && (
            <span className="text-[var(--status-red)]">-{diffResult.removed.length} ลบ</span>
          )}
          {missingFeatures.length > 0 && (
            <span className="text-[var(--status-red)]">⚠ {missingFeatures.length} ขาดจาก Requirement</span>
          )}
        </div>
      )}

      {/* Side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Knowledge Doc เดิม */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Knowledge Doc เดิม {oldFeatures.length > 0 && <span className="text-[var(--text-muted)]">({oldFeatures.length} features)</span>}
          </h3>
          {oldFeatures.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
              <p className="text-[var(--text-muted)] text-sm">ยังไม่มี Knowledge Doc</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">นี่คือ version แรก</p>
            </div>
          ) : (
            <div className="space-y-2">
              {oldFeatures.map((feature) => {
                const removedInNew = !newFeatures.some(f => f.id === feature.id)
                return (
                  <FeatureRow
                    key={feature.id}
                    id={feature.id}
                    title={feature.title}
                    description={feature.description}
                    category={feature.category}
                    dimmed={removedInNew}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Project Update Doc ใหม่ */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Project Update Doc ใหม่ <span className="text-[var(--text-muted)]">({newFeatures.length} features)</span>
          </h3>
          <div className="space-y-2">
            {newFeatures.map((feature) => {
              const status = getFeatureStatus(feature, requirementFeatures)
              return (
                <FeatureRow
                  key={feature.id}
                  id={feature.id}
                  title={feature.title}
                  description={feature.description}
                  category={feature.category}
                  status={status}
                />
              )
            })}
            {/* Missing features from requirements */}
            {missingFeatures.map((feature) => (
              <FeatureRow
                key={`missing-${feature.id}`}
                id={feature.id}
                title={feature.title}
                description={feature.description}
                category={feature.category}
                status="MISSING"
                dimmed={true}
              />
            ))}
          </div>
        </div>
      </div>

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
