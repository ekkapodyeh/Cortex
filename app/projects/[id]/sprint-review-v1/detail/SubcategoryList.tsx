'use client'

import { InfoIcon } from '@phosphor-icons/react'

type ChangeType = 'added' | 'modified' | 'removed'
type ReqStatus = 'done' | 'incorrect' | 'pending' | 'no-req' | null

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
    reqStatus: ReqStatus
    reqNote?: string | null
    isSynthetic?: boolean
  }>
}

function ChangeBadge({ type }: { type: ChangeType }) {
  const styles = {
    added: 'bg-[#243e32] text-[#22c55e]',
    modified: 'bg-[rgba(244,122,0,0.2)] text-[#f47a00]',
    removed: 'bg-[rgba(220,64,64,0.2)] text-[#dc4040]',
  }
  const labels = { added: '+ เพิ่มใหม่', modified: '~ แก้ไข', removed: '− ลบออก' }
  return (
    <span className={`inline-flex items-center text-[11px] px-1.5 py-1 rounded shrink-0 ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

function ReqStatusBadge({ status }: { status: ReqStatus }) {
  if (!status) return null
  if (status === 'done') return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#22c55e] shrink-0">
      <span className="w-[18px] h-[18px] rounded-full bg-[#243e32] flex items-center justify-center text-[10px]">✓</span>
      ถูกต้อง
    </span>
  )
  if (status === 'incorrect') return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--status-red)] shrink-0">
      <span className="w-[18px] h-[18px] rounded-full bg-[rgba(130,24,26,0.2)] flex items-center justify-center text-[10px]">✗</span>
      ไม่ถูกต้อง
    </span>
  )
  if (status === 'pending') return (
    <span className="text-[12px] font-medium text-[var(--status-yellow)] shrink-0">ไม่ครบ</span>
  )
  if (status === 'no-req') return (
    <span className="text-[12px] font-medium text-[var(--text-muted)] shrink-0">ไม่มีใน Requirement</span>
  )
  return null
}

function ItemCard({ item, hasReq }: { item: SubcategoryGroup['items'][0]; hasReq: boolean }) {
  const isAdded = item.changeType === 'added'
  const isRemoved = item.changeType === 'removed'

  const borderAccent =
    hasReq && item.reqStatus === 'done'      ? 'border-l-[3px] !border-l-[var(--status-green)]' :
    hasReq && item.reqStatus === 'incorrect' ? 'border-l-[3px] !border-l-[var(--status-red)]' :
    hasReq && item.reqStatus === 'pending'   ? 'border-l-[3px] !border-l-[var(--status-yellow)] opacity-60' :
    hasReq && item.reqStatus === 'no-req'    ? 'border-l-[3px] !border-l-[var(--text-muted)]' :
    ''

  return (
    <div className={`bg-[#1b1b1b] border border-[#2a2d2e] rounded-xl p-[21px] flex flex-col gap-6 ${borderAccent}`}>
      {/* Top box: req note + status badge */}
      {item.reqNote ? (
        <div className="bg-[#141414] rounded-lg p-2 flex gap-2 items-start">
          <InfoIcon size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
          <p className="text-[14px] text-white leading-[21px] flex-1 min-w-0">{item.reqNote}</p>
          {hasReq && <ReqStatusBadge status={item.reqStatus} />}
        </div>
      ) : hasReq && item.reqStatus === 'no-req' ? (
        <div className="flex justify-end">
          <ReqStatusBadge status="no-req" />
        </div>
      ) : null}

      {/* ของเดิม */}
      <div className="flex gap-4 items-start">
        <p className="text-[12px] font-medium text-[#6b7280] whitespace-nowrap shrink-0 pt-0.5">ของเดิม</p>
        {isAdded ? (
          <p className="text-[14px] text-[#6b7280]">ไม่มีก่อนหน้านี้</p>
        ) : (
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#f5f5f5]">{item.oldTitle ?? item.newTitle}</p>
            {item.oldDescription && <p className="text-[14px] text-[#909090] leading-[21px]">{item.oldDescription}</p>}
          </div>
        )}
      </div>

      {/* Divider with badge */}
      <div className="flex items-center">
        <div className="w-12 border-t border-[#2a2d2e]" />
        <ChangeBadge type={item.changeType} />
        <div className="flex-1 border-t border-[#2a2d2e]" />
      </div>

      {/* ของใหม่ */}
      <div className="flex gap-4 items-start">
        <p className="text-[12px] font-medium text-[#6b7280] whitespace-nowrap shrink-0 pt-0.5">ของใหม่</p>
        {isRemoved && !item.isSynthetic ? (
          <p className="text-[14px] text-[var(--status-red)]">ถูกลบออกจากโค้ดแล้ว</p>
        ) : item.isSynthetic && isAdded ? (
          <p className="text-[14px] text-[var(--text-muted)]">ยังไม่ได้ทำ</p>
        ) : item.isSynthetic && isRemoved ? (
          <p className="text-[14px] text-[var(--text-muted)]">ยังไม่ได้ลบ</p>
        ) : item.isSynthetic ? (
          <p className="text-[14px] text-[var(--text-muted)]">ยังไม่ได้แก้ไข</p>
        ) : (
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#f5f5f5]">{item.newTitle}</p>
            {item.newDescription && <p className="text-[14px] text-[#909090] leading-[21px]">{item.newDescription}</p>}
            {item.impact && (
              <div className="flex gap-2 items-start">
                <InfoIcon size={16} className="text-[#666666] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#666666] leading-[17px]">{item.impact}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SubcategorySection({ group, hasReq }: { group: SubcategoryGroup; hasReq: boolean }) {
  const realItems = group.items.filter(i => !i.isSynthetic)
  const added = realItems.filter(i => i.changeType === 'added').length
  const modified = realItems.filter(i => i.changeType === 'modified').length
  const removed = realItems.filter(i => i.changeType === 'removed').length

  const reqItems = group.items.filter(i => i.reqStatus === 'done' || i.reqStatus === 'incorrect' || i.reqStatus === 'pending')
  const doneCount = reqItems.filter(i => i.reqStatus === 'done').length
  const allDone = reqItems.length > 0 && doneCount === reqItems.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-[20px] text-[#f5f5f5]">
          {group.sub || 'ทั่วไป'}
        </h3>
        <div className="flex items-center gap-1.5">
          {hasReq && reqItems.length > 0 ? (
            <span className={`text-[14px] font-medium px-2 py-1 rounded-lg ${
              allDone
                ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
                : 'text-[#f47a00] bg-[rgba(244,122,0,0.1)]'
            }`}>
              {doneCount}/{reqItems.length} ถูกต้อง
            </span>
          ) : (
            <>
              {added > 0 && <span className="w-7 h-7 flex items-center justify-center text-[14px] font-medium text-[#22c55e] bg-[rgba(73,204,144,0.2)] rounded-lg">{added}</span>}
              {modified > 0 && <span className="w-7 h-7 flex items-center justify-center text-[14px] font-medium text-[#f47a00] bg-[rgba(244,122,0,0.1)] rounded-lg">{modified}</span>}
              {removed > 0 && <span className="w-7 h-7 flex items-center justify-center text-[14px] font-medium text-[var(--status-red)] bg-[rgba(130,24,26,0.12)] rounded-lg">{removed}</span>}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {group.items.map(item => (
          <ItemCard key={item.id} item={item} hasReq={hasReq} />
        ))}
      </div>
    </div>
  )
}

function ReqSummary({ groups }: { groups: SubcategoryGroup[] }) {
  const allItems = groups.flatMap(g => g.items)
  const doneCount = allItems.filter(i => i.reqStatus === 'done').length
  const incorrectCount = allItems.filter(i => i.reqStatus === 'incorrect').length
  const pendingCount = allItems.filter(i => i.reqStatus === 'pending').length
  const noReqCount = allItems.filter(i => i.reqStatus === 'no-req').length

  if (doneCount + incorrectCount + pendingCount + noReqCount === 0) return null

  return (
    <div className={`grid gap-3 ${noReqCount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      <div className="flex flex-col items-center justify-center gap-1 bg-[rgba(13,84,43,0.12)] border border-[rgba(2,102,48,0.25)] rounded-xl px-3 py-4">
        <span className="text-2xl font-bold text-[var(--status-green)]">{doneCount}</span>
        <span className="text-xs text-[var(--status-green)]">ถูกต้อง</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1 bg-[rgba(130,24,26,0.12)] border border-[rgba(159,7,18,0.25)] rounded-xl px-3 py-4">
        <span className="text-2xl font-bold text-[var(--status-red)]">{incorrectCount}</span>
        <span className="text-xs text-[var(--status-red)]">ไม่ถูกต้อง</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1 bg-[rgba(115,62,10,0.12)] border border-[rgba(137,75,0,0.25)] rounded-xl px-3 py-4">
        <span className="text-2xl font-bold text-[var(--status-yellow)]">{pendingCount}</span>
        <span className="text-xs text-[var(--status-yellow)]">ไม่ครบ</span>
      </div>
      {noReqCount > 0 && (
        <div className="flex flex-col items-center justify-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-4">
          <span className="text-2xl font-bold text-[var(--text-muted)]">{noReqCount}</span>
          <span className="text-xs text-[var(--text-muted)]">ไม่มีใน Requirement</span>
        </div>
      )}
    </div>
  )
}

export function SubcategoryList({ groups, hasReq }: { groups: SubcategoryGroup[]; hasReq?: boolean }) {
  const resolvedHasReq = hasReq ?? false
  return (
    <div className="flex flex-col gap-[48px]">
      {resolvedHasReq && <ReqSummary groups={groups} />}
      {groups.map(group => (
        <SubcategorySection key={group.sub || '__no_sub__'} group={group} hasReq={resolvedHasReq} />
      ))}
    </div>
  )
}
