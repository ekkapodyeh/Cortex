'use client'

import { useState } from 'react'
import { CaretDownIcon } from '@phosphor-icons/react'

type ChangeType = 'added' | 'modified' | 'removed'

export interface SubcategoryGroup {
  sub: string
  items: Array<{
    id: string
    changeType: ChangeType
    oldTitle: string | null
    oldDescription: string | null
    newTitle: string
    newDescription: string | null
    impact: string | null
  }>
}

function ChangeBadge({ type }: { type: ChangeType }) {
  const styles = {
    added: 'text-[var(--status-green)] bg-green-900/10',
    modified: 'text-[var(--status-yellow)] bg-yellow-900/10',
    removed: 'text-[var(--status-red)] bg-red-900/10',
  }
  const labels = { added: '+ เพิ่มใหม่', modified: '~ แก้ไข', removed: '− ลบออก' }
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded shrink-0 ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function CountBadges({ items }: { items: SubcategoryGroup['items'] }) {
  const added = items.filter(i => i.changeType === 'added').length
  const modified = items.filter(i => i.changeType === 'modified').length
  const removed = items.filter(i => i.changeType === 'removed').length
  return (
    <div className="flex items-center gap-1.5">
      {added > 0 && <span className="text-xs font-medium text-[var(--status-green)] bg-green-900/15 px-1.5 py-0.5 rounded">+{added}</span>}
      {modified > 0 && <span className="text-xs font-medium text-[var(--status-yellow)] bg-yellow-900/15 px-1.5 py-0.5 rounded">~{modified}</span>}
      {removed > 0 && <span className="text-xs font-medium text-[var(--status-red)] bg-red-900/15 px-1.5 py-0.5 rounded">-{removed}</span>}
    </div>
  )
}

function SubcategoryRow({ group }: { group: SubcategoryGroup }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[var(--bg-hover)] transition-colors"
      >
        <p className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{group.sub || 'ทั่วไป'}</p>
        <div className="flex items-center gap-2 shrink-0">
          <CountBadges items={group.items} />
          <CaretDownIcon
            size={14}
            className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)]">
          {/* Column header */}
          <div className="grid grid-cols-[120px_1fr_1fr] border-b border-[var(--border)]">
            <div />
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 py-2">ของเดิม</p>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 py-2 border-l border-[var(--border)]">ของใหม่</p>
          </div>

          {group.items.map((item, i) => (
            <div key={item.id} className={i > 0 ? 'border-t border-[var(--border)]' : ''}>
              <div className="grid grid-cols-[120px_1fr_1fr]">
                <div className="px-4 py-3 flex items-start">
                  <ChangeBadge type={item.changeType} />
                </div>
                <div className="px-4 py-3">
                  {item.oldTitle ? (
                    <>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.oldTitle}</p>
                      {item.oldDescription && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.oldDescription}</p>
                      )}
                    </>
                  ) : item.changeType === 'added' ? (
                    <p className="text-xs text-[var(--text-muted)] italic">ไม่มีก่อนหน้านี้</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.newTitle}</p>
                      {item.newDescription && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.newDescription}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="px-4 py-3 border-l border-[var(--border)]">
                  {item.changeType === 'removed' ? (
                    <p className="text-xs text-[var(--status-red)] italic">ถูกลบออกจากโค้ดแล้ว</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.newTitle}</p>
                      {item.newDescription && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.newDescription}</p>
                      )}
                    </>
                  )}
                  {item.impact && (
                    <div className="flex items-start gap-1.5 mt-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-2.5 py-2">
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mt-0.5 leading-none">Impact</span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.impact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SubcategoryList({ groups }: { groups: SubcategoryGroup[] }) {
  return (
    <div className="space-y-3">
      {groups.map(group => (
        <SubcategoryRow key={group.sub || '__no_sub__'} group={group} />
      ))}
    </div>
  )
}
