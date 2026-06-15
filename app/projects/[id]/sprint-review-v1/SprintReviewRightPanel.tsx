'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DiffResult } from '@/lib/types'
import { FileIcon, PlayIcon, PresentationChartIcon } from '@phosphor-icons/react'

interface SprintReqItem {
  id: string
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add' | 'modify' | 'remove'
  category?: string
  subcategory?: string
}

export interface SprintDoc {
  id: string
  sprintId: string
  fileName: string | null
  createdBy: string
  items: SprintReqItem[]
}

function UploadZone({ projectId, jobId, mockRequirements }: { projectId: string; jobId: string; mockRequirements: SprintReqItem[] }) {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    setFileName(file.name)
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1800))
    const mockItems = mockRequirements
    await fetch(`/api/projects/${projectId}/sprint-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, items: mockItems, fileName: file.name, createdBy: 'BA' }),
    })
    router.refresh()
  }

  async function handleTrial() {
    const mockFile = new File(['mock'], 'mock-sprint-requirement.txt', { type: 'text/plain' })
    await handleFile(mockFile)
  }

  if (processing) {
    return (
      <div className="border-2 border-dashed border-[var(--border)] rounded-xl px-[22px] py-6 text-center">
        <div className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-primary)]">{fileName}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">กำลังประมวลผล...</p>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl px-[22px] py-6 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
        dragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/40'
      }`}
    >
      <FileIcon size={28} className="text-[var(--text-muted)]" />
      <div className="flex flex-col gap-1 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">อัปโหลด Requirement</p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก<br />.pdf, .docx, .txt
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); handleTrial() }}
        className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
      >
        <PlayIcon size={12} weight="fill" />
        ทดลองด้วย Mock Data
      </button>
      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

function DocCard({ doc }: { doc: SprintDoc }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-2">
      <FileIcon size={16} className="text-[var(--text-muted)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{doc.fileName ?? 'requirement.pdf'}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">โดย {doc.createdBy} · {doc.items.length} story</p>
      </div>
    </div>
  )
}

interface Props {
  projectId: string
  jobId: string
  commitSha: string
  commitMsg: string
  author: string
  triggeredAt: string
  diffResult: DiffResult
  sprintDocs: SprintDoc[]
  noDiff: boolean
  mockRequirements: SprintReqItem[]
  bottomAction?: React.ReactNode
}

export function SprintReviewRightPanel({ projectId, jobId, commitSha, commitMsg, author, triggeredAt, diffResult, sprintDocs, noDiff, mockRequirements, bottomAction }: Props) {
  const allReqItems = sprintDocs.flatMap(d => d.items)
  const reqMap = new Map(allReqItems.map(r => [r.featureId, r]))
  const hasReq = sprintDocs.length > 0

  const addedLen = (diffResult.added ?? []).length
  const modifiedLen = (diffResult.modified ?? []).length
  const removedLen = (diffResult.removed ?? []).length

  const diffFeatureIds = new Set([
    ...(diffResult.added ?? []).map(f => f.id),
    ...(diffResult.modified ?? []).map(c => c.new.id),
    ...(diffResult.removed ?? []).map(f => f.id),
  ])

  type ChangeType = 'added' | 'modified' | 'removed'
  const items = [
    ...(diffResult.added ?? []).map(f => ({ id: f.id, changeType: 'added' as ChangeType, req: reqMap.get(f.id) ?? null })),
    ...(diffResult.modified ?? []).map(c => ({ id: c.new.id, changeType: 'modified' as ChangeType, req: reqMap.get(c.new.id) ?? null })),
    ...(diffResult.removed ?? []).map(f => ({ id: f.id, changeType: 'removed' as ChangeType, req: reqMap.get(f.id) ?? null })),
  ]

  const doneCount = items.filter(i => {
    if (!i.req) return false
    return (
      (i.req.changeType === 'add' && i.changeType === 'added') ||
      (i.req.changeType === 'modify' && i.changeType === 'modified') ||
      (i.req.changeType === 'remove' && i.changeType === 'removed')
    )
  }).length

  const partialCount = items.filter(i => {
    if (!i.req) return false
    return !(
      (i.req.changeType === 'add' && i.changeType === 'added') ||
      (i.req.changeType === 'modify' && i.changeType === 'modified') ||
      (i.req.changeType === 'remove' && i.changeType === 'removed')
    )
  }).length

  const seen = new Set<string>()
  const notDoneCount = allReqItems.filter(r => {
    if (diffFeatureIds.has(r.featureId) || seen.has(r.featureId)) return false
    seen.add(r.featureId)
    return true
  }).length

  const total = doneCount + partialCount + notDoneCount
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const donePct = total > 0 ? (doneCount / total) * 100 : 0
  const partialPct = total > 0 ? (partialCount / total) * 100 : 0

  return (
    <div className="fixed top-[85px] right-0 h-[calc(100vh-85px)] w-[288px] overflow-y-auto pt-6 px-6 pb-8 bg-[var(--bg-sidebar)] border-l border-[var(--border)] z-10 flex flex-col gap-8">

      {/* Main content block */}
      <div className="flex flex-col gap-6">

        {/* Section 1: commit + diff stats */}
        {!noDiff && (
          <div className="flex flex-col gap-4">
            {/* Commit card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex flex-col gap-1.5">
              <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded self-start">{commitSha.slice(0, 7)}</code>
              <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{commitMsg || 'ไม่มี commit message'}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{author} · {new Date(triggeredAt).toLocaleString('th-TH')}</p>
            </div>

            {/* Diff stats */}
            <div className="flex flex-col gap-3">
              {(addedLen > 0 || modifiedLen > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {addedLen > 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 bg-[rgba(13,84,43,0.15)] border border-[rgba(2,102,48,0.3)] rounded-xl px-3 py-3">
                      <span className="text-base font-bold leading-6 text-[var(--status-green)]">{addedLen}</span>
                      <span className="text-xs text-[var(--status-green)]">เพิ่มใหม่</span>
                    </div>
                  )}
                  {modifiedLen > 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 bg-[rgba(115,62,10,0.15)] border border-[rgba(137,75,0,0.3)] rounded-xl px-3 py-3">
                      <span className="text-base font-bold leading-6 text-[var(--status-yellow)]">{modifiedLen}</span>
                      <span className="text-xs text-[var(--status-yellow)]">แก้ไข</span>
                    </div>
                  )}
                </div>
              )}
              {removedLen > 0 && (
                <div className="flex flex-col items-center justify-center gap-2 bg-[rgba(130,24,26,0.15)] border border-[rgba(159,7,18,0.3)] rounded-xl px-3 py-3 w-full">
                  <span className="text-base font-bold leading-6 text-[var(--status-red)]">{removedLen}</span>
                  <span className="text-xs text-[var(--status-red)]">ลบออก</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 2: upload/docs + progress (same group, gap-4 = 16px) */}
        <div className="flex flex-col gap-4">
          {/* Upload zone / doc cards */}
          {sprintDocs.length === 0 ? (
            <UploadZone projectId={projectId} jobId={jobId} mockRequirements={mockRequirements} />
          ) : (
            <div className="flex flex-col gap-2">
              {sprintDocs.map(doc => (
                <DocCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}

          {/* Req progress */}
          {hasReq && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-end justify-between mb-2">
                  <p className="text-xs text-[var(--text-muted)]">ความคืบหน้า</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{pct}<span className="text-xs font-normal text-[var(--text-muted)] ml-0.5">%</span></p>
                </div>
                <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[var(--status-green)] transition-all duration-500" style={{ width: `${donePct}%` }} />
                  <div className="h-full bg-[var(--status-yellow)] transition-all duration-500" style={{ width: `${partialPct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)]">
                <div className="py-3 text-center">
                  <p className="text-lg font-bold text-[var(--status-green)]">{doneCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">ถูกต้อง</p>
                </div>
                <div className="py-3 text-center">
                  <p className="text-lg font-bold text-[var(--status-red)]">{partialCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">ไม่ถูกต้อง</p>
                </div>
                <div className="py-3 text-center">
                  <p className="text-lg font-bold text-[var(--status-yellow)]">{notDoneCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">ไม่มี</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action */}
      {bottomAction ?? (
        noDiff ? (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] text-sm font-medium text-[var(--text-muted)] cursor-not-allowed select-none">
            <PresentationChartIcon size={16} />
            สรุปการแก้ไข
          </div>
        ) : (
          <Link
            href={`/projects/${projectId}/sprint-review/summary`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PresentationChartIcon size={16} />
            สรุปการแก้ไข
          </Link>
        )
      )}
    </div>
  )
}
