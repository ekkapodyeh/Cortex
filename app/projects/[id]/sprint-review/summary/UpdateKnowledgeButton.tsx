'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  projectId: string
  jobId: string
  nextVersion: number
  alreadyApproved: boolean
}

export function UpdateKnowledgeButton({ projectId, jobId, nextVersion, alreadyApproved }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyApproved)
  const router = useRouter()

  async function handleUpdate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!res.ok) throw new Error('failed')
      setDone(true)
      router.push(`/projects/${projectId}/sprint-review`)
    } catch {
      setLoading(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-800/30 bg-green-900/10 text-[var(--status-green)] text-sm font-medium">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        อัปเดต Knowledge แล้ว (v{nextVersion - 1})
      </div>
    )
  }

  return (
    <button
      onClick={handleUpdate}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium transition-opacity"
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          กำลังอัปเดต...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          อัปเดต Knowledge
        </>
      )}
    </button>
  )
}
