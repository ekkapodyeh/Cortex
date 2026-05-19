'use client'

import { useState, useRef, DragEvent } from 'react'

interface RequirementsUploadProps {
  projectId: string
  onSuccess: () => void
}

const SUPPORTED_TYPES = ['.xlsx', '.xls', '.docx', '.pdf', '.csv']
const SUPPORTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'text/csv',
]

export function RequirementsUpload({ projectId, onSuccess }: RequirementsUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ featureCount: number; version: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!SUPPORTED_MIME.includes(file.type) && !SUPPORTED_TYPES.some(ext => file.name.endsWith(ext))) {
      setError(`ไฟล์ประเภท .${file.name.split('.').pop()} ไม่รองรับ — รองรับ: xlsx, docx, pdf, csv`)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('projectId', projectId)
      const res = await fetch('/api/requirements/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult({ featureCount: data.features?.length ?? 0, version: data.version ?? 1 })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/5'
            : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
        />
        <div className="text-3xl mb-3">📂</div>
        <p className="text-[var(--text-primary)] font-medium">
          {loading ? 'กำลังวิเคราะห์ไฟล์...' : 'อัปโหลดไฟล์ Document Requirement'}
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-1">ลากไฟล์มาวางหรือคลิกเพื่อเลือก</p>
        <p className="text-xs text-[var(--text-muted)] mt-2">รองรับ: xlsx, docx, pdf, csv</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-[var(--status-red)]/30 rounded-lg">
          <p className="text-[var(--status-red)] text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-900/20 border border-[var(--status-green)]/30 rounded-lg">
          <p className="text-[var(--status-green)] text-sm font-medium">
            ✓ อัปโหลดสำเร็จ — พบ {result.featureCount} features (Version {result.version})
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">ระบบจะใช้ feature list นี้เป็น Document Requirement version ใหม่</p>
        </div>
      )}
    </div>
  )
}
