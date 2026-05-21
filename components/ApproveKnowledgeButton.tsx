'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  projectId: string
  jobId: string
  nextVersion: number
}

export function ApproveKnowledgeButton({ projectId, jobId, nextVersion }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) throw new Error('failed')
      router.push(`/projects/${projectId}/knowledge`)
      router.refresh()
    } catch {
      setLoading(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
    >
      {loading ? 'กำลังสร้าง...' : `สร้าง Knowledge Doc v${nextVersion}`}
    </button>
  )
}
