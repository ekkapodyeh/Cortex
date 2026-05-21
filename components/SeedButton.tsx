'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSeed() {
    setLoading(true)
    await fetch('/api/seed', { method: 'POST' })
    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) return null

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="text-sm text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? 'กำลัง gen...' : '⚡ Gen ข้อมูลทดสอบ'}
    </button>
  )
}
