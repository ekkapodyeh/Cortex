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
  { id: 'AUTH004',   title: 'เข้าสู่ระบบด้วย Google Account',                  description: 'รองรับ Sign in with Google สำหรับบัญชีองค์กร (@company.com) ผ่าน OAuth 2.0',                          category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วย Google'           },
  { id: 'AUTH005',   title: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์',                   description: 'กรอกเบอร์โทรและ OTP SMS 6 หลัก หมดอายุ 5 นาที ไม่ต้องจำรหัสผ่าน',                                    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์'     },
  { id: 'AUTH006',   title: 'ระบบสิทธิ์ผู้ใช้งานแบบ Role-based',               description: 'กำหนด role (Admin, Manager, Staff) แต่ละ role เห็นเมนูและทำสิ่งต่างๆ ได้ต่างกัน',                    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'จัดการสิทธิ์'                      },
  { id: 'PROD005',   title: 'นำเข้าสินค้าจากไฟล์ Excel',                       description: 'อัปโหลด .xlsx เพิ่มสินค้าหลายรายการพร้อมกัน รองรับ validation ก่อน import และแสดง error report',         category: 'จัดการข้อมูลสินค้า',             subcategory: 'นำเข้าข้อมูล'                      },
  { id: 'PROD006',   title: 'ส่งออกรายการสินค้าเป็น CSV',                       description: 'ดาวน์โหลดรายการสินค้าตามที่กรองเป็นไฟล์ CSV พร้อม header และ encoding UTF-8',                           category: 'จัดการข้อมูลสินค้า',             subcategory: 'ส่งออกข้อมูล'                      },
  { id: 'PROD007',   title: 'จัดการข้อมูลผู้จัดจำหน่าย (Supplier)',             description: 'เพิ่ม แก้ไข ลบ supplier เชื่อมกับสินค้าแต่ละรายการ ดูประวัติการสั่งซื้อย้อนหลัง',                    category: 'จัดการข้อมูลสินค้า',             subcategory: 'ผู้จัดจำหน่าย'                     },
  { id: 'PROD009',   title: 'รูปภาพสินค้าหลายรูปพร้อม thumbnail',              description: 'อัปโหลดภาพได้สูงสุด 10 รูปต่อสินค้า ระบบ resize อัตโนมัติ รองรับ WebP',                                category: 'จัดการข้อมูลสินค้า',             subcategory: 'รูปภาพสินค้า'                      },
  { id: 'STOCK006',  title: 'หน้าประวัติการเคลื่อนไหวสต็อก',                   description: 'ดูรายการรับ/เบิก/โอนย้อนหลัง 90 วัน กรองตามสินค้าและวันที่ Export Excel ได้',                          category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ประวัติสต็อก'                       },
  { id: 'STOCK007',  title: 'โอนสต็อกระหว่างสาขา',                             description: 'สร้างใบโอนสินค้า ระบุสาขาต้นทาง-ปลายทาง รอยืนยันจากผู้รับก่อนยืนยัน',                                category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'โอนสต็อก'                           },
  { id: 'REPORT001', title: 'รายงานสต็อกพร้อมกราฟและกรองวันที่',               description: 'หน้าใหม่แสดงกราฟแนวโน้มสต็อก กรองช่วงวันที่ได้ แยกตามสาขา Export PDF/Excel',                          category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'รายงานสต็อก'                        },
  { id: 'REPORT003', title: 'รายงานสินค้าใกล้หมดอายุ',                          description: 'แสดงสินค้าที่จะหมดอายุใน 30/60/90 วัน ส่งออก Excel และตั้งค่าแจ้งเตือนอัตโนมัติ',                       category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'รายงานหมดอายุ'                      },
  { id: 'REPORT005', title: 'รายงานสินค้าขายดีและช้า',                          description: 'จัดอันดับสินค้าตามยอดเบิกใน 30/90 วัน แสดง Top 10 และ Bottom 10',                                        category: 'รายงานและวิเคราะห์ข้อมูล',       subcategory: 'รายงานยอดขาย'                       },
  { id: 'NOTIF001',  title: 'Push Notification บนมือถือ',                        description: 'ส่ง push notification ผ่าน Firebase Cloud Messaging เมื่อสต็อกต่ำหรือสินค้าหมด',                         category: 'การแจ้งเตือนและการแจ้งข่าว',     subcategory: 'Push Notification'                  },
  { id: 'NOTIF003',  title: 'การแจ้งเตือนผ่าน LINE OA',                         description: 'ส่งข้อความแจ้งเตือนผ่าน LINE Official Account เมื่อสต็อกวิกฤต หรืองานค้างเกิน SLA',                    category: 'การแจ้งเตือนและการแจ้งข่าว',     subcategory: 'LINE Notification'                  },
]

// ─── แก้ไข (modified) ────────────────────────────────────────────────────────
const MODIFIED = [
  {
    old: { id: 'AUTH001', title: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน',               description: 'ผู้ดูแลระบบล็อกอินด้วยอีเมลและรหัสผ่าน',                                                   category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน' } as Feature,
    new: { id: 'AUTH001', title: 'เข้าสู่ระบบด้วยอีเมล + OTP ยืนยันตัวตนสำหรับ Admin', description: 'Admin ล็อกอินด้วยอีเมล/รหัสผ่าน แล้วยืนยัน OTP 6 หลักทาง Email ก่อนเข้าระบบ',         category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน' } as Feature,
  },
  {
    old: { id: 'AUTH003', title: 'รีเซ็ตรหัสผ่านผ่านลิงก์ทางอีเมล',               description: 'ส่ง reset link ทางอีเมล มีอายุ 1 ชั่วโมง',                                                   category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'รีเซ็ตรหัสผ่าน' } as Feature,
    new: { id: 'AUTH003', title: 'รีเซ็ตรหัสผ่านผ่าน OTP SMS',                     description: 'เปลี่ยนจาก reset link ทางอีเมล เป็น OTP 6 หลักทาง SMS หมดอายุใน 5 นาที',                 category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'รีเซ็ตรหัสผ่าน' } as Feature,
  },
  {
    old: { id: 'PROD001', title: 'ค้นหาสินค้าตามชื่อและ SKU',                      description: 'ค้นหาสินค้าด้วยชื่อหรือรหัส SKU แบบ exact match',                                            category: 'จัดการข้อมูลสินค้า',             subcategory: 'ค้นหาสินค้า' } as Feature,
    new: { id: 'PROD001', title: 'ค้นหาสินค้าแบบ Full-text + กรองขั้นสูง',         description: 'Full-text search + กรองตามหมวดหมู่ ช่วงราคา สถานะสต็อก สาขา Export เป็น CSV ได้',         category: 'จัดการข้อมูลสินค้า',             subcategory: 'ค้นหาสินค้า' } as Feature,
  },
  {
    old: { id: 'PROD002', title: 'หน้ารายละเอียดสินค้าแบบพื้นฐาน',                description: 'แสดงชื่อ ราคา หมวดหมู่ และจำนวนสต็อก',                                                      category: 'จัดการข้อมูลสินค้า',             subcategory: 'รายละเอียดสินค้า' } as Feature,
    new: { id: 'PROD002', title: 'หน้ารายละเอียดสินค้าพร้อม variant และ bundle',    description: 'แสดง variant (สี/ขนาด) ราคาแต่ละ variant ประวัติราคา และสินค้า bundle ที่เกี่ยวข้อง',      category: 'จัดการข้อมูลสินค้า',             subcategory: 'รายละเอียดสินค้า' } as Feature,
  },
  {
    old: { id: 'STOCK001', title: 'ดูยอดสต็อกปัจจุบันแต่ละสาขา',                  description: 'แสดงยอดสต็อกสินค้าแต่ละสาขา อัปเดตทุก 5 นาที',                                              category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ดูสต็อก' } as Feature,
    new: { id: 'STOCK001', title: 'ดูสต็อก Real-time ทุกสาขาพร้อมเปรียบเทียบ',    description: 'อัปเดตอัตโนมัติทุก 30 วินาที เปรียบเทียบยอดระหว่างสาขา แสดง trend 7 วัน',                 category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ดูสต็อก' } as Feature,
  },
  {
    old: { id: 'STOCK002', title: 'รับสินค้าเข้าคลังด้วยการพิมพ์รหัส',             description: 'กรอกรหัสสินค้าและจำนวนเพื่อรับเข้าคลัง',                                                    category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'รับสินค้าเข้าคลัง' } as Feature,
    new: { id: 'STOCK002', title: 'รับสินค้าเข้าคลังด้วย QR Code และ Barcode',     description: 'สแกน QR/Barcode เพื่อรับสินค้าเข้าคลัง รองรับรับพร้อมกันหลายรายการ บันทึก lot/batch',     category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'รับสินค้าเข้าคลัง' } as Feature,
  },
  {
    old: { id: 'STOCK004', title: 'ตั้งค่าจำนวนขั้นต่ำสต็อกทีละรายการ',            description: 'กำหนด minimum stock แต่ละสินค้าทีละรายการ',                                                  category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ตั้งค่าขั้นต่ำสต็อก' } as Feature,
    new: { id: 'STOCK004', title: 'ตั้งค่าขั้นต่ำสต็อกแบบ Bulk พร้อม Excel Import', description: 'ตั้งค่าทีละหลายรายการพร้อมกัน รองรับอัปโหลด Excel และ preview ก่อน save',                 category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'ตั้งค่าขั้นต่ำสต็อก' } as Feature,
  },
]

// ─── ลบออก (removed) ─────────────────────────────────────────────────────────
const REMOVED: Feature[] = [
  { id: 'AUTH002',  title: 'ระบบ Remember Me 30 วัน',          description: 'จดจำการล็อกอินนาน 30 วัน บน browser เดิม',                       category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน' },
  { id: 'PROD003',  title: 'ระบบ Wishlist สินค้า',              description: 'บันทึกสินค้าที่สนใจ แชร์ wishlist ได้',                           category: 'จัดการข้อมูลสินค้า',             subcategory: 'Wishlist'                          },
  { id: 'STOCK005', title: 'นำเข้าสต็อกจาก CSV แบบเก่า',       description: 'อัปโหลดไฟล์ CSV รูปแบบ legacy เพื่อเพิ่มสต็อก',                   category: 'จัดการสต็อกและคลังสินค้า',       subcategory: 'นำเข้าข้อมูล'                      },
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
