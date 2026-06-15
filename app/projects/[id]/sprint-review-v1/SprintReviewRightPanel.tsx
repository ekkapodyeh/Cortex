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

function DocCard({ doc, projectId, readOnly }: { doc: SprintDoc; projectId: string; readOnly?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<SprintReqItem[]>(doc.items)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [splitIdx, setSplitIdx] = useState<number | null>(null)
  const [splitTitles, setSplitTitles] = useState<[string, string]>(['', ''])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function saveItems(newItems: SprintReqItem[]) {
    setSaving(true)
    await fetch(`/api/projects/${projectId}/sprints/${doc.sprintId}/requirements/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems }),
    })
    setItems(newItems)
    setSaving(false)
    router.refresh()
  }

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setEditTitle(items[idx].title)
    setSplitIdx(null)
  }

  async function commitEdit(idx: number) {
    if (!editTitle.trim()) return
    const newItems = items.map((item, i) => i === idx ? { ...item, title: editTitle.trim() } : item)
    setEditingIdx(null)
    await saveItems(newItems)
  }

  function startSplit(idx: number) {
    setSplitIdx(idx)
    setSplitTitles([items[idx].title, ''])
    setEditingIdx(null)
  }

  async function commitSplit(idx: number) {
    const [t1, t2] = splitTitles
    if (!t1.trim() || !t2.trim()) return
    const original = items[idx]
    const newItem: SprintReqItem = { ...original, featureId: crypto.randomUUID(), title: t2.trim() }
    const newItems = [...items.slice(0, idx), { ...original, title: t1.trim() }, newItem, ...items.slice(idx + 1)]
    setSplitIdx(null)
    await saveItems(newItems)
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-[var(--bg-hover)] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <FileIcon size={16} className="text-[var(--text-muted)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{doc.fileName ?? 'requirement.pdf'}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">โดย {doc.createdBy} · {items.length} story</p>
        </div>
        <span className="text-[var(--text-muted)] text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {items.map((item, idx) => (
            <div key={item.featureId} className="px-4 py-3 flex flex-col gap-2">
              {editingIdx === idx ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    className="w-full text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-green)]"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(idx); if (e.key === 'Escape') setEditingIdx(null) }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => commitEdit(idx)} disabled={saving} className="text-[10px] px-3 py-1.5 rounded-lg bg-[rgba(13,84,43,0.2)] text-[var(--status-green)] hover:bg-[rgba(13,84,43,0.35)] transition-colors disabled:opacity-40">บันทึก</button>
                    <button onClick={() => setEditingIdx(null)} className="text-[10px] px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">ยกเลิก</button>
                  </div>
                </div>
              ) : splitIdx === idx ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-[var(--text-muted)]">แยกเป็น 2 story</p>
                  <input
                    autoFocus
                    placeholder="Story 1"
                    className="w-full text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-green)]"
                    value={splitTitles[0]}
                    onChange={e => setSplitTitles([e.target.value, splitTitles[1]])}
                  />
                  <input
                    placeholder="Story 2"
                    className="w-full text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-green)]"
                    value={splitTitles[1]}
                    onChange={e => setSplitTitles([splitTitles[0], e.target.value])}
                    onKeyDown={e => { if (e.key === 'Enter') commitSplit(idx); if (e.key === 'Escape') setSplitIdx(null) }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => commitSplit(idx)} disabled={saving || !splitTitles[0].trim() || !splitTitles[1].trim()} className="text-[10px] px-3 py-1.5 rounded-lg bg-[rgba(13,84,43,0.2)] text-[var(--status-green)] hover:bg-[rgba(13,84,43,0.35)] transition-colors disabled:opacity-40">แยก Story</button>
                    <button onClick={() => setSplitIdx(null)} className="text-[10px] px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs text-[var(--text-primary)] leading-relaxed">{item.title}</p>
                  {!readOnly && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(idx)} title="แก้ไข" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => startSplit(idx)} title="แยก Story" className="text-[var(--text-muted)] hover:text-[var(--status-green)] transition-colors p-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
                <DocCard key={doc.id} doc={doc} projectId={projectId} />
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
                  <p className="text-[10px] text-[var(--text-muted)]">ไม่ครบ</p>
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
