// @ts-nocheck
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Feature, DiffResult, ValidationResult } from '@/lib/types'

const now = Date.now()
const daysAgo = (d: number) => new Date(now - 1000 * 60 * 60 * 24 * d)

export async function POST() {
  await db.sprintRequirement.deleteMany()
  await db.projectUpdateDoc.deleteMany()
  await db.knowledgeDoc.deleteMany()
  await db.documentRequirement.deleteMany()
  await db.analysisJob.deleteMany()
  await db.project.deleteMany()

  // ──────────────────────────────────────────
  // PROJECT 1: Doctor Mobile
  // ──────────────────────────────────────────
  const doctorMobile = await db.project.create({
    data: {
      name: 'Doctor Mobile',
      repoUrl: 'https://github.com/gooddoctor-th/doctor-mobile',
      platform: 'GITHUB',
      webhookSecret: 'whsec-dm-001',
      createdAt: daysAgo(90),
    },
  })

  // ── Feature definitions ──

  // AUTH (v1 = email only, v2 = email + OTP)
  const AUTH001_v1: Feature = { id: 'AUTH001', title: 'เข้าสู่ระบบด้วย Email และ Password', description: 'ผู้ใช้ล็อกอินด้วยอีเมลและรหัสผ่าน ตรวจสอบ credential ผ่าน Firebase Auth ออก JWT token อายุ 24 ชั่วโมง', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password' }
  const AUTH001_v2: Feature = { id: 'AUTH001', title: 'เข้าสู่ระบบด้วย Email และ Password + OTP', description: 'ผู้ใช้ล็อกอินด้วยอีเมลและรหัสผ่าน เพิ่มขั้นตอน OTP 6 หลักทาง Email สำหรับอุปกรณ์ใหม่ หมดอายุใน 5 นาที', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password' }
  const AUTH002: Feature = { id: 'AUTH002', title: 'เข้าสู่ระบบด้วย Google Account', description: 'รองรับ Sign in with Google OAuth 2.0 เชื่อมกับ Firebase Auth ใช้งานได้ทั้ง iOS และ Android', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Google Account' }
  const AUTH003: Feature = { id: 'AUTH003', title: 'ลงทะเบียนสมาชิกใหม่', description: 'สร้างบัญชีด้วยอีเมล ชื่อ-นามสกุล เบอร์โทร และวันเกิด ยืนยัน OTP ทางอีเมลก่อนเข้าใช้งาน', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'ลงทะเบียนสมาชิก' }
  const AUTH004: Feature = { id: 'AUTH004', title: 'รีเซ็ตรหัสผ่านผ่าน OTP SMS', description: 'ส่ง OTP 6 หลักทาง SMS ใช้เบอร์โทรที่ผูกกับบัญชี หมดอายุใน 5 นาที กรอก OTP แล้วตั้งรหัสผ่านใหม่ได้ทันที', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'รีเซ็ตรหัสผ่าน' }

  // Report
  const RPT001: Feature = { id: 'RPT001', title: 'รายงานสุขภาพประจำวัน', description: 'สรุปข้อมูลสุขภาพรายวัน ได้แก่ ระดับความเจ็บปวด จำนวนชั่วโมงนอนหลับ ขั้นตอนการเดิน และค่า SpO2 พร้อมกราฟแนวโน้ม 7 วัน', category: 'Report', subcategory: '' }
  const RPT002: Feature = { id: 'RPT002', title: 'ประวัติการนัดหมายแพทย์', description: 'แสดงรายการนัดหมายที่ผ่านมาและที่กำลังจะมาถึง พร้อมบันทึกการวินิจฉัยและคำแนะนำของแพทย์', category: 'Report', subcategory: '' }
  const RPT003: Feature = { id: 'RPT003', title: 'Export รายงานเป็น PDF', description: 'สร้างรายงานสุขภาพสรุปรายเดือนเป็น PDF พร้อมโลโก้คลินิก ส่งออกทางอีเมลหรือบันทึกลงอุปกรณ์', category: 'Report', subcategory: '' }

  // Migraine Tracking
  const MIG001: Feature = { id: 'MIG001', title: 'บันทึกอาการปวดหัวไมเกรน', description: 'กรอกระดับความเจ็บปวด (0–10) ตำแหน่ง ระยะเวลา และ trigger เช่น แสง เสียง อาหาร ความเครียด บันทึกเวลาได้แบบ real-time หรือย้อนหลัง', category: 'Migraine Tracking', subcategory: '' }
  const MIG002: Feature = { id: 'MIG002', title: 'ดูประวัติอาการและ Trigger', description: 'กราฟ timeline แสดงประวัติอาการ 30/60/90 วัน วิเคราะห์ trigger ที่พบบ่อย และแนวโน้มของอาการ', category: 'Migraine Tracking', subcategory: '' }
  const MIG003: Feature = { id: 'MIG003', title: 'แจ้งเตือนอาการรุนแรง', description: 'ตรวจจับเมื่อระดับความเจ็บปวด ≥ 8 หรืออาการเกิดบ่อยกว่า 4 ครั้งต่อเดือน ส่ง push notification แนะนำให้พบแพทย์', category: 'Migraine Tracking', subcategory: '' }

  // Medicine Pouch (Sprint เพิ่มใหม่)
  const MED001: Feature = { id: 'MED001', title: 'จัดการรายการยาส่วนตัว', description: 'เพิ่ม แก้ไข ลบรายการยา ระบุชื่อยา ขนาด ความถี่ และวันหมดอายุ รองรับสแกนบาร์โค้ดเพื่อค้นหาข้อมูลยาอัตโนมัติ', category: 'Medicine Pouch', subcategory: '' }
  const MED002: Feature = { id: 'MED002', title: 'แจ้งเตือนเวลากินยา', description: 'ตั้งเวลาแจ้งเตือน push notification + in-app สำหรับแต่ละมื้อยา กดยืนยันการกินยาได้จากการแจ้งเตือนโดยตรง', category: 'Medicine Pouch', subcategory: '' }
  const MED003: Feature = { id: 'MED003', title: 'บันทึกประวัติการกินยา', description: 'บันทึกว่ากินยาตรงเวลาหรือไม่ แสดงสถิติ adherence rate รายสัปดาห์ แจ้งเตือนเมื่อยาใกล้หมด', category: 'Medicine Pouch', subcategory: '' }

  // Discount code collection (Sprint เพิ่มใหม่)
  const DIS001: Feature = { id: 'DIS001', title: 'รวบรวมและจัดการโค้ดส่วนลด', description: 'เพิ่มโค้ดส่วนลดจาก partner clinic หรือพันธมิตร แสดงมูลค่า วันหมดอายุ และเงื่อนไขการใช้งาน', category: 'Discount code collection', subcategory: '' }
  const DIS002: Feature = { id: 'DIS002', title: 'ใช้โค้ดส่วนลดในการซื้อสินค้า', description: 'กรอกหรือเลือกโค้ดระหว่าง checkout ระบบตรวจสอบความถูกต้องและหักส่วนลดอัตโนมัติ', category: 'Discount code collection', subcategory: '' }
  const DIS003: Feature = { id: 'DIS003', title: 'แจ้งเตือนโค้ดใกล้หมดอายุ', description: 'ส่ง push notification เมื่อโค้ดจะหมดอายุภายใน 3 วัน พร้อมลิงก์ไปยังสินค้าที่ใช้โค้ดได้', category: 'Discount code collection', subcategory: '' }

  // Marketplace — Migra Shop (Sprint เพิ่มใหม่)
  const MKT001: Feature = { id: 'MKT001', title: 'หน้าแสดงรายการสินค้า', description: 'แสดงสินค้าผลิตภัณฑ์ดูแลไมเกรนพร้อมรูปภาพ ราคา และรีวิวจากผู้ใช้จริง รองรับการเลื่อนดูแบบ infinite scroll', category: 'Marketplace', subcategory: 'Migra Shop' }
  const MKT002: Feature = { id: 'MKT002', title: 'ค้นหาและกรองสินค้า', description: 'ค้นหาสินค้าด้วยชื่อหรือหมวดหมู่ กรองตามราคา คะแนน และสินค้าที่ใช้โค้ดส่วนลดได้', category: 'Marketplace', subcategory: 'Migra Shop' }
  const MKT003: Feature = { id: 'MKT003', title: 'ตะกร้าสินค้าและ Checkout', description: 'เพิ่มสินค้าลงตะกร้า ระบุจำนวน เลือกที่อยู่จัดส่ง ชำระผ่าน credit card หรือ promptpay ยืนยัน order ทาง push notification', category: 'Marketplace', subcategory: 'Migra Shop' }

  // Marketplace — My Purchase (Sprint เพิ่มใหม่)
  const MKT004: Feature = { id: 'MKT004', title: 'ดูประวัติการสั่งซื้อ', description: 'แสดงรายการ order ทั้งหมด พร้อมสถานะ (รอยืนยัน / จัดส่งแล้ว / ได้รับแล้ว) วันที่ และยอดรวม', category: 'Marketplace', subcategory: 'My Purchase' }
  const MKT005: Feature = { id: 'MKT005', title: 'ติดตามสถานะการจัดส่ง', description: 'แสดง tracking number พร้อมลิงก์ไปยังหน้าติดตามของ partner courier อัปเดตสถานะแบบ real-time', category: 'Marketplace', subcategory: 'My Purchase' }

  // ── KnowledgeDoc v1 baseline (30 วันที่แล้ว) ──
  // Auth + Report เท่านั้น — ยังไม่มี Migraine Tracking
  const featuresV1: Feature[] = [AUTH001_v1, AUTH002, AUTH003, AUTH004, RPT001, RPT002]

  const dmJob1 = await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'a1b2c3d4e5f6a1b2c3d4e5f6',
      commitMsg: 'feat: initial release — email auth, google login, appointment history',
      author: 'thanakit.p',
      status: 'DONE',
      triggeredAt: daysAgo(30),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: dmJob1.id,
      projectId: doctorMobile.id,
      featuresNew: featuresV1,
      diff: { added: featuresV1, removed: [], modified: [] } as DiffResult,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(29),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: doctorMobile.id,
      version: 1,
      features: featuresV1,
      approvedBy: 'thanakit.p',
      sourceJobId: dmJob1.id,
      createdAt: daysAgo(29),
    },
  })

  // ── KnowledgeDoc v2 (14 วันที่แล้ว) ──
  // เพิ่ม Migraine Tracking + PDF export
  const featuresV2: Feature[] = [AUTH001_v1, AUTH002, AUTH003, AUTH004, RPT001, RPT002, RPT003, MIG001, MIG002, MIG003]

  const dmJob2 = await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'b2c3d4e5f6a7b2c3d4e5f6a7',
      commitMsg: 'feat: add migraine tracking module and PDF health report export',
      author: 'thanakit.p',
      status: 'DONE',
      triggeredAt: daysAgo(14),
    },
  })

  const diffV2: DiffResult = {
    added: [RPT003, MIG001, MIG002, MIG003],
    removed: [],
    modified: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: dmJob2.id,
      projectId: doctorMobile.id,
      featuresNew: featuresV2,
      diff: diffV2,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(13),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: doctorMobile.id,
      version: 2,
      features: featuresV2,
      approvedBy: 'thanakit.p',
      sourceJobId: dmJob2.id,
      createdAt: daysAgo(13),
    },
  })

  // ── Sprint ปัจจุบัน: Job DONE + PENDING (2 วันที่แล้ว) ──
  // เพิ่ม Medicine Pouch, Discount codes, Marketplace
  // modify AUTH001 (เพิ่ม OTP)
  const featuresV3: Feature[] = [
    AUTH001_v2, AUTH002, AUTH003, AUTH004,
    RPT001, RPT002, RPT003,
    MIG001, MIG002, MIG003,
    MED001, MED002, MED003,
    DIS001, DIS002, DIS003,
    MKT001, MKT002, MKT003, MKT004, MKT005,
  ]

  const sprintDiff: DiffResult = {
    added: [MED001, MED002, MED003, DIS001, DIS002, DIS003, MKT001, MKT002, MKT003, MKT004, MKT005],
    removed: [],
    modified: [{ old: AUTH001_v1, new: AUTH001_v2 }],
  }

  const dmJob3 = await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'c3d4e5f6a7b8c3d4e5f6a7b8',
      commitMsg: 'feat: sprint 3 — medicine pouch, discount codes, marketplace (migra shop + my purchase)',
      author: 'thanakit.p',
      status: 'DONE',
      triggeredAt: daysAgo(2),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: dmJob3.id,
      projectId: doctorMobile.id,
      featuresNew: featuresV3,
      diff: sprintDiff,
      validation: {
        passed: false,
        missing: [],
        extra: [DIS002, DIS003, MKT005],
        mismatched: [],
      } as ValidationResult,
      status: 'PENDING',
    },
  })

  // Sprint Requirements ที่ตั้งไว้ก่อน Sprint 3
  await db.sprintRequirement.create({
    data: {
      jobId: dmJob3.id,
      projectId: doctorMobile.id,
      fileName: 'sprint3-requirements.pdf',
      createdBy: 'thanakit.p',
      items: [
        { featureId: 'AUTH001', changeType: 'modify' },
        { featureId: 'MED001', changeType: 'add' },
        { featureId: 'MED002', changeType: 'add' },
        { featureId: 'MED003', changeType: 'add' },
        { featureId: 'MKT001', changeType: 'add' },
        { featureId: 'MKT002', changeType: 'add' },
        { featureId: 'MKT003', changeType: 'add' },
        { featureId: 'MKT004', changeType: 'add' },
        { featureId: 'DIS001', changeType: 'add' },
      ],
    },
  })

  // Job RUNNING (ล่าสุด — กำลังวิเคราะห์)
  await db.analysisJob.create({
    data: {
      projectId: doctorMobile.id,
      commitSha: 'd4e5f6a7b8c9d4e5f6a7b8c9',
      commitMsg: 'fix: resolve OTP expiry edge case and improve checkout flow UX',
      author: 'thanakit.p',
      status: 'RUNNING',
      triggeredAt: new Date(now - 1000 * 60 * 18),
    },
  })

  // ──────────────────────────────────────────
  // PROJECT 2: ClinicMate
  // ──────────────────────────────────────────
  const clinicMate = await db.project.create({
    data: {
      name: 'ClinicMate',
      repoUrl: 'https://github.com/clinicmate-th/clinicmate-app',
      platform: 'GITHUB',
      webhookSecret: 'whsec-cm-001',
      createdAt: daysAgo(60),
    },
  })

  const CM_AUTH: Feature = { id: 'CM_AUTH001', title: 'เข้าสู่ระบบด้วยเลขบัตรประชาชน', description: 'ผู้ป่วยเข้าระบบด้วยเลขบัตรประชาชน 13 หลักและวันเกิด ไม่ต้องจดจำรหัสผ่าน', category: 'การเข้าสู่ระบบ', subcategory: '' }
  const CM_APPT1: Feature = { id: 'CM_APPT001', title: 'จองคิวนัดแพทย์', description: 'เลือกแพทย์ วันเวลา และประเภทการนัด (ตรวจทั่วไป/ฉุกเฉิน) ยืนยันนัดผ่าน SMS', category: 'การนัดหมาย', subcategory: '' }
  const CM_APPT2: Feature = { id: 'CM_APPT002', title: 'เลื่อนและยกเลิกนัด', description: 'เลื่อนนัดหมายล่วงหน้าอย่างน้อย 2 ชั่วโมง หรือยกเลิกพร้อมแจ้งเหตุผล', category: 'การนัดหมาย', subcategory: '' }
  const CM_REC1: Feature = { id: 'CM_REC001', title: 'ดูประวัติการรักษา', description: 'ผู้ป่วยดูประวัติการรักษา ผลแล็บ และใบสั่งยาจากการเยี่ยมครั้งก่อน', category: 'เวชระเบียน', subcategory: '' }
  const CM_REC2: Feature = { id: 'CM_REC002', title: 'แบ่งปันข้อมูลสุขภาพ', description: 'สร้าง QR code ชั่วคราวเพื่อแบ่งปันประวัติการรักษากับแพทย์คนอื่น อายุ 24 ชั่วโมง', category: 'เวชระเบียน', subcategory: '' }
  const CM_BIL1: Feature = { id: 'CM_BIL001', title: 'ดูใบเสร็จค่ารักษา', description: 'แสดงใบเสร็จรายการค่าบริการ ค่ายา และค่าหัตถการ พร้อมสถานะชำระเงิน', category: 'การเงิน', subcategory: '' }
  const CM_BIL2: Feature = { id: 'CM_BIL002', title: 'ชำระค่ารักษาออนไลน์', description: 'ชำระเงินผ่าน QR promptpay หรือ credit card รองรับ Thai QR Payment Standard', category: 'การเงิน', subcategory: '' }

  const cmFeatures: Feature[] = [CM_AUTH, CM_APPT1, CM_APPT2, CM_REC1, CM_REC2, CM_BIL1, CM_BIL2]

  const cmJob1 = await db.analysisJob.create({
    data: {
      projectId: clinicMate.id,
      commitSha: 'e1f2a3b4c5d6e1f2a3b4c5d6',
      commitMsg: 'feat: initial release — patient login, appointment booking, medical records, billing',
      author: 'nattapong.w',
      status: 'DONE',
      triggeredAt: daysAgo(45),
    },
  })

  await db.projectUpdateDoc.create({
    data: {
      jobId: cmJob1.id,
      projectId: clinicMate.id,
      featuresNew: cmFeatures,
      diff: { added: cmFeatures, removed: [], modified: [] } as DiffResult,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'APPROVED',
      reviewedAt: daysAgo(44),
    },
  })

  await db.knowledgeDoc.create({
    data: {
      projectId: clinicMate.id,
      version: 1,
      features: cmFeatures,
      approvedBy: 'nattapong.w',
      sourceJobId: cmJob1.id,
      createdAt: daysAgo(44),
    },
  })

  // Sprint ปัจจุบัน ClinicMate — เพิ่ม telemedicine
  const CM_TELE1: Feature = { id: 'CM_TELE001', title: 'ปรึกษาแพทย์ผ่านวิดีโอคอล', description: 'เริ่ม video call กับแพทย์ผ่าน WebRTC รองรับ iOS และ Android ไม่ต้องติดตั้งแอปเพิ่ม', category: 'Telemedicine', subcategory: '' }
  const CM_TELE2: Feature = { id: 'CM_TELE002', title: 'แชทกับแพทย์และพยาบาล', description: 'ส่งข้อความ รูปภาพ และไฟล์เอกสารกับทีมแพทย์ รับใบสั่งยาผ่านแชท', category: 'Telemedicine', subcategory: '' }

  const cmJob2 = await db.analysisJob.create({
    data: {
      projectId: clinicMate.id,
      commitSha: 'f2a3b4c5d6e7f2a3b4c5d6e7',
      commitMsg: 'feat: add telemedicine — video consultation and doctor chat',
      author: 'nattapong.w',
      status: 'DONE',
      triggeredAt: daysAgo(7),
    },
  })

  const cmFeaturesV2: Feature[] = [...cmFeatures, CM_TELE1, CM_TELE2]

  const cmSprintDiff: DiffResult = {
    added: [CM_TELE1, CM_TELE2],
    removed: [],
    modified: [],
  }

  await db.projectUpdateDoc.create({
    data: {
      jobId: cmJob2.id,
      projectId: clinicMate.id,
      featuresNew: cmFeaturesV2,
      diff: cmSprintDiff,
      validation: { passed: true, missing: [], extra: [], mismatched: [] } as ValidationResult,
      status: 'PENDING',
    },
  })

  await db.sprintRequirement.create({
    data: {
      jobId: cmJob2.id,
      projectId: clinicMate.id,
      fileName: 'clinicmate-sprint2-req.pdf',
      createdBy: 'nattapong.w',
      items: [
        { featureId: 'CM_TELE001', changeType: 'add' },
        { featureId: 'CM_TELE002', changeType: 'add' },
      ],
    },
  })

  return NextResponse.json({
    ok: true,
    projects: [doctorMobile.name, clinicMate.name],
    doctorMobile: {
      knowledgeDocs: 2,
      jobs: 4,
      sprintDiff: {
        added: 11,
        modified: 1,
        requirements: '9 planned → 9/9 done',
      },
    },
    clinicMate: {
      knowledgeDocs: 1,
      jobs: 2,
    },
  })
}
