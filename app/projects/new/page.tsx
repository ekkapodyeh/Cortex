'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      repoUrl: (form.elements.namedItem('repoUrl') as HTMLInputElement).value,
      platform: (form.elements.namedItem('platform') as HTMLSelectElement).value,
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const project = await res.json()
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)] transition-colors">
            ← กลับ
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mt-4">เพิ่มโปรเจกต์ใหม่</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">ชื่อโปรเจกต์</label>
            <input
              name="name"
              required
              placeholder="เช่น Payment Service"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Repository URL</label>
            <input
              name="repoUrl"
              required
              type="url"
              placeholder="https://github.com/org/repo"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Platform</label>
            <select
              name="platform"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="GITHUB">GitHub</option>
              <option value="GITLAB">GitLab</option>
              <option value="BITBUCKET">Bitbucket</option>
            </select>
          </div>

          {error && <p className="text-[var(--status-red)] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
          </button>
        </form>
      </div>
    </div>
  )
}
