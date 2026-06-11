import type { Feature, FeatureChange } from './types'

export interface SprintReqMockItem {
  id: string
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add' | 'modify' | 'remove'
  category?: string
  subcategory?: string
}

export interface ProjectMock {
  commits: { sha: string; msg: string; author: string }[]
  added: Feature[]
  modified: FeatureChange[]
  removed: Feature[]
  requirements: SprintReqMockItem[]
}

// ─── Doctor Mobile ─────────────────────────────────────────────────────────────

const DM_ADDED: Feature[] = [
  { id: 'AUTH005', title: 'เข้าสู่ระบบด้วย Apple ID',           description: 'รองรับ Sign in with Apple บน iOS 13 ขึ้นไป ผูกบัญชีกับ Firebase Auth',                                                     category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Apple ID' },
  { id: 'AUTH006', title: 'เข้าสู่ระบบด้วย LINE',                description: 'LINE Login v2.1 + LIFF เชื่อมข้อมูลโปรไฟล์ ใช้งานทั้ง iOS และ Android',                                                        category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย LINE' },
  { id: 'MIG004',  title: 'บันทึกอาการด้วยเสียง',                 description: 'อัดเสียงระบุอาการ ระบบถอดข้อความและสกัด trigger อัตโนมัติด้วย Whisper API',                                                        category: 'Migraine Tracking',           subcategory: '' },
  { id: 'MED004',  title: 'แจ้งเตือนยาที่ตีกัน',                  description: 'ตรวจจับยาที่อาจเกิด drug interaction ส่งแจ้งเตือนก่อนยืนยันการเพิ่มยาใหม่',                                                    category: 'Medicine Pouch',              subcategory: '' },
  { id: 'RPT004',  title: 'Export รายงานเป็น Excel',              description: 'ส่งออกรายงานสุขภาพประจำเดือนเป็นไฟล์ .xlsx แยก sheet ตามประเภทข้อมูล',                                                          category: 'Report',                      subcategory: '' },
  { id: 'MKT006',  title: 'Wishlist รายการสินค้าที่สนใจ',         description: 'บันทึกสินค้าที่สนใจ แชร์เป็นลิงก์ให้คนอื่นดูได้ แจ้งเตือนเมื่อราคาลด',                                                          category: 'Marketplace',                 subcategory: 'Migra Shop' },
  { id: 'AUTH007', title: 'เข้าสู่ระบบด้วย Azure AD (Enterprise)', description: 'รองรับ SSO ผ่าน Azure Active Directory สำหรับองค์กร',                                                                          category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'Enterprise SSO' },
  { id: 'MIG005',  title: 'แชร์รายงานอาการกับครอบครัว',           description: 'ผู้ดูแลผู้ป่วยดูแนวโน้มอาการแบบ read-only ผ่านลิงก์ที่แชร์',                                                                    category: 'Migraine Tracking',           subcategory: '' },
  { id: 'MED005',  title: 'Snooze แจ้งเตือนกินยา 5/10/15 นาที', description: 'ผู้ใช้เลื่อนแจ้งเตือนได้ตามเวลาที่กำหนด กรณีกำลังขับรถหรือยุ่ง',                                                                 category: 'Medicine Pouch',              subcategory: '' },
]

const DM_REQUIREMENTS: SprintReqMockItem[] = [
  { id: 'SR_DM001', featureId: 'AUTH005', title: 'เพิ่ม Sign in with Apple',                    description: 'ลูกค้าขอให้รองรับ Apple ID เป็น 1 ใน social login หลัก',                          priority: 'high',   changeType: 'add', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Apple ID' },
  { id: 'SR_DM002', featureId: 'AUTH006', title: 'เพิ่ม LINE Login',                             description: 'ตลาดไทยใช้ LINE เยอะ ขอให้รองรับเป็น primary login',                              priority: 'high',   changeType: 'add', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย LINE' },
  { id: 'SR_DM004', featureId: 'MIG004',  title: 'บันทึกอาการด้วยเสียง',                         description: 'ผู้ป่วยขณะปวดไมเกรนกรอกข้อมูลยาก ขอให้พูดบันทึกอาการแทน',                           priority: 'high',   changeType: 'add', category: 'Migraine Tracking',           subcategory: '' },
  { id: 'SR_DM005', featureId: 'MED004',  title: 'แจ้งเตือนยาที่ตีกัน',                           description: 'หมอแนะนำว่าผู้ป่วยไมเกรนกินยาหลายชนิด อาจมี drug interaction ต้องเตือน',           priority: 'high',   changeType: 'add', category: 'Medicine Pouch',              subcategory: '' },
  { id: 'SR_DM009', featureId: 'RPT004',  title: 'Export รายงานสุขภาพเป็น Excel',                description: 'ผู้ใช้ขอ Export รายงานเป็น .xlsx เพื่อนำไปใช้ต่อ',                                   priority: 'medium', changeType: 'add', category: 'Report',                      subcategory: '' },
  { id: 'SR_DM008', featureId: 'MKT006',  title: 'เพิ่ม Wishlist แชร์ลิงก์ได้',                  description: 'ผู้ใช้ต้องการบันทึกสินค้าและแชร์ให้คนอื่นได้',                                        priority: 'medium', changeType: 'add', category: 'Marketplace',                 subcategory: 'Migra Shop' },
  { id: 'SR_DM010', featureId: 'AUTH007', title: 'เพิ่ม Azure AD สำหรับองค์กร',                  description: 'ขายให้ลูกค้า enterprise ขอ SSO ผ่าน Azure AD',                                      priority: 'medium', changeType: 'add', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'Enterprise SSO' },
  { id: 'SR_DM011', featureId: 'MIG005',  title: 'แชร์รายงานอาการกับคนในครอบครัว',               description: 'ผู้ดูแลผู้ป่วยอยากเห็นแนวโน้มอาการแบบ read-only',                                    priority: 'medium', changeType: 'add', category: 'Migraine Tracking',           subcategory: '' },
  { id: 'SR_DM012', featureId: 'MED005',  title: 'Snooze แจ้งเตือนกินยา 5/10/15 นาที',           description: 'ผู้ใช้ขอเลื่อนเตือนได้เพราะอาจจะกำลังขับรถ',                                          priority: 'low',    changeType: 'add', category: 'Medicine Pouch',              subcategory: '' },
  // pending
  { id: 'SR_DM013', featureId: 'MIG006',  title: 'ดู Heat Map ความถี่ปวดหัวรายเดือน',             description: 'ผู้ป่วยขอดูภาพรวมว่าช่วงไหนของเดือนปวดบ่อยที่สุด แสดงเป็น calendar heat map',       priority: 'high',   changeType: 'add', category: 'Migraine Tracking',           subcategory: '' },
  { id: 'SR_DM014', featureId: 'RPT005',  title: 'รายงานสรุปรายไตรมาส',                           description: 'แพทย์ขอรายงานสรุปอาการและยาต่อ 3 เดือน ส่งผ่าน email อัตโนมัติ',                      priority: 'medium', changeType: 'add', category: 'Report',                      subcategory: '' },
  { id: 'SR_DM015', featureId: 'MED006',  title: 'สแกนฉลากยาด้วยกล้อง',                          description: 'พิมพ์ข้อมูลยาใหม่โดยสแกนบาร์โค้ดหรือ QR code บนกล่องยาแทนการพิมพ์มือ',            priority: 'medium', changeType: 'add', category: 'Medicine Pouch',              subcategory: '' },
]

const DOCTOR_MOBILE: ProjectMock = {
  commits: [
    { sha: 'a4f8c1b', msg: 'feat: Social login (Apple, LINE) + Enterprise SSO', author: 'dev-somchai' },
    { sha: 'b3d2e5a', msg: 'feat: Voice symptom recording + drug interaction warning', author: 'dev-malee' },
    { sha: 'c7e9f2d', msg: 'feat: Excel export + Wishlist + family sharing', author: 'dev-nattapol' },
  ],
  added: DM_ADDED,
  modified: [],
  removed: [],
  requirements: DM_REQUIREMENTS,
}

// ─── ClinicMate ───────────────────────────────────────────────────────────────

const CM_ADDED: Feature[] = [
  { id: 'CM_AUTH002', title: 'เข้าสู่ระบบด้วย Face ID / Touch ID',     description: 'รองรับ biometric login บน iOS และ Android ลด friction การล็อกอินซ้ำ',                                    category: 'การเข้าสู่ระบบ',  subcategory: '' },
  { id: 'CM_APPT003', title: 'แจ้งเตือนนัดล่วงหน้า 24 ชั่วโมง',       description: 'ส่ง push notification และ SMS เตือนผู้ป่วยก่อนถึงเวลานัด รองรับการยืนยันหรือเลื่อนนัด',               category: 'การนัดหมาย',     subcategory: '' },
  { id: 'CM_REC003',  title: 'ดาวน์โหลดผลแล็บเป็น PDF',                description: 'ผู้ป่วยดาวน์โหลดผลแล็บเป็น PDF พร้อมตราประทับคลินิก สำหรับนำไปใช้ที่อื่น',                            category: 'เวชระเบียน',     subcategory: '' },
  { id: 'CM_TELE003', title: 'ปรึกษาแบบกลุ่ม (Group consultation)',    description: 'รองรับ video call หลายฝ่ายระหว่างผู้ป่วย ครอบครัว และทีมแพทย์พร้อมกัน',                              category: 'Telemedicine',   subcategory: '' },
  { id: 'CM_APPT004', title: 'จองคิวออนไลน์แบบ Walk-in',               description: 'ผู้ป่วยที่เดินทางมาแล้วอยากเช็คคิวจากในแอปขณะรอ',                                                        category: 'การนัดหมาย',     subcategory: '' },
  { id: 'CM_REC004',  title: 'บันทึกประวัติแพ้ยา/อาหาร',               description: 'ผู้ป่วยกรอกแพ้ยา/อาหารเอง แสดงเป็น banner สำหรับแพทย์',                                                  category: 'เวชระเบียน',     subcategory: '' },
  { id: 'CM_BIL003',  title: 'ผ่อนชำระค่ารักษา 0% 3 เดือน',            description: 'ลูกค้ารายใหญ่ขอผ่อนผ่านบัตรเครดิต โดยคลินิกไม่รับ fee',                                                  category: 'การเงิน',         subcategory: '' },
]

const CM_REQUIREMENTS: SprintReqMockItem[] = [
  { id: 'SR_CM001', featureId: 'CM_AUTH002', title: 'เข้าสู่ระบบด้วย Face ID/Touch ID',      description: 'ผู้สูงอายุไม่อยากกรอกเลขบัตร 13 หลักทุกครั้ง ขอ biometric',                          priority: 'high',   changeType: 'add', category: 'การเข้าสู่ระบบ',  subcategory: '' },
  { id: 'SR_CM002', featureId: 'CM_APPT003', title: 'แจ้งเตือนก่อนถึงนัด 1 วัน',            description: 'ลด no-show rate ของคลินิก ขอแจ้งเตือนล่วงหน้า 24 ชม.',                                  priority: 'high',   changeType: 'add', category: 'การนัดหมาย',     subcategory: '' },
  { id: 'SR_CM003', featureId: 'CM_REC003',  title: 'ดาวน์โหลดผลแล็บเป็น PDF',              description: 'ผู้ป่วยต้องนำผลแล็บไปยื่นที่โรงพยาบาลอื่นหรือบริษัทประกัน',                         priority: 'medium', changeType: 'add', category: 'เวชระเบียน',     subcategory: '' },
  { id: 'SR_CM006', featureId: 'CM_TELE003', title: 'เพิ่ม Group consultation',              description: 'ผู้ป่วย ครอบครัว และแพทย์ต้องการ video call พร้อมกัน',                                priority: 'medium', changeType: 'add', category: 'Telemedicine',   subcategory: '' },
  { id: 'SR_CM007', featureId: 'CM_APPT004', title: 'จองคิวออนไลน์แบบ Walk-in',             description: 'ผู้ป่วยที่เดินทางมาแล้วอยากเช็คคิวจากในแอปขณะรอ',                                    priority: 'medium', changeType: 'add', category: 'การนัดหมาย',     subcategory: '' },
  { id: 'SR_CM008', featureId: 'CM_REC004',  title: 'บันทึกประวัติแพ้ยา/อาหาร',             description: 'ผู้ป่วยกรอกแพ้ยา/อาหารเอง แสดงเป็น banner สำหรับแพทย์',                              priority: 'high',   changeType: 'add', category: 'เวชระเบียน',     subcategory: '' },
  { id: 'SR_CM009', featureId: 'CM_BIL003',  title: 'ผ่อนชำระค่ารักษา 0% 3 เดือน',          description: 'ลูกค้ารายใหญ่ขอผ่อนผ่านบัตรเครดิต โดยคลินิกไม่รับ fee',                              priority: 'medium', changeType: 'add', category: 'การเงิน',         subcategory: '' },
  // pending
  { id: 'SR_CM010', featureId: 'CM_TELE004', title: 'บันทึกและ Replay การปรึกษา Telemedicine', description: 'แพทย์และผู้ป่วยขอดูการปรึกษาย้อนหลังได้ เก็บเป็น encrypted video',                   priority: 'high',   changeType: 'add', category: 'Telemedicine',   subcategory: '' },
  { id: 'SR_CM011', featureId: 'CM_RPT001',  title: 'Dashboard ภาพรวม no-show rate',         description: 'ผู้จัดการคลินิกขอดูอัตราผู้ป่วย no-show รายเดือนและรายแพทย์',                         priority: 'medium', changeType: 'add', category: 'การนัดหมาย',     subcategory: '' },
]

const CLINICMATE: ProjectMock = {
  commits: [
    { sha: 'f1d8a3c', msg: 'feat: Biometric login + Appointment reminders', author: 'nattapong.w' },
    { sha: 'g2e9b4d', msg: 'feat: Lab PDF export + Group consultation', author: 'somsri.p' },
    { sha: 'h3f0c5e', msg: 'feat: Allergy records + installment payment', author: 'wichai.k' },
  ],
  added: CM_ADDED,
  modified: [],
  removed: [],
  requirements: CM_REQUIREMENTS,
}

// ─── FactoryPro ───────────────────────────────────────────────────────────────

const FP_ADDED: Feature[] = [
  { id: 'FP_QC001',  title: 'ตรวจรับวัตถุดิบพร้อมบันทึกผล QC',          description: 'สแกน barcode วัตถุดิบที่รับเข้า บันทึกผลตรวจคุณภาพและรูปถ่ายพร้อมออกใบ GRN อัตโนมัติ',                      category: 'ตรวจสอบคุณภาพวัตถุดิบและสินค้า',      subcategory: 'การรับวัตถุดิบ' },
  { id: 'FP_MAT001', title: 'บริหารสูตรการผลิต (Bill of Materials)',      description: 'กำหนด BOM หลายระดับ ระบุส่วนประกอบและปริมาณต่อหน่วย รองรับ revision control',                              category: 'บริหารข้อมูลหลักสินค้าและสูตรการผลิต', subcategory: '' },
  { id: 'FP_INV003', title: 'Export รายงานสินค้าคงคลังเป็นไฟล์ Excel',  description: 'Export ผลการค้นหาจาก Advance Search เป็นไฟล์ .xlsx แยก sheet ตาม warehouse พร้อม summary row',            category: 'จัดการคลังวัตถุดิบและสินค้า',           subcategory: 'ค้นหาสินค้า' },
  { id: 'FP_WH002',  title: 'เบิกวัตถุดิบผ่านมือถือด้วยการสแกน Barcode', description: 'พนักงานสแกน barcode เพื่อเบิกวัตถุดิบ รองรับสแกนต่อเนื่องหลายรายการ',                                    category: 'เบิกสินค้าและวัตถุดิบออกจากคลัง',      subcategory: '' },
  { id: 'FP_PROD002',title: 'ดู timeline Production Order แบบ Gantt',   description: 'ผู้จัดการดู timeline Production Order แต่ละไลน์แบบ Gantt ได้แบบ real-time',                                category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',   subcategory: 'แผนการผลิต' },
  { id: 'FP_PUR002', title: 'บันทึกวันส่งมอบที่ยืนยันจากผู้จำหน่าย',   description: 'ผู้ใช้บันทึกวันส่งมอบจริงที่ยืนยันจาก vendor เพื่อใช้ติดตาม PO',                                          category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย', subcategory: 'ติดตาม PO' },
  { id: 'FP_PUR003', title: 'แจ้งเตือนอัตโนมัติเมื่อ due date ใกล้ถึง', description: 'ระบบแจ้งเตือนอัตโนมัติเมื่อ due date ใกล้ถึงแต่ยังไม่รับของ',                                              category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย', subcategory: 'ติดตาม PO' },
]

const FP_REQUIREMENTS: SprintReqMockItem[] = [
  { id: 'SR_FP001', featureId: 'FP_QC001',   title: 'พนักงานบันทึกผล QC และออก GRN ได้ในขั้นตอนเดียว',    description: 'ลดขั้นตอนการรับวัตถุดิบ ต้องทำได้ในหน้าเดียว',              priority: 'high',   changeType: 'add', category: 'ตรวจสอบคุณภาพวัตถุดิบและสินค้า',      subcategory: 'การรับวัตถุดิบ' },
  { id: 'SR_FP012', featureId: 'FP_MAT001',  title: 'บริหารสูตรการผลิต (BOM) หลายระดับ',                  description: 'ต้องการระบุส่วนประกอบและปริมาณต่อหน่วย พร้อม revision',      priority: 'medium', changeType: 'add', category: 'บริหารข้อมูลหลักสินค้าและสูตรการผลิต', subcategory: '' },
  { id: 'SR_FP010', featureId: 'FP_INV003',  title: 'Export ผลการค้นหาสินค้าเป็นไฟล์ Excel',              description: 'ผู้ใช้ต้องการ Export รายงานเป็น .xlsx',                      priority: 'medium', changeType: 'add', category: 'จัดการคลังวัตถุดิบและสินค้า',           subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_FP005', featureId: 'FP_WH002',   title: 'พนักงานสแกน barcode เพื่อเบิกวัตถุดิบผ่านมือถือ',    description: 'ลดความผิดพลาดจากการพิมพ์รหัสด้วยตนเอง',                    priority: 'high',   changeType: 'add', category: 'เบิกสินค้าและวัตถุดิบออกจากคลัง',      subcategory: '' },
  { id: 'SR_FP006', featureId: 'FP_PROD002', title: 'ผู้จัดการดู timeline Production Order แบบ Gantt',    description: 'ต้องการภาพรวม production plan แบบ Gantt chart',              priority: 'medium', changeType: 'add', category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',   subcategory: 'แผนการผลิต' },
  { id: 'SR_FP007', featureId: 'FP_PUR002',  title: 'บันทึกวันส่งมอบที่ยืนยันจากผู้จำหน่าย',              description: 'ผู้ใช้บันทึกวันจริงที่ vendor ยืนยัน',                       priority: 'medium', changeType: 'add', category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย', subcategory: 'ติดตาม PO' },
  { id: 'SR_FP008', featureId: 'FP_PUR003',  title: 'แจ้งเตือนอัตโนมัติเมื่อ due date ใกล้ถึงแต่ยังไม่รับของ', description: 'ลด case สินค้าไม่มาตรงเวลาโดยไม่มีการแจ้ง',             priority: 'medium', changeType: 'add', category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย', subcategory: 'ติดตาม PO' },
  // pending
  { id: 'SR_FP009', featureId: 'FP_QC002',   title: 'แสดงแนวโน้มของเสียรายสัปดาห์',                        description: 'ผู้จัดการ QC ขอดู trend ของเสียย้อนหลัง 4 สัปดาห์ เพื่อวิเคราะห์สาเหตุ',        priority: 'high',   changeType: 'add', category: 'ตรวจสอบคุณภาพวัตถุดิบและสินค้า',      subcategory: '' },
  { id: 'SR_FP011', featureId: 'FP_RPT001',  title: 'รายงาน OEE (Overall Equipment Effectiveness)',       description: 'วัดประสิทธิภาพเครื่องจักรรายไลน์ แสดงเป็น % Availability × Performance × Quality', priority: 'high',   changeType: 'add', category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',   subcategory: 'แผนการผลิต' },
]

const FACTORYPRO: ProjectMock = {
  commits: [
    { sha: 'a1b2c3d', msg: 'feat: QC goods receipt + BOM management', author: 'krit.w' },
    { sha: 'e4f5g6h', msg: 'feat: Barcode issue + Excel export', author: 'nida.s' },
    { sha: 'i7j8k9l', msg: 'feat: Gantt timeline + PO due date tracking', author: 'prasert.t' },
  ],
  added: FP_ADDED,
  modified: [],
  removed: [],
  requirements: FP_REQUIREMENTS,
}

// ─── WMS Pro ──────────────────────────────────────────────────────────────────

const WP_ADDED: Feature[] = [
  // การเข้าสู่ระบบและลงทะเบียน
  { id: 'WP_AUTH001', title: 'เข้าสู่ระบบด้วย Username/Password',               description: 'ระบบ login มาตรฐาน รองรับ remember me และ force logout session เก่า',                                      category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบ' },
  { id: 'WP_AUTH003', title: 'ต่ออายุ Session อัตโนมัติเมื่อใกล้หมดอายุ',       description: 'ระบบ refresh token อัตโนมัติก่อนหมดอายุ 5 นาที โดยไม่ต้องให้ผู้ใช้ login ใหม่',                            category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'จัดการ Session' },
  { id: 'WP_AUTH006', title: 'สมัครสมาชิกด้วยเบอร์โทรและกำหนดชื่อ',             description: 'ผู้ใช้ใหม่สมัครด้วยเบอร์โทร ยืนยัน OTP และกำหนดชื่อแสดง',                                                  category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'ลงทะเบียนผู้ใช้ใหม่' },
  // จัดการสินค้าในคลัง
  { id: 'WP_STK001',  title: 'ดูรายการสินค้าคงคลังทั้งหมดแบบ real-time',         description: 'แสดงรายการสินค้าพร้อมยอดคงเหลือแยกตาม warehouse แบบ real-time',                                           category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  { id: 'WP_STK002',  title: 'ค้นหาสินค้าแบบ Advance Search',                    description: 'กรองสินค้าได้หลายเงื่อนไขพร้อมกัน: รหัส ชื่อ หมวดหมู่ warehouse lot no. ช่วงวันหมดอายุ และสถานะ',         category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'WP_STK003',  title: 'Export รายงานสินค้าคงคลังเป็นไฟล์ Excel',          description: 'Export ผลค้นหาจาก Advance Search เป็น .xlsx แยก sheet ตาม warehouse พร้อม summary row',                    category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'WP_STK004',  title: 'บันทึก Filter ที่ใช้บ่อยเพื่อเรียกใช้ภายหลัง',     description: 'ผู้ใช้บันทึก filter preset และเรียกใช้ได้ทันทีโดยไม่ต้องตั้งค่าใหม่',                                     category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'WP_STK005',  title: 'ดูรายละเอียดสินค้าและประวัติการเคลื่อนไหว',         description: 'หน้ารายละเอียดสินค้าแสดง stock movement ย้อนหลัง 6 เดือน พร้อมกราฟ',                                      category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  // รับและส่งสินค้า
  { id: 'WP_RCV001',  title: 'สร้างใบรับสินค้า (GRN) จาก PO',                    description: 'เลือก PO ที่ยังค้างรับ ระบุจำนวนรับจริง แนบรูปถ่ายเอกสาร และพิมพ์ใบ GRN',                                category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'WP_RCV002',  title: 'สแกน Barcode รับสินค้าเข้าคลัง',                   description: 'สแกนบาร์โค้ดสินค้าขณะรับของ ระบบอัปเดต stock อัตโนมัติและบันทึก lot no. / วันหมดอายุ',                    category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'WP_RCV003',  title: 'แจ้งเตือน Buyer เมื่อรับสินค้าครบตาม PO',          description: 'ระบบส่ง notification ให้ Buyer อัตโนมัติเมื่อรับสินค้าครบ',                                                 category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'WP_SHP001',  title: 'สร้างใบส่งสินค้า (DO) จาก Sales Order',            description: 'เลือก SO ที่ต้องจัดส่ง ระบุจำนวน เลือก carrier และพิมพ์ใบ DO พร้อม packing list',                           category: 'รับและส่งสินค้า',             subcategory: 'ส่งสินค้าออกจากคลัง' },
  { id: 'WP_SHP002',  title: 'ติดตามสถานะการจัดส่งแบบ real-time',                description: 'แสดงสถานะ shipment จาก carrier API (Kerry, Flash, J&T) บนหน้า DO',                                         category: 'รับและส่งสินค้า',             subcategory: 'ส่งสินค้าออกจากคลัง' },
  // เบิก-จ่ายสินค้า
  { id: 'WP_ISS001',  title: 'สร้างใบเบิกสินค้าจากแผนกต่างๆ',                    description: 'แผนกสามารถยื่นคำขอเบิกสินค้าออนไลน์ พร้อมระบุจุดประสงค์และได้รับอนุมัติก่อนเบิก',                      category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'WP_ISS002',  title: 'แจ้งเตือนเมื่อสินค้าที่เบิกใกล้หมดสต็อก',          description: 'ระบบแสดง warning เมื่อยอดคงเหลือหลังเบิกต่ำกว่า minimum stock ที่กำหนด',                                 category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'WP_ISS003',  title: 'อนุมัติใบเบิกแบบ Multi-level Approval',             description: 'ผู้จัดการแผนกอนุมัติขั้นแรก หัวหน้าคลังอนุมัติขั้นสอง รองรับ delegate เมื่อลา',                           category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'WP_ISS004',  title: 'ดูประวัติการเบิกสินค้าย้อนหลัง 90 วัน',            description: 'ผู้ใช้ดูประวัติการเบิกทั้งหมดพร้อมกรองตามช่วงวันที่',                                                       category: 'เบิก-จ่ายสินค้า',             subcategory: 'ประวัติการเบิก' },
  // ตรวจนับสินค้า
  { id: 'WP_CNT001',  title: 'สร้างรอบตรวจนับสินค้าแบบ Cycle Count',             description: 'กำหนดรอบ cycle count รายวัน/รายสัปดาห์ สุ่มเลือกสินค้า แจกจ่าย task ผ่านมือถือ',                         category: 'ตรวจนับสินค้า',               subcategory: 'Cycle Count' },
  { id: 'WP_CNT002',  title: 'บันทึกผลนับสินค้าผ่านมือถือ',                      description: 'พนักงานสแกน barcode และกรอกยอดนับจริงผ่านแอปมือถือได้เลย',                                                  category: 'ตรวจนับสินค้า',               subcategory: 'Cycle Count' },
  { id: 'WP_CNT003',  title: 'สรุปผลต่างการนับสต็อก (Variance Report)',           description: 'เปรียบเทียบยอดในระบบ vs ยอดนับจริง แสดงรายการที่มีผลต่าง พร้อมช่อง comment เหตุผล',                      category: 'ตรวจนับสินค้า',               subcategory: 'Variance' },
  { id: 'WP_CNT004',  title: 'อนุมัติและปรับยอด Stock จากผลการนับ',               description: 'หัวหน้าคลังอนุมัติการปรับ stock adjustment หลังตรวจสอบ variance แล้ว',                                      category: 'ตรวจนับสินค้า',               subcategory: 'Variance' },
  // รายงานและสถิติ
  { id: 'WP_RPT001',  title: 'ดูรายงานสรุปยอดรับ-จ่ายสินค้าประจำวัน',           description: 'Dashboard แสดงยอดรับเข้า จ่ายออก และยอดคงเหลือสิ้นวัน แยกตาม warehouse',                                  category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำวัน' },
  { id: 'WP_RPT003',  title: 'กราฟแนวโน้ม Stock Level รายเดือน',                  description: 'Line chart แสดงแนวโน้ม stock เฉลี่ยรายเดือนแยกตาม product category',                                        category: 'รายงานและสถิติ',               subcategory: 'Dashboard' },
  // จัดการผู้ใช้งาน
  { id: 'WP_USR001',  title: 'สร้างและจัดการ Role พร้อมกำหนดสิทธิ์',             description: 'Admin กำหนด role (Warehouse Staff / Supervisor / Manager) และ permission แต่ละ module',                   category: 'จัดการผู้ใช้งาน',             subcategory: 'บทบาทและสิทธิ์' },
  { id: 'WP_USR002',  title: 'ดูประวัติการใช้งานของผู้ใช้แต่ละคน',               description: 'Admin ดู activity log ของผู้ใช้แต่ละคนย้อนหลังได้',                                                           category: 'จัดการผู้ใช้งาน',             subcategory: 'ประวัติการใช้งาน' },
  { id: 'WP_USR003',  title: 'กำหนด Warehouse ที่แต่ละคนเข้าถึงได้',             description: 'จำกัดการเข้าถึงข้อมูลแยกตาม warehouse เพื่อความปลอดภัย',                                                    category: 'จัดการผู้ใช้งาน',             subcategory: 'บทบาทและสิทธิ์' },
  // ไม่ตรง requirement — added แต่ req บอก modify (dev ทำผิด spec)
  { id: 'WP_STK006',  title: 'หน้าแดชบอร์ดสินค้าคงคลัง (หน้าใหม่)',               description: 'Dev สร้างหน้าแดชบอร์ดใหม่แยกต่างหาก แทนที่จะเพิ่ม widget เข้าหน้ารายการเดิม',                              category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  { id: 'WP_RCV004',  title: 'Modal แก้ไขจำนวนรับสินค้า',                          description: 'Dev สร้าง modal popup ใหม่แทน แทนที่จะ inline edit ใน table ตามที่ออกแบบไว้',                               category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'WP_ISS005',  title: 'หน้าเบิกสินค้าแบบ Wizard ใหม่',                      description: 'Dev สร้าง wizard flow ใหม่ทั้งหมด แทนที่จะปรับปรุงฟอร์มเดิมให้ง่ายขึ้น',                                    category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'WP_RPT005',  title: 'รายงาน PDF แบบ standalone',                           description: 'Dev สร้างหน้า PDF viewer ใหม่ แทนที่จะเพิ่มปุ่ม export ลงในหน้ารายงานที่มีอยู่แล้ว',                          category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำวัน' },
]

const WP_REQUIREMENTS: SprintReqMockItem[] = [
  // การเข้าสู่ระบบและลงทะเบียน
  { id: 'SR_WP001',  featureId: 'WP_AUTH001', title: 'ผู้ใช้เข้าสู่ระบบด้วย Username/Password พร้อม Remember Me ได้',     description: 'ลดการ login ซ้ำทุกวัน',                                                              priority: 'high',   changeType: 'add', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบ' },
  { id: 'SR_WP002',  featureId: 'WP_AUTH003', title: 'ผู้ใช้ไม่ถูก Logout กะทันหันเมื่อ Token หมดอายุ',                   description: 'ต้องการ auto-refresh token ไม่ให้ผู้ใช้ต้อง login ซ้ำ',                             priority: 'high',   changeType: 'add', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'จัดการ Session' },
  { id: 'SR_WP004',  featureId: 'WP_AUTH006', title: 'ผู้ใช้ใหม่สมัครสมาชิกด้วยเบอร์โทรและกำหนดชื่อได้',                 description: 'รองรับการ onboard ผู้ใช้ใหม่ผ่านเบอร์โทร',                                           priority: 'medium', changeType: 'add', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'ลงทะเบียนผู้ใช้ใหม่' },
  // จัดการสินค้าในคลัง
  { id: 'SR_WP005',  featureId: 'WP_STK001',  title: 'ผู้ใช้ดูรายการสินค้าคงคลังทั้งหมดแบบ real-time แยก warehouse ได้',  description: 'ต้องการเห็นยอดคงเหลือแยก warehouse ทันที',                                           priority: 'high',   changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  { id: 'SR_WP005B', featureId: 'WP_STK002',  title: 'ผู้ใช้ค้นหาสินค้าด้วย Advance Search หลายเงื่อนไขพร้อมกันได้',     description: 'ต้องการกรองสินค้าตามรหัส ชื่อ warehouse สถานะ และ lot พร้อมกัน',                    priority: 'high',   changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP006',  featureId: 'WP_STK003',  title: 'ผู้ใช้ Export ผลการค้นหาสินค้าเป็นไฟล์ Excel ได้',                  description: 'ต้องการ Export รายงานสินค้าเพื่อนำไปวิเคราะห์ต่อ',                                   priority: 'medium', changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP007',  featureId: 'WP_STK004',  title: 'ผู้ใช้บันทึก Filter ที่ใช้บ่อยเพื่อเรียกใช้ภายหลังได้',            description: 'ลดเวลาตั้ง filter ซ้ำทุกครั้ง',                                                       priority: 'low',    changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP007B', featureId: 'WP_STK005',  title: 'ผู้ใช้ดูประวัติการเคลื่อนไหวสินค้าย้อนหลัง 6 เดือนพร้อมกราฟได้',  description: 'ต้องการเห็น trend stock เพื่อวางแผนสั่งซื้อ',                                         priority: 'medium', changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  // รับและส่งสินค้า
  { id: 'SR_WP008',  featureId: 'WP_RCV001',  title: 'พนักงานสร้างใบรับสินค้า (GRN) จาก PO ได้',                          description: 'ลดการกรอกข้อมูลซ้ำ ดึงจาก PO ได้เลย',                                               priority: 'high',   changeType: 'add', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP009',  featureId: 'WP_RCV002',  title: 'พนักงานสแกน Barcode รับสินค้าพร้อมบันทึก Lot No. ได้',              description: 'ลด error จากการพิมพ์มือ',                                                             priority: 'high',   changeType: 'add', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP011',  featureId: 'WP_RCV003',  title: 'ระบบแจ้งเตือน Buyer อัตโนมัติเมื่อรับสินค้าครบตาม PO',             description: 'Buyer ต้องรู้ทันทีเมื่อสินค้าถึงครบ',                                                 priority: 'low',    changeType: 'add', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP011B', featureId: 'WP_SHP001',  title: 'พนักงานสร้างใบส่งสินค้า (DO) จาก Sales Order ได้',                  description: 'ลดเวลาจัดเตรียมเอกสารส่งของ',                                                         priority: 'medium', changeType: 'add', category: 'รับและส่งสินค้า',             subcategory: 'ส่งสินค้าออกจากคลัง' },
  { id: 'SR_WP011C', featureId: 'WP_SHP002',  title: 'ผู้ใช้ติดตามสถานะการจัดส่งจาก carrier แบบ real-time ได้',          description: 'ลดการโทรถาม carrier เรื่องสถานะพัสดุ',                                               priority: 'medium', changeType: 'add', category: 'รับและส่งสินค้า',             subcategory: 'ส่งสินค้าออกจากคลัง' },
  // เบิก-จ่ายสินค้า
  { id: 'SR_WP012',  featureId: 'WP_ISS001',  title: 'แผนกสามารถยื่นคำขอเบิกสินค้าออนไลน์ได้',                           description: 'ลดการโทรหาคลังสินค้า สามารถ track สถานะได้',                                         priority: 'high',   changeType: 'add', category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'SR_WP013',  featureId: 'WP_ISS002',  title: 'ระบบแจ้งเตือนเมื่อสินค้าที่เบิกทำให้ยอดต่ำกว่า Minimum Stock',    description: 'ป้องกัน stock หมดโดยไม่มีการแจ้งเตือน',                                              priority: 'high',   changeType: 'add', category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'SR_WP013B', featureId: 'WP_ISS003',  title: 'หัวหน้าคลังอนุมัติใบเบิกแบบ Multi-level ได้',                       description: 'ลดความเสี่ยงการเบิกสินค้าเกินสิทธิ์',                                                priority: 'high',   changeType: 'add', category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'SR_WP014',  featureId: 'WP_ISS004',  title: 'ผู้ใช้ดูประวัติการเบิกสินค้าย้อนหลัง 90 วันได้',                   description: 'ต้องการ audit trail การเบิกสินค้า',                                                   priority: 'low',    changeType: 'add', category: 'เบิก-จ่ายสินค้า',             subcategory: 'ประวัติการเบิก' },
  // ตรวจนับสินค้า
  { id: 'SR_WP015',  featureId: 'WP_CNT001',  title: 'ระบบสร้างและแจกจ่าย task Cycle Count ให้พนักงานได้',               description: 'ต้องการ automate การแจก task ตรวจนับ',                                                priority: 'high',   changeType: 'add', category: 'ตรวจนับสินค้า',               subcategory: 'Cycle Count' },
  { id: 'SR_WP016',  featureId: 'WP_CNT002',  title: 'พนักงานบันทึกผลนับสินค้าผ่านมือถือได้',                             description: 'ลดการใช้กระดาษและ manual entry',                                                      priority: 'high',   changeType: 'add', category: 'ตรวจนับสินค้า',               subcategory: 'Cycle Count' },
  { id: 'SR_WP016B', featureId: 'WP_CNT003',  title: 'ผู้จัดการดูรายงาน Variance ระหว่างยอดนับจริง vs ระบบได้',          description: 'ต้องการรู้สาเหตุและมูลค่าความต่าง',                                                   priority: 'medium', changeType: 'add', category: 'ตรวจนับสินค้า',               subcategory: 'Variance' },
  { id: 'SR_WP016C', featureId: 'WP_CNT004',  title: 'หัวหน้าคลังอนุมัติและปรับ Stock จากผลการนับได้',                    description: 'ต้องการ audit trail การปรับ stock',                                                   priority: 'medium', changeType: 'add', category: 'ตรวจนับสินค้า',               subcategory: 'Variance' },
  // รายงานและสถิติ
  { id: 'SR_WP017',  featureId: 'WP_RPT001',  title: 'ผู้จัดการดูรายงานสรุปยอดรับ-จ่ายสินค้าประจำวันได้',               description: 'ต้องการ daily summary dashboard',                                                      priority: 'medium', changeType: 'add', category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำวัน' },
  { id: 'SR_WP017B', featureId: 'WP_RPT003',  title: 'ผู้จัดการดูกราฟ Stock Level รายเดือนแยก category ได้',              description: 'ต้องการวิเคราะห์ trend เพื่อวางแผนการสั่งซื้อล่วงหน้า',                              priority: 'medium', changeType: 'add', category: 'รายงานและสถิติ',               subcategory: 'Dashboard' },
  // จัดการผู้ใช้งาน
  { id: 'SR_WP019',  featureId: 'WP_USR001',  title: 'Admin กำหนด Role และ Permission แต่ละ Module ได้',                   description: 'ควบคุม access ตามหน้าที่งานแต่ละคน',                                                  priority: 'high',   changeType: 'add', category: 'จัดการผู้ใช้งาน',             subcategory: 'บทบาทและสิทธิ์' },
  { id: 'SR_WP020',  featureId: 'WP_USR002',  title: 'ผู้ดูแลดูประวัติการใช้งานของผู้ใช้แต่ละคนได้',                      description: 'ต้องการ audit log ของ user actions',                                                  priority: 'low',    changeType: 'add', category: 'จัดการผู้ใช้งาน',             subcategory: 'ประวัติการใช้งาน' },
  { id: 'SR_WP020B', featureId: 'WP_USR003',  title: 'Admin กำหนด Warehouse ที่แต่ละ user เข้าถึงได้',                    description: 'แยก data scope ตาม warehouse เพื่อความปลอดภัย',                                       priority: 'medium', changeType: 'add', category: 'จัดการผู้ใช้งาน',             subcategory: 'บทบาทและสิทธิ์' },
  // incorrect — ทำแล้วแต่ไม่ตรง requirement (req บอก modify แต่ dev สร้างใหม่)
  { id: 'SR_WP026',  featureId: 'WP_STK006',  title: 'ปรับปรุงหน้ารายการสินค้าให้แสดง widget สรุปด้านบน',              description: 'ต้องการแก้ไขหน้าเดิมให้มี widget สรุปเพิ่ม ไม่ใช่สร้างหน้าใหม่แยกต่างหาก',               priority: 'high',   changeType: 'modify', category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  { id: 'SR_WP027',  featureId: 'WP_RCV004',  title: 'ปรับปรุงตารางรับสินค้าให้แก้ไขจำนวนได้โดยตรงแบบ Inline',       description: 'ต้องการแก้ไขตารางเดิมให้ edit ได้ใน cell ไม่ต้องเปิด modal เพิ่ม step ให้ผู้ใช้',          priority: 'high',   changeType: 'modify', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP028',  featureId: 'WP_ISS005',  title: 'ปรับปรุงฟอร์มเบิกสินค้าให้กรอกง่ายขึ้น ลดขั้นตอน',             description: 'ต้องการแก้ไขฟอร์มเดิมให้ลดจาก 4 ขั้นตอนเหลือ 2 ไม่ใช่สร้าง wizard ใหม่ทั้งหมด',           priority: 'high',   changeType: 'modify', category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'SR_WP029',  featureId: 'WP_RPT005',  title: 'เพิ่มปุ่ม Export PDF ในหน้ารายงานประจำวัน',                     description: 'ต้องการแก้ไขหน้ารายงานที่มีอยู่แล้วให้มีปุ่ม export ไม่ใช่สร้างหน้า viewer แยก',             priority: 'medium', changeType: 'modify', category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำวัน' },
  // pending — ยังไม่ได้ทำ
  { id: 'SR_WP021',  featureId: 'WP_MOB001',  title: 'แอปมือถือ Standalone สำหรับพนักงานคลัง',                            description: 'พนักงานรับ-จ่ายสินค้าผ่านมือถือได้เลย ไม่ต้องกลับ counter',                          priority: 'high',   changeType: 'add', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP022',  featureId: 'WP_RPT002',  title: 'รายงานสินค้าหมุนเวียนช้า (Slow-moving) เกิน 90 วัน',               description: 'ผู้จัดการคลังขอดูสินค้าที่ไม่มีการเคลื่อนไหว เพื่อวางแผน clearance',                priority: 'medium', changeType: 'add', category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำวัน' },
  { id: 'SR_WP023',  featureId: 'WP_INT001',  title: 'เชื่อมต่อกับระบบ ERP (SAP) แบบ Auto-sync',                          description: 'sync ข้อมูล PO และ GR อัตโนมัติกับ SAP ทุก 15 นาที ลด manual entry',                  priority: 'high',   changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP024',  featureId: 'WP_NTF001',  title: 'แจ้งเตือนผ่าน LINE Notify เมื่อสินค้าต่ำกว่า Reorder Point',       description: 'ส่ง LINE message ให้ผู้จัดการคลังเมื่อ stock ต่ำกว่า reorder point',                  priority: 'medium', changeType: 'add', category: 'จัดการสินค้าในคลัง',          subcategory: 'ภาพรวมสินค้า' },
  { id: 'SR_WP025',  featureId: 'WP_RPT004',  title: 'รายงาน ABC Analysis จัดกลุ่มสินค้าตามมูลค่า',                       description: 'แบ่งสินค้าเป็น A/B/C ตาม 80/15/5 rule เพื่อกำหนดนโยบาย safety stock',               priority: 'low',    changeType: 'add', category: 'รายงานและสถิติ',               subcategory: 'Dashboard' },
]

const WMSPRO: ProjectMock = {
  commits: [
    { sha: 'a1c3e5f', msg: 'feat: Login + session auto-refresh + user registration', author: 'tanawit.p' },
    { sha: 'b2d4f6a', msg: 'feat: Stock overview + advance search + Excel export + saved filters + movement history', author: 'siriporn.k' },
    { sha: 'c3e5g7b', msg: 'feat: GRN from PO + barcode receiving + buyer notification + DO + shipment tracking', author: 'nattawut.s' },
    { sha: 'd4f6h8j', msg: 'feat: Issue request + multi-level approval + stock alert + issue history', author: 'weerapat.c' },
    { sha: 'e5g7i9k', msg: 'feat: Cycle count + mobile counting + variance report + stock adjustment', author: 'kanokporn.m' },
    { sha: 'f6h8j0l', msg: 'feat: Daily report + stock trend chart + role management + audit log + warehouse scope', author: 'sorawit.n' },
  ],
  added: WP_ADDED,
  modified: [],
  removed: [],
  requirements: WP_REQUIREMENTS,
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

const MOCKS: Record<string, ProjectMock> = {
  'Doctor Mobile': DOCTOR_MOBILE,
  'ClinicMate':    CLINICMATE,
  'FactoryPro':    FACTORYPRO,
  'WMS Pro':       WMSPRO,
}

export function getProjectMock(projectName: string): ProjectMock | null {
  return MOCKS[projectName] ?? null
}
