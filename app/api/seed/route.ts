import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Feature, DiffResult, ValidationResult } from '@/lib/types'

export async function POST() {
  // ล้างข้อมูลเก่าก่อน (cascade จะลบ children อัตโนมัติ)
  await db.sprintRequirement.deleteMany()
  await db.projectUpdateDoc.deleteMany()
  await db.knowledgeDoc.deleteMany()
  await db.documentRequirement.deleteMany()
  await db.analysisJob.deleteMany()
  await db.project.deleteMany()

  // ---- Projects ----
  const p1 = await db.project.create({
    data: {
      name: 'Cortex Backend',
      repoUrl: 'https://github.com/acme/cortex-backend',
      platform: 'GITHUB',
      webhookSecret: 'whsec-demo-001',
    },
  })

  const p2 = await db.project.create({
    data: {
      name: 'Mobile App',
      repoUrl: 'https://gitlab.com/acme/mobile-app',
      platform: 'GITLAB',
      webhookSecret: 'whsec-demo-002',
    },
  })

  const p3 = await db.project.create({
    data: {
      name: 'ระบบสต็อกสินค้า',
      repoUrl: 'https://github.com/acme/stock-management',
      platform: 'GITHUB',
      webhookSecret: 'whsec-demo-003',
    },
  })

  const CAT_AUTH   = 'การเข้าสู่ระบบและลงทะเบียน'
  const CAT_USER   = 'การจัดการผู้ใช้'
  const CAT_NOTIFY = 'การแจ้งเตือน'
  const CAT_REPORT = 'การรายงานและ Dashboard'
  const CAT_SEARCH = 'การค้นหาและกรอง'

  // ---- Features ----
  // F001 เดิม (ใน KnowledgeDoc v2 — เป็น email/password)
  const F001_OLD: Feature = { id: 'F001', title: 'เข้าสู่ระบบผ่านอีเมลและรหัสผ่าน', description: 'ผู้ใช้ล็อกอินด้วยอีเมลและรหัสผ่าน', category: CAT_AUTH }
  // F001 ใหม่ (modified — เปลี่ยนเป็น username)
  const F001_NEW: Feature = { id: 'F001', title: 'เข้าสู่ระบบผ่าน Username และรหัสผ่าน', description: 'ผู้ใช้ล็อกอินด้วย username และรหัสผ่าน (เปลี่ยนจากอีเมล)', category: CAT_AUTH }

  const authFeatures: Feature[] = [
    F001_OLD,
    { id: 'F002', title: 'เข้าสู่ระบบผ่าน Google', description: 'รองรับ Sign in with Google OAuth 2.0', category: CAT_AUTH },
    { id: 'F003', title: 'ระบบ JWT Access Token', description: 'ออก JWT token อายุ 15 นาที', category: CAT_AUTH },
    { id: 'F004', title: 'Refresh Token Rotation', description: 'หมุนเวียน refresh token ทุกครั้งที่ใช้', category: CAT_AUTH },
  ]

  const F005: Feature = { id: 'F005', title: 'รีเซ็ตรหัสผ่านผ่านอีเมล', description: 'ส่ง link รีเซ็ตรหัสผ่านไปยังอีเมลของผู้ใช้', category: CAT_AUTH }
  const F006: Feature = { id: 'F006', title: 'สมัครสมาชิกด้วยอีเมล', description: 'ลงทะเบียนบัญชีใหม่ด้วยอีเมลและรหัสผ่าน', category: CAT_AUTH }

  const userFeatures: Feature[] = [
    { id: 'U001', title: 'จัดการโปรไฟล์ผู้ใช้', description: 'แก้ไขชื่อ รูปภาพ และข้อมูลส่วนตัว', category: CAT_USER },
    { id: 'U002', title: 'ระบบสิทธิ์ Role-based', description: 'กำหนดสิทธิ์แบบ Admin / Editor / Viewer', category: CAT_USER },
    { id: 'U003', title: 'Audit Log การกระทำ', description: 'บันทึก log ทุก action สำคัญของผู้ใช้', category: CAT_USER },
  ]

  // ---- Notification features ----
  const N001_OLD: Feature = { id: 'N001', title: 'แจ้งเตือนผ่านอีเมล', description: 'ส่งอีเมลแจ้งเตือนเมื่อมีกิจกรรมสำคัญ', category: CAT_NOTIFY }
  const N001_NEW: Feature = { id: 'N001', title: 'แจ้งเตือนผ่านอีเมลและ SMS', description: 'ส่งทั้งอีเมลและ SMS แจ้งเตือนพร้อมกัน (เพิ่มช่องทาง SMS ผ่าน Twilio)', category: CAT_NOTIFY }
  const N002: Feature = { id: 'N002', title: 'Push Notification มือถือ (Firebase)', description: 'ส่ง push notification ผ่าน Firebase Cloud Messaging บน iOS และ Android', category: CAT_NOTIFY }
  const N003: Feature = { id: 'N003', title: 'ศูนย์แจ้งเตือนภายในแอป', description: 'กล่องรวม notification ทุกประเภท กดอ่านแล้ว/ลบได้ พร้อม badge จำนวนที่ยังไม่อ่าน', category: CAT_NOTIFY }
  const N004: Feature = { id: 'N004', title: 'ตั้งค่าการรับแจ้งเตือนส่วนตัว', description: 'ผู้ใช้เลือกเองว่าจะรับ notification ประเภทไหน ผ่านช่องทางใด', category: CAT_NOTIFY }

  // ---- Report/Dashboard features ----
  const R001_OLD: Feature = { id: 'R001', title: 'รายงานสรุปรายเดือน', description: 'สร้างรายงาน PDF สรุปกิจกรรมประจำเดือน ส่งออกอัตโนมัติ', category: CAT_REPORT }
  const R001_NEW: Feature = { id: 'R001', title: 'รายงานสรุปแบบยืดหยุ่น', description: 'เลือกช่วงเวลาได้เอง รายวัน/สัปดาห์/เดือน พร้อม export PDF หรือ Excel', category: CAT_REPORT }
  const R002: Feature = { id: 'R002', title: 'Dashboard แบบ Real-time', description: 'แสดงสถิติการใช้งาน, จำนวน active users, และ error rate แบบ live', category: CAT_REPORT }
  const R003: Feature = { id: 'R003', title: 'Export ข้อมูลดิบเป็น CSV', description: 'ดาวน์โหลดข้อมูลทุก entity เป็นไฟล์ CSV สำหรับวิเคราะห์ภายนอก', category: CAT_REPORT }

  // ---- Search/Filter features ----
  const S001_OLD: Feature = { id: 'S001', title: 'ค้นหาด้วย Keyword', description: 'ค้นหาเนื้อหาด้วยคำค้นตรงตัวอักษร (exact match)', category: CAT_SEARCH }
  const S001_NEW: Feature = { id: 'S001', title: 'ค้นหาแบบ Full-text Search', description: 'ค้นหาด้วย Elasticsearch รองรับ fuzzy search, relevance score, และ Thai tokenizer', category: CAT_SEARCH }
  const S002_OLD: Feature = { id: 'S002', title: 'กรองข้อมูลพื้นฐาน', description: 'กรองด้วย dropdown เดี่ยวๆ ทีละ field', category: CAT_SEARCH }
  const S003: Feature = { id: 'S003', title: 'กรองตามวันที่และสถานะหลายค่า', description: 'Date range picker + multi-select status filter พร้อม Apply/Reset', category: CAT_SEARCH }
  const S004: Feature = { id: 'S004', title: 'บันทึก Search Preset', description: 'บันทึกชุดการกรองที่ใช้บ่อยเป็น shortcut เรียกได้ด้วยคลิกเดียว', category: CAT_SEARCH }

  const CAT_STK_AUTH   = 'การเข้าสู่ระบบและลงทะเบียน'
  const CAT_STK_PROD   = 'จัดการข้อมูลสินค้า'
  const CAT_STK_STOCK  = 'จัดการสต็อกและคลังสินค้า'
  const CAT_STK_REPORT = 'รายงานและวิเคราะห์ข้อมูล'
  const CAT_STK_NOTIF  = 'การแจ้งเตือนและการแจ้งข่าว'

  // ---- ระบบสต็อกสินค้า: Baseline features (ก่อน Sprint นี้) ----
  const AUTH001_OLD:  Feature = { id: 'AUTH001',   title: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน',          description: 'ล็อกอินด้วยอีเมลและรหัสผ่าน ไม่มีการยืนยันตัวตนเพิ่มเติม',                       category: CAT_STK_AUTH   }
  const AUTH002:      Feature = { id: 'AUTH002',   title: 'ลงทะเบียนสมาชิกใหม่',                       description: 'สร้างบัญชีด้วยอีเมล ชื่อ-นามสกุล และรหัสผ่าน พร้อมยืนยันอีเมลก่อนเข้าใช้งาน',  category: CAT_STK_AUTH   }
  const AUTH003_OLD:  Feature = { id: 'AUTH003',   title: 'รีเซ็ตรหัสผ่านผ่านลิงก์อีเมล',              description: 'ส่ง link รีเซ็ตรหัสผ่านไปยังอีเมล มีอายุ 1 ชั่วโมง',                             category: CAT_STK_AUTH   }
  const PROD001_OLD:  Feature = { id: 'PROD001',   title: 'ค้นหาสินค้าด้วยชื่อ',                        description: 'ค้นหาสินค้าด้วย keyword แบบ exact match ไม่รองรับคำที่สะกดผิด',                  category: CAT_STK_PROD   }
  const PROD002:      Feature = { id: 'PROD002',   title: 'เพิ่มและแก้ไขข้อมูลสินค้า',                  description: 'เพิ่มสินค้าใหม่ แก้ไขชื่อ ราคา หมวดหมู่ และรหัสบาร์โค้ด',                       category: CAT_STK_PROD   }
  const PROD003:      Feature = { id: 'PROD003',   title: 'จัดการหมวดหมู่สินค้า',                       description: 'เพิ่ม แก้ไข ลบหมวดหมู่ และย้ายสินค้าระหว่างหมวดหมู่',                           category: CAT_STK_PROD   }
  const PROD004:      Feature = { id: 'PROD004',   title: 'อัปโหลดรูปภาพสินค้า',                        description: 'อัปโหลดรูปสินค้าสูงสุด 3 รูปต่อชิ้น ขนาดไม่เกิน 5MB ต่อรูป',                   category: CAT_STK_PROD   }
  const STOCK001_OLD: Feature = { id: 'STOCK001',  title: 'ดูจำนวนสต็อกปัจจุบัน',                       description: 'แสดงจำนวนสต็อกคงเหลือ กดปุ่มรีเฟรชด้วยตัวเองเพื่ออัปเดต',                      category: CAT_STK_STOCK  }
  const STOCK002:     Feature = { id: 'STOCK002',  title: 'บันทึกรับสินค้าเข้าคลัง',                    description: 'กรอกจำนวนที่รับเข้า ระบุผู้จัดจำหน่าย วันที่ และหมายเหตุ',                       category: CAT_STK_STOCK  }
  const STOCK003:     Feature = { id: 'STOCK003',  title: 'บันทึกเบิกสินค้าออก',                        description: 'กรอกจำนวนที่เบิกออก ระบุเหตุผลและแผนกที่รับ',                                   category: CAT_STK_STOCK  }
  const STOCK004_OLD: Feature = { id: 'STOCK004',  title: 'ตั้งค่าขั้นต่ำสต็อกรายสินค้า',              description: 'ตั้ง minimum stock level ทีละ 1 รายการผ่านหน้าแก้ไขสินค้า',                    category: CAT_STK_STOCK  }
  const STOCK005:     Feature = { id: 'STOCK005',  title: 'นำเข้าสต็อกจากไฟล์ CSV (เวอร์ชันเก่า)',    description: 'อัปโหลด CSV เพื่ออัปเดตสต็อก รองรับเฉพาะ ASCII ไม่มี error report',               category: CAT_STK_STOCK  }
  const REPORT001_OLD: Feature = { id: 'REPORT001', title: 'รายงานสต็อกคงเหลือ (ตารางพื้นฐาน)',        description: 'แสดงสต็อกคงเหลือเป็นตาราง ไม่สามารถกรองหรือ export ได้',                         category: CAT_STK_REPORT }
  const REPORT002:    Feature = { id: 'REPORT002',  title: 'พิมพ์รายงานสต็อกแบบ Basic',                description: 'พิมพ์รายงานสต็อกผ่านหน้าเว็บ ไม่มีตัวเลือกกรองหรือปรับแต่ง layout',           category: CAT_STK_REPORT }

  // ---- ระบบสต็อกสินค้า: Sprint features (ใหม่/เปลี่ยนแปลง) ----
  // การเข้าสู่ระบบและลงทะเบียน
  const AUTH001_NEW:  Feature = { id: 'AUTH001',   title: 'เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน + OTP',      description: 'ล็อกอินด้วยอีเมลและรหัสผ่าน เพิ่มขั้นตอน OTP ทาง Email สำหรับ Admin',           category: CAT_STK_AUTH   }
  const AUTH003_NEW:  Feature = { id: 'AUTH003',   title: 'รีเซ็ตรหัสผ่านผ่าน OTP SMS',                 description: 'ส่ง OTP 6 หลักทาง SMS แทน link อีเมล หมดอายุใน 5 นาที',                        category: CAT_STK_AUTH   }
  const AUTH004:      Feature = { id: 'AUTH004',   title: 'เข้าสู่ระบบด้วย Google Account',             description: 'ล็อกอินด้วยบัญชี Google ขององค์กร ไม่ต้องจำรหัสผ่านแยก',                      category: CAT_STK_AUTH   }
  const AUTH005:      Feature = { id: 'AUTH005',   title: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์',               description: 'กรอกเบอร์โทรและ OTP SMS เพื่อล็อกอิน ไม่ต้องใช้รหัสผ่าน',                      category: CAT_STK_AUTH   }
  const AUTH006:      Feature = { id: 'AUTH006',   title: 'ออกจากระบบทุกอุปกรณ์พร้อมกัน',               description: 'ยกเลิก session ทุกอุปกรณ์พร้อมกัน สำหรับกรณีบัญชีถูกขโมยหรือสูญหาย',           category: CAT_STK_AUTH   }
  // จัดการข้อมูลสินค้า
  const PROD001_NEW:  Feature = { id: 'PROD001',   title: 'ค้นหาและกรองสินค้าขั้นสูง',                  description: 'Full-text search + กรองตามหมวดหมู่ ช่วงราคา สถานะสต็อก Export ผลลัพธ์เป็น CSV', category: CAT_STK_PROD   }
  const PROD005:      Feature = { id: 'PROD005',   title: 'นำเข้าสินค้าจากไฟล์ Excel',                  description: 'อัปโหลดไฟล์ .xlsx เพิ่มสินค้าหลายรายการพร้อมกัน รองรับ validation ก่อน import',  category: CAT_STK_PROD   }
  const PROD006:      Feature = { id: 'PROD006',   title: 'ส่งออกรายการสินค้าเป็น CSV',                  description: 'ดาวน์โหลดรายการสินค้าทั้งหมดหรือตามที่กรองเป็นไฟล์ CSV',                        category: CAT_STK_PROD   }
  const PROD007:      Feature = { id: 'PROD007',   title: 'จัดการข้อมูลผู้จัดจำหน่าย',                  description: 'เพิ่ม แก้ไข ลบข้อมูล supplier เชื่อมโยงกับสินค้าแต่ละรายการ',                    category: CAT_STK_PROD   }
  // จัดการสต็อกและคลังสินค้า
  const STOCK001_NEW: Feature = { id: 'STOCK001',  title: 'ดูสต็อก Real-time ทุกสาขา',                  description: 'แสดงสต็อกอัปเดตอัตโนมัติทุก 30 วินาที เปรียบเทียบยอดระหว่างสาขาได้',             category: CAT_STK_STOCK  }
  const STOCK004_NEW: Feature = { id: 'STOCK004',  title: 'ตั้งค่าขั้นต่ำสต็อกแบบ Bulk',               description: 'ตั้ง minimum stock level ทีละหลายรายการพร้อมกัน รองรับอัปโหลดผ่าน Excel',       category: CAT_STK_STOCK  }
  const STOCK006:     Feature = { id: 'STOCK006',  title: 'ดูประวัติการเคลื่อนไหวสต็อก',                description: 'แสดงรายการรับ/เบิก/โอน ย้อนหลัง 90 วัน กรองตามสินค้าและช่วงวันที่ได้',         category: CAT_STK_STOCK  }
  const STOCK007:     Feature = { id: 'STOCK007',  title: 'โอนสต็อกระหว่างสาขา',                        description: 'สร้างใบโอนสินค้าจากสาขาหนึ่งไปอีกสาขา ยืนยันรับก่อนตัดยอด',                   category: CAT_STK_STOCK  }
  const STOCK008:     Feature = { id: 'STOCK008',  title: 'ปรับยอดสต็อกฉุกเฉิน',                        description: 'Admin แก้ไขจำนวนสต็อกได้โดยตรง พร้อมบันทึกเหตุผลและผู้อนุมัติ',                 category: CAT_STK_STOCK  }
  // รายงานและวิเคราะห์ข้อมูล
  const REPORT001_NEW: Feature = { id: 'REPORT001', title: 'รายงานวิเคราะห์สต็อก (กราฟ + กรองวันที่)',  description: 'แสดงกราฟการเคลื่อนไหวสต็อก กรองช่วงวันที่ได้ export Excel',                       category: CAT_STK_REPORT }
  const REPORT003:    Feature = { id: 'REPORT003',  title: 'รายงานสินค้าใกล้หมดอายุ',                    description: 'แสดงสินค้าที่จะหมดอายุใน 30/60/90 วัน ส่งออก Excel และแจ้งเตือนล่วงหน้า',      category: CAT_STK_REPORT }
  // การแจ้งเตือน
  const NOTIF001:     Feature = { id: 'NOTIF001',  title: 'แจ้งเตือน Push Notification บนมือถือ',       description: 'ส่ง push notification ผ่าน Firebase เมื่อสต็อกต่ำกว่าขั้นต่ำหรือสินค้าหมด',    category: CAT_STK_NOTIF  }

  const mobileFeatures: Feature[] = [
    { id: 'M001', title: 'Push Notification', description: 'แจ้งเตือนผ่าน Firebase FCM', category: 'Notification' },
    { id: 'M002', title: 'In-app Notification', description: 'แจ้งเตือนภายในแอป', category: 'Notification' },
    { id: 'M003', title: 'Offline Mode', description: 'ใช้งานได้แม้ไม่มีสัญญาณอินเทอร์เน็ต', category: 'Core' },
    { id: 'M004', title: 'Dark Mode', description: 'รองรับธีมมืด', category: 'UI' },
  ]

  // ---- Project 1: Cortex Backend — ครบทุก state ----

  // Requirement v1
  await db.documentRequirement.create({
    data: {
      projectId: p1.id,
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: [...authFeatures] as any,
      createdBy: 'ekkapodyeh',
    },
  })

  // Requirement v2 — ครอบคลุม auth, user, notify, report, search
  // ไม่มี: F002(Google), F006(สมัคร), U003(audit), N004(notify settings), R001(old report), S004(preset)
  const reqV2Features: Feature[] = [
    F001_NEW, authFeatures[2], authFeatures[3], F005,
    ...userFeatures.slice(0, 2),
    N003,
    R002, R003,
    S003,
  ]
  await db.documentRequirement.create({
    data: {
      projectId: p1.id,
      version: 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: reqV2Features as any,
      createdBy: 'ekkapodyeh',
    },
  })

  // Job 1 — DONE + APPROVED → สร้าง KnowledgeDoc v1
  const job1 = await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'a1b2c3d4e5f6a1b2c3d4e5f6',
      commitMsg: 'feat: implement email/password auth and JWT',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  })

  const job1NewFeatures: Feature[] = [authFeatures[0], authFeatures[1], authFeatures[2]]
  const job1Diff: DiffResult = {
    added: [authFeatures[0], authFeatures[1], authFeatures[2]],
    removed: [],
    modified: [],
  }
  const job1Validation: ValidationResult = {
    passed: false,
    missing: [authFeatures[3]],
    extra: [],
    mismatched: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: job1.id,
      projectId: p1.id,
      featuresNew: job1NewFeatures,
      diff: job1Diff,
      validation: job1Validation,
      status: 'APPROVED',
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: p1.id,
      version: 1,
      features: job1NewFeatures,
      approvedBy: 'ekkapodyeh',
      sourceJobId: job1.id,
    },
  })

  // Job 2 — DONE + APPROVED → สร้าง KnowledgeDoc v2
  const job2 = await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'b2c3d4e5f6a7b2c3d4e5f6a7',
      commitMsg: 'feat: add refresh token rotation and password reset',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  })

  // KnowledgeDoc v2 baseline: F001(email), F002(Google), F003(JWT), F004(Refresh)
  const job2NewFeatures: Feature[] = [...authFeatures]
  const job2Diff: DiffResult = {
    added: [authFeatures[3]],
    removed: [],
    modified: [],
  }
  const job2Validation: ValidationResult = {
    passed: false,
    missing: [F005],
    extra: [authFeatures[1]],
    mismatched: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: job2.id,
      projectId: p1.id,
      featuresNew: job2NewFeatures,
      diff: job2Diff,
      validation: job2Validation,
      status: 'APPROVED',
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: p1.id,
      version: 2,
      features: job2NewFeatures,
      approvedBy: 'ekkapodyeh',
      sourceJobId: job2.id,
    },
  })

  // Job 3 — DONE + REJECTED
  const job3 = await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'c3d4e5f6a7b8c3d4e5f6a7b8',
      commitMsg: 'feat: add user profile and roles (incomplete)',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  })

  const job3NewFeatures: Feature[] = [...authFeatures, userFeatures[0]]
  const job3Diff: DiffResult = {
    added: [userFeatures[0]],
    removed: [],
    modified: [],
  }
  const job3Validation: ValidationResult = {
    passed: false,
    missing: [F001_NEW, F005, userFeatures[1]],
    extra: [authFeatures[1]],
    mismatched: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: job3.id,
      projectId: p1.id,
      featuresNew: job3NewFeatures,
      diff: job3Diff,
      validation: job3Validation,
      status: 'REJECTED',
    },
  })

  // Job 4 — DONE + PENDING (รอ Review)
  const job4 = await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'd4e5f6a7b8c9d4e5f6a7b8c9',
      commitMsg: 'feat: add role-based access control and audit log',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  })

  // job4 (PENDING) — 5 หมวดหมู่: auth, user, notify, report, search
  const job4NewFeatures: Feature[] = [
    F001_NEW, authFeatures[2], authFeatures[3], F005, F006,
    ...userFeatures,
    N001_NEW, N003, N004,
    R001_NEW, R002, R003,
    S001_NEW, S003, S004,
  ]
  const job4Diff: DiffResult = {
    added: [
      F005, F006,
      userFeatures[0], userFeatures[1], userFeatures[2],
      N003, N004,
      R002, R003,
      S003, S004,
    ],
    removed: [authFeatures[1], N002, S002_OLD],
    modified: [
      { old: authFeatures[0], new: F001_NEW },
      { old: N001_OLD, new: N001_NEW },
      { old: R001_OLD, new: R001_NEW },
      { old: S001_OLD, new: S001_NEW },
    ],
  }
  const job4Validation: ValidationResult = {
    passed: false,
    missing: [],
    extra: [F006, userFeatures[2], N004, S004],
    mismatched: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: job4.id,
      projectId: p1.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      featuresNew: job4NewFeatures as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diff: job4Diff as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validation: job4Validation as any,
      status: 'PENDING',
    },
  })

  // Job 5 — RUNNING
  await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'e5f6a7b8c9d0e5f6a7b8c9d0',
      commitMsg: 'feat: add email notification system',
      author: 'ekkapodyeh',
      status: 'RUNNING',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 5),
    },
  })

  // Job 6 — FAILED
  await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'f6a7b8c9d0e1f6a7b8c9d0e1',
      commitMsg: 'chore: bump dependencies',
      author: 'ekkapodyeh',
      status: 'FAILED',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  })

  // Job 7 — QUEUED
  await db.analysisJob.create({
    data: {
      projectId: p1.id,
      commitSha: 'a7b8c9d0e1f2a7b8c9d0e1f2',
      commitMsg: 'fix: resolve race condition in token refresh',
      author: 'ekkapodyeh',
      status: 'QUEUED',
      triggeredAt: new Date(),
    },
  })

  // ---- Project 2: Mobile App ----

  await db.documentRequirement.create({
    data: {
      projectId: p2.id,
      version: 1,
      features: [...mobileFeatures],
      createdBy: 'ekkapodyeh',
    },
  })

  const mJob1 = await db.analysisJob.create({
    data: {
      projectId: p2.id,
      commitSha: 'b8c9d0e1f2a3b8c9d0e1f2a3',
      commitMsg: 'feat: push notification with FCM',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    },
  })

  const mJob1Features: Feature[] = [mobileFeatures[0], mobileFeatures[1]]
  const mJob1Diff: DiffResult = { added: mJob1Features, removed: [], modified: [] }
  const mJob1Validation: ValidationResult = {
    passed: false,
    missing: [mobileFeatures[2], mobileFeatures[3]],
    extra: [],
    mismatched: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: mJob1.id,
      projectId: p2.id,
      featuresNew: mJob1Features,
      diff: mJob1Diff,
      validation: mJob1Validation,
      status: 'APPROVED',
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: p2.id,
      version: 1,
      features: mJob1Features,
      approvedBy: 'ekkapodyeh',
      sourceJobId: mJob1.id,
    },
  })

  await db.analysisJob.create({
    data: {
      projectId: p2.id,
      commitSha: 'c9d0e1f2a3b4c9d0e1f2a3b4',
      commitMsg: 'feat: offline mode and dark theme',
      author: 'ekkapodyeh',
      status: 'FAILED',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
  })

  await db.analysisJob.create({
    data: {
      projectId: p2.id,
      commitSha: 'd0e1f2a3b4c5d0e1f2a3b4c5',
      commitMsg: 'fix: FCM token refresh on app restart',
      author: 'ekkapodyeh',
      status: 'RUNNING',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 3),
    },
  })

  // ---- Project 3: ระบบสต็อกสินค้า ----

  const stkReqFeatures: Feature[] = [AUTH001_OLD, AUTH002, AUTH003_OLD, PROD001_OLD, PROD002, PROD003, PROD004, STOCK001_OLD, STOCK002, STOCK003, STOCK004_OLD, STOCK005, REPORT001_OLD, REPORT002]
  await db.documentRequirement.create({
    data: {
      projectId: p3.id,
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: stkReqFeatures as any,
      createdBy: 'ekkapodyeh',
    },
  })

  const pJob1 = await db.analysisJob.create({
    data: {
      projectId: p3.id,
      commitSha: 'e1f2a3b4c5d6e1f2a3b4c5d6',
      commitMsg: 'feat: เปิดตัวระบบสต็อก — login, จัดการสินค้า, รับ/เบิกของ, รายงานพื้นฐาน',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  })

  const pJob1Features: Feature[] = [AUTH001_OLD, AUTH002, AUTH003_OLD, PROD001_OLD, PROD002, PROD003, PROD004, STOCK001_OLD, STOCK002, STOCK003, STOCK004_OLD, STOCK005, REPORT001_OLD, REPORT002]
  const pJob1Diff: DiffResult = { added: pJob1Features, removed: [], modified: [] }
  const pJob1Validation: ValidationResult = { passed: true, missing: [], extra: [], mismatched: [] }

  await db.projectUpdateDoc.create({
    data: {
      jobId: pJob1.id,
      projectId: p3.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      featuresNew: pJob1Features as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diff: pJob1Diff as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validation: pJob1Validation as any,
      status: 'APPROVED',
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: p3.id,
      version: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features: pJob1Features as any,
      approvedBy: 'ekkapodyeh',
      sourceJobId: pJob1.id,
    },
  })

  const pJob2 = await db.analysisJob.create({
    data: {
      projectId: p3.id,
      commitSha: 'f2a3b4c5d6e7f2a3b4c5d6e7',
      commitMsg: 'feat: Google Login, import Excel, สต็อก Real-time, กรองสินค้า, รายงานกราฟ, 2FA, Dark Mode, PDF',
      author: 'ekkapodyeh',
      status: 'DONE',
      triggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  })

  // Diff:
  //   เสร็จแล้ว   → AUTH001(modify+OTP), AUTH003(modify→SMS), AUTH004(add Google), AUTH005(add Phone)
  //                  PROD001(modify→full-text), PROD005(add Excel import), PROD006(add CSV export), PROD007(add supplier)
  //                  STOCK001(modify→real-time), STOCK004(modify→bulk), STOCK005(remove CSV old), STOCK006(add history)
  //                  REPORT003(add expiry report), NOTIF001(add push)
  //   ไม่ถูกต้อง  → REPORT001(add แทน modify — dev สร้างหน้าใหม่แทนแก้ของเดิม)
  //   ไม่มีใน Req → AUTH006(add logout all), PROD004(remove photo upload), STOCK007(add transfer), STOCK008(add emergency adj), REPORT002(remove basic print)
  //   ยังไม่ครบ   → NOTIF002(in-app alert), SCAN001(barcode), REPORT004(dashboard)
  const pJob2Features: Feature[] = [
    AUTH001_NEW, AUTH002, AUTH003_NEW, AUTH004, AUTH005, AUTH006,
    PROD001_NEW, PROD002, PROD003, PROD005, PROD006, PROD007,
    STOCK001_NEW, STOCK002, STOCK003, STOCK004_NEW, STOCK006, STOCK007, STOCK008,
    REPORT001_NEW, REPORT003,
    NOTIF001,
  ]
  const pJob2Diff: DiffResult = {
    added: [AUTH004, AUTH005, AUTH006, PROD005, PROD006, PROD007, STOCK006, STOCK007, STOCK008, REPORT001_NEW, REPORT003, NOTIF001],
    removed: [PROD004, STOCK005, REPORT002],
    modified: [
      { old: AUTH001_OLD,  new: AUTH001_NEW  },
      { old: AUTH003_OLD,  new: AUTH003_NEW  },
      { old: PROD001_OLD,  new: PROD001_NEW  },
      { old: STOCK001_OLD, new: STOCK001_NEW },
      { old: STOCK004_OLD, new: STOCK004_NEW },
    ],
  }
  const pJob2Validation: ValidationResult = { passed: false, missing: [], extra: [AUTH006, STOCK007, STOCK008], mismatched: [] }

  await db.projectUpdateDoc.create({
    data: {
      jobId: pJob2.id,
      projectId: p3.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      featuresNew: pJob2Features as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diff: pJob2Diff as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validation: pJob2Validation as any,
      status: 'PENDING',
    },
  })

  // ไม่มี sprintRequirement ใน seed — ใช้ปุ่ม "ทดลองด้วย Mock Data" ในหน้า Sprint Review

  await db.analysisJob.create({
    data: {
      projectId: p3.id,
      commitSha: 'a3b4c5d6e7f8a3b4c5d6e7f8',
      commitMsg: 'fix: แก้ไขการนับสต็อกผิดเมื่อบันทึกรับและเบิกพร้อมกัน',
      author: 'ekkapodyeh',
      status: 'QUEUED',
      triggeredAt: new Date(),
    },
  })

  return NextResponse.json({
    ok: true,
    projects: 3,
    jobs: 13,
    requirements: 4,
    knowledgeDocs: 4,
    updateDocs: 7,
  })
}
