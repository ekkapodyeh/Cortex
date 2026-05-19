'use client'

interface ApproveRejectBarProps {
  jobId: string
  onApprove: () => void
  onReject: () => void
  loading: boolean
}

export function ApproveRejectBar({ onApprove, onReject, loading }: ApproveRejectBarProps) {
  return (
    <div className="fixed bottom-0 right-0 left-60 bg-[var(--bg-card)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between z-10">
      <p className="text-sm text-[var(--text-muted)]">ตรวจสอบการเปลี่ยนแปลงแล้ว กด Approve เพื่อสร้าง Knowledge Doc version ใหม่</p>
      <div className="flex items-center gap-3">
        <button
          onClick={onReject}
          disabled={loading}
          className="bg-[var(--bg-hover)] hover:bg-[var(--border)] disabled:opacity-50 text-[var(--text-secondary)] text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ส่งกลับให้ Dev แก้ไข
        </button>
        <button
          onClick={onApprove}
          disabled={loading}
          className="bg-[var(--status-green)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? 'กำลังดำเนินการ...' : 'Approve → สร้าง Knowledge Doc'}
        </button>
      </div>
    </div>
  )
}
