'use client'

import { useState } from 'react'

type Status = 'done' | 'partial' | 'not-done'
type DiffChangeType = 'added' | 'modified' | 'removed'

interface ReqRow {
  req: {
    id: string
    featureId: string
    title: string
    description: string
    changeType: 'add' | 'modify' | 'remove'
  }
  beforeTitle: string | null
  beforeDesc: string | null
  beforeId: string | null
  afterTitle: string | null
  afterDesc: string | null
  afterId: string | null
  diffChangeType: DiffChangeType | null
  status: Status
}

import { IMPACT } from '@/lib/impact-data'

function ReqTypeBadge({ type }: { type: 'add' | 'modify' | 'remove' }) {
  const map = {
    add:    { label: '+ เพิ่ม',  cls: 'text-[var(--status-green)]  bg-green-900/10'  },
    modify: { label: '~ แก้ไข', cls: 'text-[var(--status-yellow)] bg-yellow-900/10' },
    remove: { label: '− ลบ',    cls: 'text-[var(--status-red)]    bg-red-900/10'    },
  }
  const { label, cls } = map[type]
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${cls}`}>{label}</span>
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    done:       { label: '✓ เสร็จแล้ว',  cls: 'text-[var(--status-green)]  bg-green-900/10 border border-green-800/20'   },
    partial:    { label: '! ไม่ถูกต้อง', cls: 'text-[var(--status-yellow)] bg-yellow-900/10 border border-yellow-800/20' },
    'not-done': { label: '✗ ยังไม่ครบ',  cls: 'text-[var(--status-red)]    bg-red-900/10 border border-red-800/20'       },
  }
  const { label, cls } = map[status]
  return <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
}

function FeatureCell({ title, desc, id, muted }: { title: string | null; desc: string | null; id: string | null; muted?: string }) {
  if (!title) return <span className="text-xs text-[var(--text-muted)] italic">{muted ?? '—'}</span>
  return (
    <>
      <p className="text-sm text-[var(--text-primary)] leading-snug">{title}</p>
      {desc && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{desc}</p>}
      {id && <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{id}</p>}
    </>
  )
}

function ImpactRow({ featureId, colSpan }: { featureId: string; colSpan: number }) {
  const text = IMPACT[featureId]
  if (!text) return null
  return (
    <tr className="bg-[var(--bg-hover)]/40">
      <td colSpan={colSpan} className="px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mt-0.5 leading-none bg-[var(--bg-hover)] border border-[var(--border)] px-1.5 py-0.5 rounded">Impact</span>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{text}</p>
        </div>
      </td>
    </tr>
  )
}

export function SummaryTable({ rows }: { rows: ReqRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const thCls = 'text-left px-4 py-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider'

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
            <th className={`${thCls} w-[22%]`}>Requirement</th>
            <th className={thCls}>ต้องการ</th>
            <th className={`${thCls} w-[22%]`}>ก่อนแก้</th>
            <th className={`${thCls} w-[22%]`}>หลังแก้</th>
            <th className={thCls}>สถานะ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map(({ req, beforeTitle, beforeDesc, beforeId, afterTitle, afterDesc, afterId, status }) => {
            const hasImpact = !!IMPACT[req.featureId]
            const isOpen = expanded.has(req.id)
            return (
              <>
                <tr
                  key={req.id}
                  onClick={() => hasImpact && toggle(req.id)}
                  className={`transition-colors ${hasImpact ? 'cursor-pointer hover:bg-[var(--bg-hover)]' : ''}`}
                >
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">{req.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{req.featureId}</p>
                  </td>
                  <td className="px-4 py-4">
                    <ReqTypeBadge type={req.changeType} />
                  </td>
                  <td className="px-4 py-4">
                    <FeatureCell title={beforeTitle} desc={beforeDesc} id={beforeId} muted="ไม่มีก่อนหน้านี้" />
                  </td>
                  <td className="px-4 py-4">
                    <FeatureCell title={afterTitle} desc={afterDesc} id={afterId} muted="ถูกลบออกแล้ว" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={status} />
                      {hasImpact && (
                        <span className={`text-[var(--text-muted)] text-sm transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                      )}
                    </div>
                  </td>
                </tr>
                {isOpen && hasImpact && (
                  <ImpactRow key={`${req.id}-impact`} featureId={req.featureId} colSpan={5} />
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
