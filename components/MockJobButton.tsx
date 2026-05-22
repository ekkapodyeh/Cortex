'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlayIcon } from '@phosphor-icons/react'

interface Props {
  projectId: string
  label?: string
}

export function MockJobButton({ projectId, label = 'จำลอง Code Push ใหม่' }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handle() {
    setLoading(true)
    try {
      await fetch(`/api/projects/${projectId}/mock-job`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <PlayIcon size={12} weight="fill" />
      )}
      {loading ? 'กำลังสร้าง...' : label}
    </button>
  )
}
