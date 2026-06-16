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
  conditions?: import('@/lib/types').Condition[]
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

function DocCard({ doc }: { doc: SprintRequirementDoc }) {
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
                  <DocCard key={doc.id} doc={doc} />
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
                    <p className="text-[10px] text-[var(--text-muted)]">ยังไม่เริ่ม</p>
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
