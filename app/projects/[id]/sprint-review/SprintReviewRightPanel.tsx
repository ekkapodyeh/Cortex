'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DiffResult } from '@/lib/types'
import { FileIcon, PlayIcon, PresentationChartIcon, XIcon } from '@phosphor-icons/react'

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
  fileName: string | null
  createdBy: string
  items: SprintReqItem[]
}

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
      // ✅ done — changeType ตรงกับ diff
      { id: 'SR001', featureId: 'AUTH001',   title: 'ปรับปรุงหน้าล็อกอินให้ยืนยัน OTP สำหรับ Admin',               description: 'เพิ่มขั้นตอน OTP ทาง Email หลังล็อกอินสำเร็จสำหรับผู้ดูแลระบบ',              priority: 'high',   changeType: 'modify', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน' },
      { id: 'SR002', featureId: 'AUTH003',   title: 'ปรับปรุงการรีเซ็ตรหัสผ่านเป็น OTP SMS',                        description: 'เปลี่ยนจาก link ทางอีเมล เป็น OTP 6 หลักทาง SMS หมดอายุใน 5 นาที',           priority: 'medium', changeType: 'modify', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'รีเซ็ตรหัสผ่าน'                    },
      { id: 'SR003', featureId: 'AUTH004',   title: 'เพิ่มการเข้าสู่ระบบด้วย Google Account',                       description: 'รองรับ Sign in with Google สำหรับบัญชีองค์กร',                               priority: 'high',   changeType: 'add',    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วย Google'            },
      { id: 'SR004', featureId: 'AUTH005',   title: 'เพิ่มการเข้าสู่ระบบด้วยเบอร์โทรศัพท์',                        description: 'กรอกเบอร์โทรและ OTP SMS เพื่อล็อกอิน ไม่ต้องใช้รหัสผ่าน',                   priority: 'medium', changeType: 'add',    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์'     },
      { id: 'SR005', featureId: 'AUTH006',   title: 'เพิ่มระบบสิทธิ์ผู้ใช้งานแบบ Role-based',                      description: 'Admin กำหนด role และควบคุมการเข้าถึงเมนูแต่ละส่วน',                           priority: 'high',   changeType: 'add',    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'จัดการสิทธิ์'                      },
      { id: 'SR006', featureId: 'AUTH002',   title: 'ลบ Remember Me ออกเพื่อความปลอดภัย',                           description: 'ยกเลิกฟีเจอร์จดจำการล็อกอิน 30 วัน ตามนโยบาย security ใหม่',                  priority: 'high',   changeType: 'remove', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน' },
      { id: 'SR007', featureId: 'PROD001',   title: 'ปรับปรุงการค้นหาสินค้าเป็น Full-text',                         description: 'Full-text search + กรองตามหมวดหมู่ ช่วงราคา สถานะสต็อก Export เป็น CSV',     priority: 'medium', changeType: 'modify', category: 'จัดการข้อมูลสินค้า',             subcategory: 'ค้นหาสินค้า'                        },
      { id: 'SR008', featureId: 'PROD002',   title: 'ปรับปรุงหน้ารายละเอียดสินค้าให้รองรับ variant',                description: 'แสดง variant สี/ขนาด ประวัติราคา สินค้า bundle',                              priority: 'medium', changeType: 'modify', category: 'จัดการข้อมูลสินค้า',             subcategory: 'รายละเอียดสินค้า'                   },
      { id: 'SR009', featureId: 'PROD003',   title: 'ลบระบบ Wishlist ออก',                                          description: 'ลบออกเนื่องจากไม่มีผู้ใช้งาน และ scope ไม่ตรงกับระบบ B2B',                    priority: 'low',    changeType: 'remove', category: 'จัดการข้อมูลสินค้า',             subcategory: 'Wishlist'                            },
      { id: 'SR010', featureId: 'PROD005',   title: 'เพิ่มการนำเข้าสินค้าจากไฟล์ Excel',                           description: 'อัปโหลด .xlsx เพิ่มสินค้าหลายรายการ รองรับ validation ก่อน import',           priority: 'high',   changeType: 'add',    category: 'จัดการข้อมูลสินค้า',             subcategory: 'นำเข้าข้อมูล'                       },
      { id: 'SR011', featureId: 'PROD006',   title: 'เพิ่มการส่งออกรายการสินค้าเป็น CSV',                           description: 'ดาวน์โหลดรายการสินค้าตามที่กรองเป็นไฟล์ CSV',                               priority: 'low',    changeType: 'add',    category: 'จัดการข้อมูลสินค้า',             subcategory: 'ส่งออกข้อมูล'                       },
      { id: 'SR012', featureId: 'PROD007',   title: 'เพิ่มระบบจัดการผู้จัดจำหน่าย',                                description: 'เพิ่ม แก้ไข ลบ supplier เชื่อมกับสินค้าแต่ละรายการ',                         priority: 'medium', changeType: 'add',    category: 'จัดการข้อมูลสินค้า',             subcategory: 'ผู้จัดจำหน่าย'                      },
      { id: 'SR013', featureId: 'STOCK001',  title: 'ปรับปรุงการดูสต็อกให้เป็น Real-time ทุกสาขา',                  description: 'อัปเดตอัตโนมัติทุก 30 วินาที เปรียบเทียบยอดระหว่างสาขาได้',                  priority: 'high',   changeType: 'modify', category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ดูสต็อก'                            },
      { id: 'SR014', featureId: 'STOCK002',  title: 'ปรับปรุงการรับสินค้าให้สแกน QR/Barcode ได้',                   description: 'สแกน QR/Barcode รับสินค้าเข้าคลัง รองรับ lot/batch',                          priority: 'high',   changeType: 'modify', category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'รับสินค้าเข้าคลัง'                 },
      { id: 'SR015', featureId: 'STOCK004',  title: 'ปรับปรุงการตั้งค่าขั้นต่ำสต็อกเป็นแบบ Bulk',                  description: 'ตั้งค่าทีละหลายรายการพร้อมกัน รองรับอัปโหลด Excel',                           priority: 'medium', changeType: 'modify', category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ตั้งค่าขั้นต่ำสต็อก'               },
      { id: 'SR016', featureId: 'STOCK005',  title: 'ลบฟีเจอร์นำเข้าสต็อกจาก CSV เก่า',                            description: 'ลบออกเพราะแทนด้วยระบบ Excel import ที่มี validation ดีกว่า',                  priority: 'low',    changeType: 'remove', category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'นำเข้าข้อมูล'                       },
      { id: 'SR017', featureId: 'STOCK006',  title: 'เพิ่มหน้าประวัติการเคลื่อนไหวสต็อก',                          description: 'ดูรายการรับ/เบิก/โอน ย้อนหลัง 90 วัน กรองตามสินค้าและวันที่',               priority: 'medium', changeType: 'add',    category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ประวัติสต็อก'                       },
      { id: 'SR018', featureId: 'REPORT003', title: 'เพิ่มรายงานสินค้าใกล้หมดอายุ',                                 description: 'แสดงสินค้าที่จะหมดอายุใน 30/60/90 วัน ส่งออก Excel',                        priority: 'high',   changeType: 'add',    category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'รายงานหมดอายุ'                      },
      { id: 'SR019', featureId: 'REPORT005', title: 'เพิ่มรายงานสินค้าขายดีและช้า',                                 description: 'จัดอันดับสินค้าตามยอดเบิกใน 30/90 วัน Top 10 / Bottom 10',                   priority: 'medium', changeType: 'add',    category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'รายงานยอดขาย'                       },
      { id: 'SR020', featureId: 'NOTIF001',  title: 'เพิ่มการแจ้งเตือน Push Notification บนมือถือ',                 description: 'ส่ง push notification ผ่าน Firebase เมื่อสต็อกต่ำหรือสินค้าหมด',             priority: 'medium', changeType: 'add',    category: 'การแจ้งเตือนและการแจ้งข่าว',     subcategory: 'Push Notification'                  },
      { id: 'SR021', featureId: 'NOTIF003',  title: 'เพิ่มการแจ้งเตือนผ่าน LINE OA',                                description: 'ส่งข้อความแจ้งเตือนสต็อกวิกฤตผ่าน LINE Official Account',                    priority: 'medium', changeType: 'add',    category: 'การแจ้งเตือนและการแจ้งข่าว',     subcategory: 'LINE Notification'                  },

      // ❌ not-done — changeType ไม่ตรงกับ diff
      { id: 'SR022', featureId: 'REPORT001', title: 'ปรับปรุงรายงานสต็อกให้มีกราฟและกรองวันที่',                    description: 'แก้รายงานเดิมให้แสดงกราฟ+กรองช่วงวันที่ได้ (dev สร้างหน้าใหม่แทน)',           priority: 'high',   changeType: 'modify', category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'รายงานสต็อก'                        },
      { id: 'SR023', featureId: 'STOCK007',  title: 'ปรับปรุงการโอนสต็อกระหว่างสาขา',                              description: 'ปรับ UI ใบโอนสินค้า เพิ่ม approval flow (req บอก modify แต่ dev สร้างใหม่)',   priority: 'medium', changeType: 'modify', category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'โอนสต็อก'                           },
      { id: 'SR024', featureId: 'PROD009',   title: 'ปรับปรุงการจัดการรูปภาพสินค้า',                                description: 'แก้ให้รองรับหลายรูปและ thumbnail (req บอก modify แต่ dev เพิ่งสร้างใหม่)',      priority: 'low',    changeType: 'modify', category: 'จัดการข้อมูลสินค้า',             subcategory: 'รูปภาพสินค้า'                       },

      // ⬜ missing — ไม่มีใน diff เลย
      { id: 'SR025', featureId: 'NOTIF002',  title: 'การแจ้งเตือนในแอปเมื่อสต็อกต่ำกว่าขั้นต่ำ',                  description: 'แสดง notification badge และรายการแจ้งเตือนภายในแอปเมื่อสต็อกต่ำ',              priority: 'medium', changeType: 'add',    category: 'การแจ้งเตือนและการแจ้งข่าว',     subcategory: 'การแจ้งเตือนในแอป'                 },
      { id: 'SR026', featureId: 'SCAN001',   title: 'การสแกนบาร์โค้ดเพื่อรับ/เบิกสินค้า',                         description: 'ใช้กล้องมือถือสแกนแทนพิมพ์รหัสสินค้าด้วยมือ',                               priority: 'medium', changeType: 'add',    category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'สแกนบาร์โค้ด'                       },
      { id: 'SR027', featureId: 'REPORT004', title: 'Dashboard สรุปยอดสต็อกประจำวัน',                               description: 'แสดงสถิติสต็อก สินค้าขายดี และแนวโน้มรายเดือน',                             priority: 'low',    changeType: 'add',    category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'Dashboard'                          },
      { id: 'SR028', featureId: 'ORDER001',  title: 'ระบบสั่งซื้อสินค้าจากผู้จัดจำหน่าย',                          description: 'สร้าง PO ส่งให้ supplier อัตโนมัติเมื่อสต็อกต่ำกว่า minimum',                  priority: 'high',   changeType: 'add',    category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'สั่งซื้อสินค้า'                     },
      { id: 'SR029', featureId: 'PAY001',    title: 'ระบบชำระเงินออนไลน์',                                          description: 'รองรับ QR PromptPay, บัตรเครดิต/เดบิต และ e-Wallet',                        priority: 'high',   changeType: 'add',    category: 'การชำระเงิน',                     subcategory: 'ช่องทางชำระ'                        },
      { id: 'SR030', featureId: 'PAY002',    title: 'ประวัติการชำระเงินและใบเสร็จ',                                  description: 'ดูประวัติ transaction ดาวน์โหลดใบเสร็จ PDF',                                  priority: 'medium', changeType: 'add',    category: 'การชำระเงิน',                     subcategory: 'ใบเสร็จ'                            },
    ]
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
      <FileIcon size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
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
          <XIcon size={12} />
        )}
      </button>
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
  bottomAction?: React.ReactNode
}

export function SprintReviewRightPanel({ projectId, jobId, commitSha, commitMsg, author, triggeredAt, diffResult, sprintDocs, noDiff, bottomAction }: Props) {
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
            <UploadZone projectId={projectId} jobId={jobId} />
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
                  <p className="text-[10px] text-[var(--text-muted)]">เสร็จแล้ว</p>
                </div>
                <div className="py-3 text-center">
                  <p className="text-lg font-bold text-[var(--status-yellow)]">{partialCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">ไม่ถูกต้อง</p>
                </div>
                <div className="py-3 text-center">
                  <p className="text-lg font-bold text-[var(--status-red)]">{notDoneCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">ยังไม่ครบ</p>
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
