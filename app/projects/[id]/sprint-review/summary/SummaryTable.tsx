'use client'

type DiffChangeType = 'added' | 'modified' | 'removed'
type Status = 'done' | 'partial' | 'not-done'

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
  afterTitle: string | null
  afterDesc: string | null
  diffChangeType: DiffChangeType | null
  status: Status
}

function ReqTypeBadge({ type }: { type: 'add' | 'modify' | 'remove' }) {
  const map = {
    add:    { label: '+ เพิ่ม',  cls: 'text-[var(--status-green)]  bg-[rgba(13,84,43,0.15)]'  },
    modify: { label: '~ แก้ไข', cls: 'text-[var(--status-yellow)] bg-[rgba(115,62,10,0.15)]' },
    remove: { label: '− ลบ',    cls: 'text-[var(--status-red)]    bg-[rgba(130,24,26,0.15)]' },
  }
  const { label, cls } = map[type]
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-1.5 py-1 rounded whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

function FeatureCell({ title, desc, muted }: { title: string | null; desc: string | null; muted?: string }) {
  if (!title) return <span className="text-[13px] text-[var(--text-muted)]">{muted ?? '—'}</span>
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{title}</p>
      {desc && <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{desc}</p>}
    </div>
  )
}

export function SummaryTable({ rows }: { rows: ReqRow[] }) {
  const thCls = 'text-left px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider'

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-[260px]" />
          <col className="w-[260px]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
            <th className={thCls}>Requirement</th>
            <th className={thCls}>ก่อนแก้</th>
            <th className={thCls}>หลังแก้</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map(({ req, beforeTitle, beforeDesc, afterTitle, afterDesc, diffChangeType }) => (
            <tr key={req.id} className="align-top">
              <td className="px-4 py-4">
                <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{req.title}</p>
              </td>
              <td className="px-4 py-4">
                <FeatureCell title={beforeTitle} desc={beforeDesc} muted="ไม่มีก่อนหน้านี้" />
              </td>
              <td className="px-4 py-4">
                <FeatureCell
                  title={afterTitle}
                  desc={afterDesc}
                  muted={diffChangeType === 'removed' ? 'ถูกลบออกแล้ว' : 'ยังไม่ได้ทำ'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
