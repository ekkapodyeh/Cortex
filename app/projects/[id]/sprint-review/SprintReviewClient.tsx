'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Feature, DiffResult } from '@/lib/types'
import { IMPACT } from '@/lib/impact-data'

interface SprintReqItem {
  id: string
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add' | 'modify' | 'remove'
}

interface SprintDoc {
  id: string
  fileName: string | null
  createdBy: string
  items: SprintReqItem[]
}

type ChangeType = 'added' | 'modified' | 'removed'

interface FeatureItem {
  feature: Feature
  oldFeature: Feature | null
  changeType: ChangeType
  category: string
  req: SprintReqItem | null
}

type ReqStatus = 'done' | 'partial'

function getStatus(item: FeatureItem): ReqStatus {
  if (!item.req) return 'partial'
  if (item.req.changeType === 'add' && item.changeType === 'added') return 'done'
  if (item.req.changeType === 'modify' && item.changeType === 'modified') return 'done'
  if (item.req.changeType === 'remove' && item.changeType === 'removed') return 'done'
  return 'partial'
}

function ChangeBadge({ type }: { type: ChangeType }) {
  const styles = { added: 'text-[var(--status-green)] bg-green-900/10', modified: 'text-[var(--status-yellow)] bg-yellow-900/10', removed: 'text-[var(--status-red)] bg-red-900/10' }
  const labels = { added: '+ เพิ่มใหม่', modified: '~ แก้ไข', removed: '− ลบออก' }
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded shrink-0 ${styles[type]}`}>{labels[type]}</span>
}


function groupByCategory(items: FeatureItem[]) {
  const map = new Map<string, FeatureItem[]>()
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category)!.push(item)
  }
  return Array.from(map.entries()).map(([cat, features]) => ({ cat, features }))
}

function CategoryCard({ cat, items }: { cat: string; items: FeatureItem[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-[var(--bg-hover)] transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{cat}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{items.length} รายการ</p>
        </div>
        <span className={`text-[var(--text-muted)] text-sm transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <>
          <div className="grid grid-cols-[120px_1fr_1fr] border-t border-b border-[var(--border)]">
            <div />
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 py-2">ของเดิม</p>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-4 py-2 border-l border-[var(--border)]">ของใหม่</p>
          </div>
          {items.map((item, i) => {
            const impact = IMPACT[item.feature.id]
            return (
              <div key={item.feature.id} className={i > 0 ? 'border-t border-[var(--border)]' : ''}>
                <div className="grid grid-cols-[120px_1fr_1fr]">
                  <div className="px-4 py-3 flex items-start">
                    <ChangeBadge type={item.changeType} />
                  </div>
                  <div className="px-4 py-3">
                    {item.oldFeature ? (
                      <>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.oldFeature.title}</p>
                        {item.oldFeature.description && <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.oldFeature.description}</p>}
                      </>
                    ) : item.changeType === 'added' ? (
                      <p className="text-xs text-[var(--text-muted)] italic">ไม่มีก่อนหน้านี้</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.feature.title}</p>
                        {item.feature.description && <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.feature.description}</p>}
                      </>
                    )}
                  </div>
                  <div className="px-4 py-3 border-l border-[var(--border)]">
                    {item.changeType === 'removed' ? (
                      <p className="text-xs text-[var(--status-red)] italic">ถูกลบออกจากโค้ดแล้ว</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.feature.title}</p>
                        {item.feature.description && <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.feature.description}</p>}
                      </>
                    )}
                    {impact && (
                      <div className="flex items-start gap-1.5 mt-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-2.5 py-2">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mt-0.5 leading-none">Impact</span>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{impact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ─── Upload zone (compact, for adding more docs) ───
function AddDocButton({ projectId, jobId }: { projectId: string; jobId: string }) {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingName, setProcessingName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    setProcessingName(file.name)
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1800))
    const mockItems = [
      { id: `SR-${Date.now()}-1`, featureId: 'FR001', title: 'เพิ่ม Fraud Detection Rule Engine', description: 'ตรวจจับธุรกรรมน่าสงสัยด้วย Rule-based System เช่น วงเงินเกิน 500K/24h', priority: 'high', changeType: 'add' },
      { id: `SR-${Date.now()}-2`, featureId: 'P003', title: 'เพิ่มระบบ Installment Payment', description: 'รองรับผ่อนชำระ 3/6/12 เดือนผ่าน KBank และ SCB', priority: 'medium', changeType: 'add' },
      { id: `SR-${Date.now()}-3`, featureId: 'AUD001', title: 'ปรับปรุง Audit Log System', description: 'เพิ่ม Structured Logging (JSON), Export CSV/Excel, Retention Policy 90 วัน', priority: 'low', changeType: 'modify' },
    ]
    await fetch(`/api/projects/${projectId}/sprint-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, items: mockItems, fileName: file.name, createdBy: 'BA' }),
    })
    setProcessing(false)
    router.refresh()
  }

  if (processing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-[var(--border)] rounded-xl">
        <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{processingName}</p>
          <p className="text-[10px] text-[var(--text-muted)]">กำลังประมวลผล...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        dragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
      }`}
    >
      <span className="text-base">+</span>
      <div>
        <p className="text-xs font-medium text-[var(--text-primary)]">เพิ่มเอกสาร Requirement</p>
        <p className="text-[10px] text-[var(--text-muted)]">.pdf, .docx, .txt</p>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

// ─── Upload zone (large, first doc) ───
function UploadZone({ projectId, jobId }: { projectId: string; jobId: string }) {
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    setFileName(file.name)
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1800))
    const mockItems = [
      // เสร็จแล้ว — ตรงกับ diff ทั้ง changeType
      { id: 'SR001', featureId: 'AUTH001',  title: 'ปรับปรุงหน้าล็อกอินให้ยืนยัน OTP สำหรับ Admin',          description: 'เพิ่มขั้นตอน OTP ทาง Email หลังล็อกอินสำเร็จสำหรับผู้ดูแลระบบ',                   priority: 'high',   changeType: 'modify' },
      { id: 'SR002', featureId: 'AUTH003',  title: 'ปรับปรุงการรีเซ็ตรหัสผ่านเป็น OTP SMS',                   description: 'เปลี่ยนจาก link ทางอีเมล เป็น OTP 6 หลักทาง SMS หมดอายุใน 5 นาที',                priority: 'medium', changeType: 'modify' },
      { id: 'SR003', featureId: 'AUTH004',  title: 'เพิ่มการเข้าสู่ระบบด้วย Google Account',                  description: 'รองรับ Sign in with Google สำหรับบัญชีองค์กร',                                    priority: 'high',   changeType: 'add'    },
      { id: 'SR004', featureId: 'AUTH005',  title: 'เพิ่มการเข้าสู่ระบบด้วยเบอร์โทรศัพท์',                   description: 'กรอกเบอร์โทรและ OTP SMS เพื่อล็อกอิน ไม่ต้องใช้รหัสผ่าน',                        priority: 'medium', changeType: 'add'    },
      { id: 'SR005', featureId: 'PROD001',  title: 'ปรับปรุงการค้นหาสินค้าเป็น Full-text + กรองขั้นสูง',     description: 'Full-text search + กรองตามหมวดหมู่ ช่วงราคา สถานะสต็อก Export เป็น CSV',          priority: 'medium', changeType: 'modify' },
      { id: 'SR006', featureId: 'PROD005',  title: 'เพิ่มการนำเข้าสินค้าจากไฟล์ Excel',                      description: 'อัปโหลด .xlsx เพิ่มสินค้าหลายรายการ รองรับ validation ก่อน import',                priority: 'high',   changeType: 'add'    },
      { id: 'SR007', featureId: 'PROD006',  title: 'เพิ่มการส่งออกรายการสินค้าเป็น CSV',                      description: 'ดาวน์โหลดรายการสินค้าตามที่กรองเป็นไฟล์ CSV',                                    priority: 'low',    changeType: 'add'    },
      { id: 'SR008', featureId: 'PROD007',  title: 'เพิ่มระบบจัดการข้อมูลผู้จัดจำหน่าย',                     description: 'เพิ่ม แก้ไข ลบ supplier เชื่อมกับสินค้าแต่ละรายการ',                              priority: 'medium', changeType: 'add'    },
      { id: 'SR009', featureId: 'STOCK001', title: 'ปรับปรุงการดูสต็อกให้เป็น Real-time ทุกสาขา',             description: 'อัปเดตอัตโนมัติทุก 30 วินาที เปรียบเทียบยอดระหว่างสาขาได้',                       priority: 'high',   changeType: 'modify' },
      { id: 'SR010', featureId: 'STOCK004', title: 'ปรับปรุงการตั้งค่าขั้นต่ำสต็อกเป็นแบบ Bulk',              description: 'ตั้งค่าทีละหลายรายการพร้อมกัน รองรับอัปโหลด Excel',                              priority: 'medium', changeType: 'modify' },
      { id: 'SR011', featureId: 'STOCK005', title: 'ลบฟีเจอร์นำเข้าสต็อกจาก CSV เก่า',                       description: 'ลบออกเพราะแทนด้วยระบบ Excel import ที่มี validation ดีกว่า',                       priority: 'low',    changeType: 'remove' },
      { id: 'SR012', featureId: 'STOCK006', title: 'เพิ่มหน้าประวัติการเคลื่อนไหวสต็อก',                     description: 'ดูรายการรับ/เบิก/โอน ย้อนหลัง 90 วัน กรองตามสินค้าและวันที่',                    priority: 'medium', changeType: 'add'    },
      { id: 'SR013', featureId: 'REPORT003', title: 'เพิ่มรายงานสินค้าใกล้หมดอายุ',                          description: 'แสดงสินค้าที่จะหมดอายุใน 30/60/90 วัน ส่งออก Excel',                             priority: 'high',   changeType: 'add'    },
      { id: 'SR014', featureId: 'NOTIF001', title: 'เพิ่มการแจ้งเตือน Push Notification บนมือถือ',            description: 'ส่ง push notification ผ่าน Firebase เมื่อสต็อกต่ำหรือสินค้าหมด',                 priority: 'medium', changeType: 'add'    },
      // ไม่ถูกต้อง — req:modify แต่ dev ทำ add (สร้าง feature ใหม่แทนแก้ของเดิม)
      { id: 'SR015', featureId: 'REPORT001', title: 'ปรับปรุงรายงานสต็อกให้มีกราฟและกรองวันที่',             description: 'แก้รายงานเดิมให้แสดงกราฟ+กรองช่วงวันที่ได้ (dev สร้างหน้าใหม่แทน)',              priority: 'high',   changeType: 'modify' },
      // ยังไม่ครบ — ไม่อยู่ใน diff เลย
      { id: 'SR016', featureId: 'NOTIF002', title: 'เพิ่มการแจ้งเตือนในแอปเมื่อสต็อกต่ำกว่าขั้นต่ำ',       description: 'แสดง notification badge และรายการแจ้งเตือนภายในแอปเมื่อสต็อกต่ำ',                priority: 'medium', changeType: 'add'    },
      { id: 'SR017', featureId: 'SCAN001',  title: 'เพิ่มการสแกนบาร์โค้ดเพื่อรับ/เบิกสินค้า',               description: 'ใช้กล้องมือถือสแกนแทนพิมพ์รหัสสินค้าด้วยมือ',                                   priority: 'medium', changeType: 'add'    },
      { id: 'SR018', featureId: 'REPORT004', title: 'เพิ่ม Dashboard สรุปยอดสต็อกประจำวัน',                  description: 'แสดงสถิติสต็อก สินค้าขายดี และแนวโน้มรายเดือน',                                  priority: 'low',    changeType: 'add'    },
    ]
    await fetch(`/api/projects/${projectId}/sprint-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, items: mockItems, fileName: file.name, createdBy: 'BA' }),
    })
    router.refresh()
  }

  if (processing) {
    return (
      <div className="border border-[var(--border)] rounded-xl px-5 py-8 text-center">
        <div className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-primary)]">{fileName}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">กำลังประมวลผล...</p>
      </div>
    )
  }

  async function handleTrial() {
    const mockFile = new File(['mock'], 'mock-sprint-requirement.txt', { type: 'text/plain' })
    await handleFile(mockFile)
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-5 py-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
        }`}
      >
        <p className="text-2xl mb-2">📄</p>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">อัปโหลด Requirement</p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก<br />.pdf, .docx, .txt</p>
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      <button
        onClick={handleTrial}
        className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)] transition-colors"
      >
        ▶ ทดลองด้วย Mock Data
      </button>
    </div>
  )
}

// ─── Doc card in right panel ───
function DocCard({ doc, projectId }: { doc: SprintDoc; projectId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/projects/${projectId}/sprint-requirements/${doc.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-start gap-2">
      <span className="text-base shrink-0 mt-0.5">📄</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{doc.fileName ?? 'requirement.pdf'}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">โดย {doc.createdBy}</p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--status-red)] hover:bg-red-900/10 transition-colors disabled:opacity-40"
      >
        {deleting ? (
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}

interface Props {
  projectId: string
  jobId: string
  diffResult: DiffResult
  sprintDocs: SprintDoc[]
  commitSha: string
  commitMsg: string
  author: string
  triggeredAt: string
}

export function SprintReviewClient({ projectId, jobId, diffResult, sprintDocs, commitSha, commitMsg, author, triggeredAt }: Props) {
  const allReqItems = sprintDocs.flatMap(d => d.items)
  const reqMap = new Map(allReqItems.map(r => [r.featureId, r]))
  const hasReq = sprintDocs.length > 0

  const items: FeatureItem[] = [
    ...(diffResult.added ?? []).map(f => ({ feature: f, oldFeature: null, changeType: 'added' as const, category: f.category ?? 'ทั่วไป', req: reqMap.get(f.id) ?? null })),
    ...(diffResult.modified ?? []).map(c => ({ feature: c.new, oldFeature: c.old, changeType: 'modified' as const, category: c.new.category ?? 'ทั่วไป', req: reqMap.get(c.new.id) ?? null })),
    ...(diffResult.removed ?? []).map(f => ({ feature: f, oldFeature: null, changeType: 'removed' as const, category: f.category ?? 'ทั่วไป', req: reqMap.get(f.id) ?? null })),
  ]

  const diffFeatureIds = new Set([
    ...(diffResult.added ?? []).map(f => f.id),
    ...(diffResult.modified ?? []).map(c => c.new.id),
    ...(diffResult.removed ?? []).map(f => f.id),
  ])

  // Req-centric groupings
  const doneItems = items.filter(i => i.req !== null && getStatus(i) === 'done')
  const partialItems = items.filter(i => i.req !== null && getStatus(i) === 'partial')
  const notDoneItems = allReqItems.filter((r, idx) =>
    !diffFeatureIds.has(r.featureId) && allReqItems.findIndex(x => x.featureId === r.featureId) === idx
  )
  // feature ที่เปลี่ยนในโค้ดแต่ไม่มีใน Requirement
  const noReqItems = items.filter(i => i.req === null)

  // Category groupings (no-req mode)
  const categoryMap = new Map<string, FeatureItem[]>()
  for (const item of items) {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, [])
    categoryMap.get(item.category)!.push(item)
  }
  const groups = Array.from(categoryMap.entries()).map(([cat, features]) => ({ cat, features }))

  return (
    <div className="p-8 pb-24">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sprint Review</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">ติดตามการเปลี่ยนแปลงจากโค้ดปัจจุบัน</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0 space-y-8">
          {hasReq ? (
            <>
              {/* เสร็จแล้ว */}
              {doneItems.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[24px] font-semibold text-[var(--status-green)]">เสร็จแล้ว</p>
                    <span className="text-xs text-[var(--status-green)] bg-green-900/15 px-2 py-0.5 rounded-full">{doneItems.length} รายการ</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {groupByCategory(doneItems).map(({ cat, features }) => (
                      <CategoryCard key={cat} cat={cat} items={features} />
                    ))}
                  </div>
                </section>
              )}

              {/* ไม่ถูกต้อง */}
              {partialItems.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[24px] font-semibold text-[var(--status-yellow)]">ไม่ถูกต้อง</p>
                    <span className="text-xs text-[var(--status-yellow)] bg-yellow-900/15 px-2 py-0.5 rounded-full">{partialItems.length} รายการ</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {groupByCategory(partialItems).map(({ cat, features }) => (
                      <CategoryCard key={cat} cat={cat} items={features} />
                    ))}
                  </div>
                </section>
              )}

              {/* ไม่มีใน Requirement */}
              {noReqItems.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[24px] font-semibold text-[var(--text-muted)]">ไม่มีใน Requirement</p>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">{noReqItems.length} รายการ</span>
                    <p className="text-xs text-[var(--text-muted)]">— มีการเปลี่ยนแปลงในโค้ดแต่ไม่ได้ระบุใน Req</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {groupByCategory(noReqItems).map(({ cat, features }) => (
                      <CategoryCard key={cat} cat={cat} items={features} />
                    ))}
                  </div>
                </section>
              )}

              {/* ยังไม่ครบ */}
              {notDoneItems.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[24px] font-semibold text-[var(--status-red)]">ยังไม่ครบ</p>
                    <span className="text-xs text-[var(--status-red)] bg-red-900/15 px-2 py-0.5 rounded-full">{notDoneItems.length} รายการ</span>
                    <p className="text-xs text-[var(--text-muted)]">— อยู่ใน Requirement แต่ยังไม่พบในโค้ด</p>
                  </div>
                  <div className="bg-[var(--bg-card)] border border-red-800/25 rounded-xl overflow-hidden divide-y divide-[var(--border)]">
                    {notDoneItems.map(req => (
                      <div key={req.id} className="px-5 py-4 flex items-start gap-3">
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded shrink-0 text-[var(--status-red)] bg-red-900/10 mt-0.5">
                          {req.changeType === 'add' ? '+ ต้องเพิ่ม' : req.changeType === 'modify' ? '~ ต้องแก้' : '− ต้องลบ'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{req.title}</p>
                          {req.description && <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{req.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            // No req — category view
            groups.map(({ cat, features }) => (
              <CategoryCard key={cat} cat={cat} items={features} />
            ))
          )}
        </div>

        {/* ─── Right panel (sticky) ─── */}
        <div className="w-72 shrink-0 sticky top-0 h-screen overflow-y-auto py-8 space-y-3">
          {/* Commit info */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-start gap-3">
            <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded shrink-0 mt-0.5">{commitSha.slice(0, 7)}</code>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{commitMsg || 'ไม่มี commit message'}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{author} · {new Date(triggeredAt).toLocaleString('th-TH')}</p>
            </div>
          </div>

          {/* Diff summary chips */}
          <div className="grid grid-cols-2 gap-2">
            {(diffResult.added ?? []).length > 0 && (
              <div className="flex items-center gap-2 bg-green-900/15 border border-green-800/30 rounded-xl px-3 py-2.5">
                <span className="text-base font-bold text-[var(--status-green)]">{(diffResult.added ?? []).length}</span>
                <span className="text-xs text-[var(--status-green)]">เพิ่มใหม่</span>
              </div>
            )}
            {(diffResult.modified ?? []).length > 0 && (
              <div className="flex items-center gap-2 bg-yellow-900/15 border border-yellow-800/30 rounded-xl px-3 py-2.5">
                <span className="text-base font-bold text-[var(--status-yellow)]">{(diffResult.modified ?? []).length}</span>
                <span className="text-xs text-[var(--status-yellow)]">แก้ไข</span>
              </div>
            )}
            {(diffResult.removed ?? []).length > 0 && (
              <div className="flex items-center gap-2 bg-red-900/15 border border-red-800/30 rounded-xl px-3 py-2.5">
                <span className="text-base font-bold text-[var(--status-red)]">{(diffResult.removed ?? []).length}</span>
                <span className="text-xs text-[var(--status-red)]">ลบออก</span>
              </div>
            )}
          </div>

          {/* Req stats */}
          {hasReq && (() => {
            const total = doneItems.length + partialItems.length + notDoneItems.length
            const pct = total > 0 ? Math.round((doneItems.length / total) * 100) : 0
            const donePct = total > 0 ? (doneItems.length / total) * 100 : 0
            const partialPct = total > 0 ? (partialItems.length / total) * 100 : 0
            return (
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
                    <p className="text-lg font-bold text-[var(--status-green)]">{doneItems.length}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">เสร็จแล้ว</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-lg font-bold text-[var(--status-yellow)]">{partialItems.length}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">ไม่ถูกต้อง</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-lg font-bold text-[var(--status-red)]">{notDoneItems.length}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">ยังไม่ครบ</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Doc cards + upload — max 1 file */}
          {sprintDocs.length === 0 ? (
            <UploadZone projectId={projectId} jobId={jobId} />
          ) : (
            sprintDocs.map(doc => (
              <DocCard key={doc.id} doc={doc} projectId={projectId} />
            ))
          )}

          {/* Summary button — primary, always at bottom */}
          <Link
            href={`/projects/${projectId}/sprint-review/summary`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <span>📊</span>
            สรุปการแก้ไข
          </Link>
        </div>
      </div>
    </div>
  )
}
