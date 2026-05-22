'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react'

interface Props {
  projectId: string
}

export function ResetJobsButton({ projectId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handle() {
    if (!confirm('ล้างผลวิเคราะห์? (Requirement ที่อัปโหลดไว้จะยังอยู่)')) return
    setLoading(true)
    try {
      await fetch(`/api/projects/${projectId}/reset-jobs`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--status-red)] hover:border-red-800/40 hover:bg-red-900/5 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <ArrowCounterClockwiseIcon size={12} />
      )}
      {loading ? 'กำลังล้าง...' : 'ล้างข้อมูล'}
    </button>
  )
}
