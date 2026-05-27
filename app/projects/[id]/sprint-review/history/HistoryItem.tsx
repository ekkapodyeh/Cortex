'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CaretRightIcon } from '@phosphor-icons/react'
import type { DiffResult, Feature } from '@/lib/types'

interface Props {
  version: number
  approvedBy: string
  createdAt: string
  featureCount: number
  commitSha: string | null
  commitMsg: string | null
  author: string | null
  diff: DiffResult | null
  knowledgeHref: string
  doneCount: number | null
  totalReq: number | null
}

function ChangeBadge({ type }: { type: 'added' | 'modified' | 'removed' }) {
  const map = {
    added:    { label: '+ เพิ่มใหม่', cls: 'text-[var(--status-green)]  bg-[rgba(13,84,43,0.15)]'  },
    modified: { label: '~ แก้ไข',    cls: 'text-[var(--status-yellow)] bg-[rgba(115,62,10,0.15)]' },
    removed:  { label: '− ลบออก',   cls: 'text-[var(--status-red)]    bg-[rgba(130,24,26,0.15)]' },
  }
  const { label, cls } = map[type]
  return <span className={`inline-flex items-center text-[12px] font-medium px-2 py-0.5 rounded shrink-0 ${cls}`}>{label}</span>
}

function Section({
  label, count, colorCls, items, type,
}: {
  label: string
  count: number
  colorCls: string
  items: { title: string; description?: string; id: string; oldTitle?: string }[]
  type: 'added' | 'modified' | 'removed'
}) {
  const [open, setOpen] = useState(true)
  if (count === 0) return null
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 mb-2 w-full text-left"
      >
        <CaretRightIcon size={12} className={`transition-transform duration-150 text-[var(--text-muted)] ${open ? 'rotate-90' : ''}`} />
        <span className={`text-[14px] font-semibold ${colorCls}`}>{label}</span>
        <span className={`text-[12px] px-1.5 py-0.5 rounded-full ${colorCls} opacity-70`}>{count} รายการ</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 ml-4">
          {items.map(item => (
            <div key={item.id} className="bg-[var(--bg-hover)] rounded-lg p-4 flex gap-3 items-start">
              <ChangeBadge type={type} />
              <div className="flex-1 min-w-0">
                {type === 'modified' && item.oldTitle && item.oldTitle !== item.title && (
                  <p className="text-[12px] text-[var(--text-muted)] line-through mb-0.5">{item.oldTitle}</p>
                )}
                <p className="text-[14px] font-medium text-[var(--text-primary)]">{item.title}</p>
                {item.description && (
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HistoryItem({ version, approvedBy, createdAt, featureCount, commitSha, commitMsg, author, diff, knowledgeHref, doneCount, totalReq }: Props) {
  const [open, setOpen] = useState(false)

  const added    = (diff?.added    ?? []) as Feature[]
  const modified = (diff?.modified ?? []).map(m => (m as any).new ?? m) as Feature[]
  const modifiedOld = (diff?.modified ?? []).map(m => (m as any).old ?? null) as (Feature | null)[]
  const removed  = (diff?.removed  ?? []) as Feature[]

  const totalChanges = added.length + modified.length + removed.length

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-[var(--bg-hover)] transition-colors"
      >
        <CaretRightIcon size={14} className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`} />

        <span className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded shrink-0">
          v{version}
        </span>

        <div className="flex-1 min-w-0">
          {commitMsg && (
            <p className="text-[16px] font-medium text-[var(--text-primary)] truncate">{commitMsg}</p>
          )}
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {commitSha && (
              <code className="text-[12px] text-[var(--text-muted)] font-mono">{commitSha.slice(0, 7)}</code>
            )}
            {author && <span className="text-[12px] text-[var(--text-muted)]">อนุมัติโดย {approvedBy}</span>}
            <span className="text-[12px] text-[var(--text-muted)]">{new Date(createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        </div>

        <div className="shrink-0">
          {doneCount !== null && totalReq !== null ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              doneCount === totalReq
                ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
                : 'text-[var(--status-yellow)] bg-[rgba(115,62,10,0.15)]'
            }`}>
              {doneCount}/{totalReq} สำเร็จ
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">{featureCount} features</span>
          )}
        </div>
      </button>

      {/* Diff detail */}
      {open && (
        <div className="px-5 pb-4 border-t border-[var(--border)] pt-4 space-y-4">
          {totalChanges === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">ไม่มีข้อมูล diff</p>
          ) : (
            <>
              <Section
                label="เพิ่มใหม่" count={added.length} colorCls="text-[var(--status-green)]" type="added"
                items={added.map(f => ({ id: f.id, title: f.title, description: f.description }))}
              />
              <Section
                label="แก้ไข" count={modified.length} colorCls="text-[var(--status-yellow)]" type="modified"
                items={modified.map((f, i) => ({ id: f.id, title: f.title, description: f.description, oldTitle: modifiedOld[i]?.title }))}
              />
              <Section
                label="ลบออก" count={removed.length} colorCls="text-[var(--status-red)]" type="removed"
                items={removed.map(f => ({ id: f.id, title: f.title, description: f.description }))}
              />
            </>
          )}
          <div className="pt-1 border-t border-[var(--border)]">
            <Link href={knowledgeHref} className="text-[12px] text-[var(--accent)] hover:underline">
              ดู Knowledge Doc v{version} ทั้งหมด ({featureCount} features) →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
