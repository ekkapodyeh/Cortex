'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileIcon, PlayIcon, XIcon } from '@phosphor-icons/react'
import type { SprintReqItem } from './SprintReviewRightPanel'

export function CreateSprintModal({
  projectId,
  sprintNumber,
  mockRequirements,
  onClose,
}: {
  projectId: string
  sprintNumber: number
  mockRequirements: SprintReqItem[]
  onClose: () => void
}) {
  const [name, setName] = useState(`Sprint ${sprintNumber}`)
  const [fileName, setFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    setFileName(file.name)
    setProcessing(true)
    const sprintRes = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!sprintRes.ok) {
      setProcessing(false)
      return
    }
    const sprint = await sprintRes.json()
    await fetch(`/api/projects/${projectId}/sprints/${sprint.id}/requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: mockRequirements, fileName: file.name, createdBy: 'BA' }),
    })
    router.refresh()
    onClose()
  }

  async function handleTrial() {
    const mockFile = new File(['mock'], 'mock-sprint-requirement.txt', { type: 'text/plain' })
    await handleFile(mockFile)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl p-6 w-[400px] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-[var(--text-primary)]">สร้าง Bolt ใหม่</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
            <XIcon size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--text-muted)]">ชื่อ Bolt</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={processing}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--text-muted)]">Requirement File</label>
          {processing ? (
            <div className="border-2 border-dashed border-[var(--border)] rounded-xl px-4 py-5 text-center">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">{fileName} — กำลังประมวลผล...</p>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/40 rounded-xl px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition-colors"
            >
              <FileIcon size={24} className="text-[var(--text-muted)]" />
              <div className="text-center">
                <p className="text-xs font-medium text-[var(--text-primary)]">วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">.pdf, .docx, .txt</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleTrial() }}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <PlayIcon size={11} weight="fill" />
                ทดลองด้วย Mock Data
              </button>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      </div>
    </div>
  )
}
