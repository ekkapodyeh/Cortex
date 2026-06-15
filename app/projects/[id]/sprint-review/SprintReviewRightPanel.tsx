'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DiffResult } from '@/lib/types'
import { FileIcon, XIcon, PlusIcon, LockSimpleIcon } from '@phosphor-icons/react'
import { CreateSprintModal } from './CreateSprintModal'

export interface SprintReqItem {
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add' | 'modify' | 'remove'
  category?: string
  subcategory?: string
}

export interface SprintRequirementDoc {
  id: string
  fileName: string | null
  createdBy: string
  items: SprintReqItem[]
}

export interface ActiveSprint {
  id: string
  name: string
  status: 'OPEN' | 'CLOSED'
  requirements: SprintRequirementDoc[]
}

function DocCard({ doc, projectId, sprintId, readOnly }: { doc: SprintRequirementDoc; projectId: string; sprintId: string; readOnly?: boolean }) {
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
    await fetch(`/api/projects/${projectId}/sprints/${sprintId}/requirements/${doc.id}`, {
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
  activeSprint: ActiveSprint | null
  noDiff: boolean
  mockRequirements: SprintReqItem[]
  readOnly?: boolean
}

export function SprintReviewRightPanel({ projectId, commitSha, commitMsg, author, triggeredAt, diffResult, activeSprint, noDiff, mockRequirements, readOnly = false }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [closing, setClosing] = useState(false)
  const router = useRouter()

  const sprintDocs = activeSprint?.requirements ?? []
  const allReqItems = sprintDocs.flatMap(d => d.items)
  const reqMap = new Map(allReqItems.map(r => [r.featureId, r]))
  const hasReq = sprintDocs.length > 0

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

  const doneCount = items.filter(i => i.req && i.req.changeType === 'add' && i.changeType === 'added').length
  const partialCount = items.filter(i => i.req && !(i.req.changeType === 'add' && i.changeType === 'added')).length
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

  async function handleCloseSprint() {
    if (!activeSprint) return
    setClosing(true)
    await fetch(`/api/projects/${projectId}/sprints/${activeSprint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    })
    router.refresh()
    setClosing(false)
  }

  const nextSprintNumber = activeSprint ? parseInt(activeSprint.name.replace(/\D/g, '') || '1') + 1 : 1

  return (
    <>
      {showModal && (
        <CreateSprintModal
          projectId={projectId}
          sprintNumber={nextSprintNumber}
          mockRequirements={mockRequirements}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="fixed top-[85px] right-0 h-[calc(100vh-85px)] w-[288px] overflow-y-auto pt-6 px-6 pb-8 bg-[var(--bg-sidebar)] border-l border-[var(--border)] z-10 flex flex-col gap-8">


        {activeSprint && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{activeSprint.name}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  activeSprint.status === 'OPEN'
                    ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
                    : 'text-[var(--text-muted)] bg-[var(--bg-hover)]'
                }`}>
                  {activeSprint.status}
                </span>
              </div>

            </div>

            <div className="flex flex-col gap-2">
              {sprintDocs.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">ยังไม่มี requirement file</p>
              ) : (
                sprintDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} projectId={projectId} sprintId={activeSprint.id} readOnly={readOnly} />
                ))
              )}
            </div>

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

            {activeSprint.status === 'OPEN' && !readOnly && (
              <button
                onClick={handleCloseSprint}
                disabled={closing}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--status-red)] hover:border-[var(--status-red)] transition-colors disabled:opacity-40"
              >
                <LockSimpleIcon size={13} />
                {closing ? 'กำลังปิด...' : 'ปิด Bolt'}
              </button>
            )}

          </div>
        )}

      </div>
    </>
  )
}
