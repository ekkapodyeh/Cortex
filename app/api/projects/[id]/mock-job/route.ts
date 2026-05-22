import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Feature, DiffResult } from '@/lib/types'

const MOCK_COMMITS = [
  { sha: 'f2a3b4c', msg: 'feat: Auth OTP + Google Login + Phone Login', author: 'dev-somchai' },
  { sha: 'a8d1e2f', msg: 'feat: Product import/export + Supplier management', author: 'dev-malee' },
  { sha: 'b5c6d7e', msg: 'feat: Stock real-time + movement history', author: 'dev-nattapol' },
  { sha: 'c9d0e1f', msg: 'feat: Report upgrade + Push notification', author: 'dev-pattama' },
]

// ─── เพิ่มใหม่ (added) ───────────────────────────────────────────────────────
const ADDED: Feature[] = [
  {
    id: 'AUTH004',
    title: 'เข้าสู่ระบบด้วย Google Account',
    description: 'รองรับ Sign in with Google สำหรับบัญชีองค์กร (@company.com) ผ่าน OAuth 2.0',
    category: 'การเข้าสู่ระบบและลงทะเบียน',
  },
  {
    id: 'AUTH005',
    title: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์',
    description: 'กรอกเบอร์โทรและ OTP SMS 6 หลัก หมดอายุ 5 นาที ไม่ต้องจำรหัสผ่าน',
    category: 'การเข้าสู่ระบบและลงทะเบียน',
  },
  {
    id: 'PROD005',
    title: 'นำเข้าสินค้าจากไฟล์ Excel',
    description: 'อัปโหลด .xlsx เพิ่มสินค้าหลายรายการพร้อมกัน รองรับ validation ก่อน import และแสดง error report',
    category: 'จัดการข้อมูลสินค้า',
  },
  {
    id: 'PROD006',
    title: 'ส่งออกรายการสินค้าเป็น CSV',
    description: 'ดาวน์โหลดรายการสินค้าตามที่กรองเป็นไฟล์ CSV พร้อม header และ encoding UTF-8',
    category: 'จัดการข้อมูลสินค้า',
  },
  {
    id: 'PROD007',
    title: 'จัดการข้อมูลผู้จัดจำหน่าย (Supplier)',
    description: 'เพิ่ม แก้ไข ลบ supplier เชื่อมกับสินค้าแต่ละรายการ ดูประวัติการสั่งซื้อย้อนหลัง',
    category: 'จัดการข้อมูลสินค้า',
  },
  {
    id: 'STOCK006',
    title: 'หน้าประวัติการเคลื่อนไหวสต็อก',
    description: 'ดูรายการรับ/เบิก/โอนย้อนหลัง 90 วัน กรองตามสินค้าและวันที่ Export Excel ได้',
    category: 'จัดการสต็อกและคลังสินค้า',
  },
  {
    id: 'REPORT001',
    title: 'รายงานสต็อกพร้อมกราฟและกรองวันที่',
    description: 'หน้าใหม่แสดงกราฟแนวโน้มสต็อก กรองช่วงวันที่ได้ แยกตามสาขา Export PDF/Excel',
    category: 'รายงานและวิเคราะห์ข้อมูล',
  },
  {
    id: 'REPORT003',
    title: 'รายงานสินค้าใกล้หมดอายุ',
    description: 'แสดงสินค้าที่จะหมดอายุใน 30/60/90 วัน ส่งออก Excel และตั้งค่าแจ้งเตือนอัตโนมัติ',
    category: 'รายงานและวิเคราะห์ข้อมูล',
  },
  {
    id: 'NOTIF001',
    title: 'Push Notification บนมือถือ',
    description: 'ส่ง push notification ผ่าน Firebase Cloud Messaging เมื่อสต็อกต่ำหรือสินค้าหมด',
    category: 'การแจ้งเตือนและการแจ้งข่าว',
  },
]

// ─── แก้ไข (modified) ────────────────────────────────────────────────────────
const MODIFIED = [
  {
    old: {
      id: 'AUTH001',
      title: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน',
      description: 'ผู้ดูแลระบบล็อกอินด้วยอีเมลและรหัสผ่าน',
      category: 'การเข้าสู่ระบบและลงทะเบียน',
    } as Feature,
    new: {
      id: 'AUTH001',
      title: 'เข้าสู่ระบบด้วยอีเมล + OTP ยืนยันตัวตนสำหรับ Admin',
      description: 'Admin ล็อกอินด้วยอีเมล/รหัสผ่าน แล้วยืนยัน OTP 6 หลักทาง Email ก่อนเข้าระบบ',
      category: 'การเข้าสู่ระบบและลงทะเบียน',
    } as Feature,
  },
  {
    old: {
      id: 'AUTH003',
      title: 'รีเซ็ตรหัสผ่านผ่านลิงก์ทางอีเมล',
      description: 'ส่ง reset link ทางอีเมล มีอายุ 1 ชั่วโมง',
      category: 'การเข้าสู่ระบบและลงทะเบียน',
    } as Feature,
    new: {
      id: 'AUTH003',
      title: 'รีเซ็ตรหัสผ่านผ่าน OTP SMS',
      description: 'เปลี่ยนจาก reset link ทางอีเมล เป็น OTP 6 หลักทาง SMS หมดอายุใน 5 นาที',
      category: 'การเข้าสู่ระบบและลงทะเบียน',
    } as Feature,
  },
  {
    old: {
      id: 'PROD001',
      title: 'ค้นหาสินค้าตามชื่อและ SKU',
      description: 'ค้นหาสินค้าด้วยชื่อหรือรหัส SKU แบบ exact match',
      category: 'จัดการข้อมูลสินค้า',
    } as Feature,
    new: {
      id: 'PROD001',
      title: 'ค้นหาสินค้าแบบ Full-text + กรองขั้นสูง',
      description: 'Full-text search + กรองตามหมวดหมู่ ช่วงราคา สถานะสต็อก สาขา Export เป็น CSV ได้',
      category: 'จัดการข้อมูลสินค้า',
    } as Feature,
  },
  {
    old: {
      id: 'STOCK001',
      title: 'ดูยอดสต็อกปัจจุบันแต่ละสาขา',
      description: 'แสดงยอดสต็อกสินค้าแต่ละสาขา อัปเดตทุก 5 นาที',
      category: 'จัดการสต็อกและคลังสินค้า',
    } as Feature,
    new: {
      id: 'STOCK001',
      title: 'ดูสต็อก Real-time ทุกสาขาพร้อมเปรียบเทียบ',
      description: 'อัปเดตอัตโนมัติทุก 30 วินาที เปรียบเทียบยอดระหว่างสาขา แสดง trend 7 วัน',
      category: 'จัดการสต็อกและคลังสินค้า',
    } as Feature,
  },
  {
    old: {
      id: 'STOCK004',
      title: 'ตั้งค่าจำนวนขั้นต่ำสต็อกทีละรายการ',
      description: 'กำหนด minimum stock แต่ละสินค้าทีละรายการ',
      category: 'จัดการสต็อกและคลังสินค้า',
    } as Feature,
    new: {
      id: 'STOCK004',
      title: 'ตั้งค่าขั้นต่ำสต็อกแบบ Bulk พร้อม Excel Import',
      description: 'ตั้งค่าทีละหลายรายการพร้อมกัน รองรับอัปโหลด Excel และ preview ก่อน save',
      category: 'จัดการสต็อกและคลังสินค้า',
    } as Feature,
  },
]

// ─── ลบออก (removed) ─────────────────────────────────────────────────────────
const REMOVED: Feature[] = [
  {
    id: 'STOCK005',
    title: 'นำเข้าสต็อกจาก CSV แบบเก่า',
    description: 'อัปโหลดไฟล์ CSV รูปแบบ legacy เพื่อเพิ่มสต็อก',
    category: 'จัดการสต็อกและคลังสินค้า',
  },
]

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const latestKnowledge = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  const existingFeatures = (latestKnowledge?.features as unknown as Feature[]) ?? []

  const modifiedIds  = new Set(MODIFIED.map(m => m.new.id))
  const removedIds   = new Set(REMOVED.map(f => f.id))
  const addedIds     = new Set(ADDED.map(f => f.id))

  const featuresNew: Feature[] = [
    ...existingFeatures.filter(f => !modifiedIds.has(f.id) && !removedIds.has(f.id) && !addedIds.has(f.id)),
    ...MODIFIED.map(m => m.new),
    ...ADDED,
  ]

  const diff: DiffResult = {
    added: ADDED,
    modified: MODIFIED,
    removed: REMOVED,
  }

  const commit = MOCK_COMMITS[Math.floor(Math.random() * MOCK_COMMITS.length)]
  const sha = commit.sha.slice(0, 5) + Math.random().toString(36).slice(2, 5)

  const job = await db.analysisJob.create({
    data: {
      projectId: id,
      commitSha: sha,
      commitMsg: commit.msg,
      author: commit.author,
      status: 'DONE',
      updateDoc: {
        create: {
          projectId: id,
          featuresNew: featuresNew as any,
          diff: diff as any,
          validation: { passed: true, errors: [] } as any,
          status: 'PENDING',
        },
      },
    },
  })

  return NextResponse.json({ jobId: job.id }, { status: 201 })
}
