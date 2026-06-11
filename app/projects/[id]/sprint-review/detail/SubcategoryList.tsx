'use client'

import { useState } from 'react'
import { InfoIcon, GitCommitIcon, XIcon } from '@phosphor-icons/react'

type ChangeType = 'added' | 'modified' | 'removed'
type ReqStatus = 'done' | 'incorrect' | 'pending' | 'no-req' | null

export interface JobCommit {
  sha: string
  message: string
  author: string
  date: string
}

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
    reqChangeType?: 'add' | 'modify' | 'remove' | null
    isSynthetic?: boolean
    commits?: JobCommit[]
  }>
}


function ReqStatusBadge({ status }: { status: ReqStatus }) {
  if (!status) return null
  if (status === 'done') return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#22c55e] shrink-0">
      <span className="w-[18px] h-[18px] rounded-full bg-[#243e32] flex items-center justify-center text-[10px]">✓</span>
      สำเร็จ
    </span>
  )
  if (status === 'incorrect') return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--status-red)] shrink-0">
      <span className="w-[18px] h-[18px] rounded-full bg-[rgba(130,24,26,0.2)] flex items-center justify-center text-[10px]">✗</span>
      ไม่ถูกต้อง
    </span>
  )
  if (status === 'pending') return (
    <span className="text-[12px] font-medium text-[var(--status-yellow)] shrink-0">ยังไม่มี</span>
  )
  if (status === 'no-req') return (
    <span className="text-[12px] font-medium text-[var(--text-muted)] shrink-0">ไม่มีใน Requirement</span>
  )
  return null
}

function incorrectReason(reqChangeType: 'add' | 'modify' | 'remove', actual: ChangeType, title: string, oldTitle: string | null): string {
  if (reqChangeType === 'modify' && actual === 'added') return `Requirement ขอแก้ไขของเดิม แต่ dev สร้าง "${title}" ใหม่ทั้งหมดแทน`
  if (reqChangeType === 'modify' && actual === 'removed') return `Requirement ขอแก้ไข "${oldTitle ?? title}" แต่ในโค้ดถูกลบออก`
  if (reqChangeType === 'add' && actual === 'modified') return `Requirement ขอสร้างฟีเจอร์ใหม่ แต่ dev แก้ไข "${oldTitle ?? title}" แทน`
  if (reqChangeType === 'add' && actual === 'removed') return `Requirement ขอเพิ่มฟีเจอร์ใหม่ แต่ "${title}" ถูกลบออกในโค้ด`
  if (reqChangeType === 'remove' && actual === 'added') return `Requirement ขอลบออก แต่ dev สร้าง "${title}" ใหม่แทน`
  if (reqChangeType === 'remove' && actual === 'modified') return `Requirement ขอลบ "${oldTitle ?? title}" ออก แต่ในโค้ดยังคงแก้ไขอยู่`
  return 'การเปลี่ยนแปลงไม่ตรงกับ Requirement'
}

function CommitDrawer({ featureTitle, commits, onClose }: { featureTitle: string; commits: JobCommit[]; onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[360px] z-50 bg-[#141414] border-l border-[#2a2d2e] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#2a2d2e]">
          <div className="flex flex-col gap-1 pr-4">
            <div className="flex items-center gap-2">
              <GitCommitIcon size={16} className="text-[var(--text-muted)] shrink-0" />
              <p className="text-[12px] text-[var(--text-muted)] font-medium">ประวัติ Commit</p>
            </div>
            <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">{featureTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[#1f1f1f] transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Commit list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {commits.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)] text-center mt-8">ไม่พบข้อมูล commit</p>
          ) : commits.map((c, idx) => (
            <div key={idx} className="bg-[#1b1b1b] border border-[#2a2d2e] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-[var(--accent)] bg-[#1f2937] px-1.5 py-0.5 rounded">{c.sha.slice(0, 7)}</code>
              </div>
              <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{c.message}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {c.author} · {new Date(c.date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function ItemCard({ item, hasReq }: { item: SubcategoryGroup['items'][0]; hasReq: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isAdded = item.changeType === 'added'
  const isRemoved = item.changeType === 'removed'

  const borderAccent =
    hasReq && item.reqStatus === 'done'      ? 'border-l-[3px] !border-l-[var(--status-green)]' :
    hasReq && item.reqStatus === 'incorrect' ? 'border-l-[3px] !border-l-[var(--status-red)]' :
    hasReq && item.reqStatus === 'pending'   ? 'border-l-[3px] !border-l-[var(--status-yellow)] opacity-60' :
    hasReq && item.reqStatus === 'no-req'    ? 'border-l-[3px] !border-l-[var(--text-muted)]' :
    ''

  const hasCommits = item.commits && item.commits.length > 0

  return (
    <>
      <div className={`bg-[#1b1b1b] border border-[#2a2d2e] rounded-xl p-[21px] flex flex-col gap-6 ${borderAccent}`}>
        {/* Top box: req note + status badge */}
        {item.reqNote ? (
          <div className="bg-[#141414] rounded-lg p-2 flex gap-2 items-start">
            <InfoIcon size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <p className="text-[14px] text-white leading-[21px]">{item.reqNote}</p>
              {item.reqStatus === 'incorrect' && item.reqChangeType && (
                <p className="text-[12px] text-[var(--status-red)] leading-[18px]">
                  {incorrectReason(item.reqChangeType, item.changeType, item.newTitle, item.oldTitle)}
                </p>
              )}
            </div>
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

        {/* Divider */}
        <div className="border-t border-[#2a2d2e]" />

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

        {/* Commit button */}
        {hasCommits && !item.isSynthetic && (
          <div className="border-t border-[#2a2d2e] pt-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <GitCommitIcon size={14} />
              ดู commit ({item.commits!.length})
            </button>
          </div>
        )}
      </div>

      {drawerOpen && hasCommits && (
        <CommitDrawer
          featureTitle={item.newTitle}
          commits={item.commits!}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}

function SubcategorySection({ group, hasReq }: { group: SubcategoryGroup; hasReq: boolean }) {
  const reqItems = group.items.filter(i => i.reqStatus === 'done' || i.reqStatus === 'incorrect' || i.reqStatus === 'pending')
  const doneCount = reqItems.filter(i => i.reqStatus === 'done').length
  const allDone = reqItems.length > 0 && doneCount === reqItems.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-[20px] text-[#f5f5f5]">
          {group.sub || 'ทั่วไป'}
        </h3>
        {hasReq && reqItems.length > 0 && (
          <span className={`text-[14px] font-medium px-2 py-1 rounded-lg ${
            allDone
              ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
              : 'text-[#f47a00] bg-[rgba(244,122,0,0.1)]'
          }`}>
            {doneCount}/{reqItems.length} สำเร็จ
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {group.items.map(item => (
          <ItemCard key={item.id} item={item} hasReq={hasReq} />
        ))}
      </div>
    </div>
  )
}


export function SubcategoryList({ groups, hasReq }: { groups: SubcategoryGroup[]; hasReq?: boolean }) {
  const resolvedHasReq = hasReq ?? false
  return (
    <div className="flex flex-col gap-[48px]">
      {groups.map(group => (
        <SubcategorySection key={group.sub || '__no_sub__'} group={group} hasReq={resolvedHasReq} />
      ))}
    </div>
  )
}
