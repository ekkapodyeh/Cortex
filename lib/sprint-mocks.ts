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
  { id: 'AUTH005', title: 'เข้าสู่ระบบด้วย Apple ID',           description: 'รองรับ Sign in with Apple บน iOS 13 ขึ้นไป ผูกบัญชีกับ Firebase Auth',                                category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Apple ID' },
  { id: 'AUTH006', title: 'เข้าสู่ระบบด้วย LINE',                description: 'LINE Login v2.1 + LIFF เชื่อมข้อมูลโปรไฟล์ ใช้งานทั้ง iOS และ Android',                                category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย LINE' },
  { id: 'MIG004',  title: 'บันทึกอาการด้วยเสียง',                 description: 'อัดเสียงระบุอาการ ระบบถอดข้อความและสกัด trigger อัตโนมัติด้วย Whisper API',                              category: 'Migraine Tracking',           subcategory: '' },
  { id: 'MED004',  title: 'แจ้งเตือนยาที่ตีกัน',                  description: 'ตรวจจับยาที่อาจเกิด drug interaction ส่งแจ้งเตือนก่อนยืนยันการเพิ่มยาใหม่',                          category: 'Medicine Pouch',              subcategory: '' },
  { id: 'RPT004',  title: 'Export รายงานเป็น Excel',              description: 'ส่งออกรายงานสุขภาพประจำเดือนเป็นไฟล์ .xlsx แยก sheet ตามประเภทข้อมูล',                                category: 'Report',                      subcategory: '' },
  { id: 'MKT006',  title: 'Wishlist รายการสินค้าที่สนใจ',         description: 'บันทึกสินค้าที่สนใจ แชร์เป็นลิงก์ให้คนอื่นดูได้ แจ้งเตือนเมื่อราคาลด',                                  category: 'Marketplace',                 subcategory: 'Migra Shop' },
]

const DM_MODIFIED: FeatureChange[] = [
  {
    old: { id: 'AUTH001', title: 'เข้าสู่ระบบด้วย Email และ Password + OTP', description: 'ผู้ใช้ล็อกอินด้วยอีเมลและรหัสผ่าน เพิ่ม OTP 6 หลักทาง Email สำหรับอุปกรณ์ใหม่ หมดอายุใน 5 นาที',                category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password' },
    new: { id: 'AUTH001', title: 'เข้าสู่ระบบ Email + OTP + Whitelist อุปกรณ์', description: 'เพิ่ม whitelist อุปกรณ์ที่เคยล็อกอินสำเร็จ ข้าม OTP สำหรับอุปกรณ์ในลิสต์ภายใน 30 วัน',                category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password' },
  },
  {
    old: { id: 'MIG001', title: 'บันทึกอาการปวดหัวไมเกรน',                       description: 'กรอกระดับความเจ็บปวด (0–10) ตำแหน่ง ระยะเวลา และ trigger เช่น แสง เสียง อาหาร',                          category: 'Migraine Tracking', subcategory: '' },
    new: { id: 'MIG001', title: 'บันทึกอาการพร้อมอัปโหลดภาพและ Voice memo',       description: 'เพิ่มอัปโหลดภาพและบันทึกเสียงประกอบในแต่ละครั้ง รองรับ tag อารมณ์และสภาพอากาศ',                      category: 'Migraine Tracking', subcategory: '' },
  },
  {
    old: { id: 'MED002', title: 'แจ้งเตือนเวลากินยา',                             description: 'ตั้งเวลาแจ้งเตือน push notification + in-app สำหรับแต่ละมื้อยา',                                            category: 'Medicine Pouch', subcategory: '' },
    new: { id: 'MED002', title: 'แจ้งเตือนเวลากินยาแบบ Smart Schedule',           description: 'ปรับเวลาแจ้งเตือนอัตโนมัติตามรูปแบบการใช้งาน เลื่อน reminder ได้ 5/10/15 นาที',                              category: 'Medicine Pouch', subcategory: '' },
  },
  {
    old: { id: 'MKT003', title: 'ตะกร้าสินค้าและ Checkout',                       description: 'เพิ่มสินค้าลงตะกร้า ชำระผ่าน credit card หรือ promptpay',                                              category: 'Marketplace', subcategory: 'Migra Shop' },
    new: { id: 'MKT003', title: 'ตะกร้า Checkout + TrueMoney Wallet',             description: 'เพิ่มช่องทาง TrueMoney Wallet, ShopeePay และ Rabbit LINE Pay พร้อม installment 0%',                      category: 'Marketplace', subcategory: 'Migra Shop' },
  },
]

const DM_REMOVED: Feature[] = [
  { id: 'DIS003', title: 'แจ้งเตือนโค้ดใกล้หมดอายุ',  description: 'ยกเลิกเพราะใช้ in-app notification center แทน push',                category: 'Discount code collection', subcategory: '' },
  { id: 'MKT005', title: 'ติดตามสถานะการจัดส่ง',     description: 'ย้ายไปแอปของ partner courier เพื่อให้ tracking real-time แม่นกว่า',  category: 'Marketplace',              subcategory: 'My Purchase' },
]

const DM_REQUIREMENTS: SprintReqMockItem[] = [
  { id: 'SR_DM001', featureId: 'AUTH005', title: 'เพิ่ม Sign in with Apple',                description: 'ลูกค้าขอให้รองรับ Apple ID เป็น 1 ใน social login หลัก',                          priority: 'high',   changeType: 'add',    category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Apple ID' },
  { id: 'SR_DM002', featureId: 'AUTH006', title: 'เพิ่ม LINE Login',                         description: 'ตลาดไทยใช้ LINE เยอะ ขอให้รองรับเป็น primary login',                              priority: 'high',   changeType: 'add',    category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย LINE' },
  { id: 'SR_DM003', featureId: 'AUTH001', title: 'ปรับ Login ให้รองรับ Whitelist อุปกรณ์',  description: 'ลด friction OTP ทุกครั้ง โดย whitelist อุปกรณ์ที่เคยใช้แล้วภายใน 30 วัน',           priority: 'medium', changeType: 'modify', category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'การเข้าสู่ระบบด้วย Email และ Password' },
  { id: 'SR_DM004', featureId: 'MIG004',  title: 'บันทึกอาการด้วยเสียง',                     description: 'ผู้ป่วยขณะปวดไมเกรนกรอกข้อมูลยาก ขอให้พูดบันทึกอาการแทน',                           priority: 'high',   changeType: 'add',    category: 'Migraine Tracking',           subcategory: '' },
  { id: 'SR_DM005', featureId: 'MED004',  title: 'แจ้งเตือนยาที่ตีกัน',                       description: 'หมอแนะนำว่าผู้ป่วยไมเกรนกินยาหลายชนิด อาจมี drug interaction ต้องเตือน',           priority: 'high',   changeType: 'add',    category: 'Medicine Pouch',              subcategory: '' },
  { id: 'SR_DM006', featureId: 'DIS003',  title: 'ลบแจ้งเตือนโค้ดใกล้หมดอายุ',                description: 'เปลี่ยนนโยบายไปใช้ in-app notification แทน push เพื่อลด opt-out',                   priority: 'low',    changeType: 'remove', category: 'Discount code collection',    subcategory: '' },
  { id: 'SR_DM007', featureId: 'MKT003',  title: 'เพิ่ม TrueMoney/ShopeePay ใน Checkout',     description: 'ผู้ใช้กลุ่มเป้าหมายใช้ e-Wallet มากกว่าบัตรเครดิต ขอเพิ่มอย่างน้อย 2 ค่าย',         priority: 'high',   changeType: 'modify', category: 'Marketplace',                 subcategory: 'Migra Shop' },
  { id: 'SR_DM008', featureId: 'MKT006',  title: 'ปรับปรุง Wishlist เดิมให้แชร์ลิงก์ได้',     description: 'BA เข้าใจว่ามี wishlist อยู่แล้ว ขอแค่แก้ให้แชร์ได้',                                 priority: 'medium', changeType: 'modify', category: 'Marketplace',                 subcategory: 'Migra Shop' },
  { id: 'SR_DM009', featureId: 'RPT004',  title: 'ปรับ Export PDF ให้เป็น Excel',             description: 'BA นึกว่า dev จะแก้ของเดิม แต่ dev สร้างเมนู Export Excel ใหม่แยกออกมา',          priority: 'medium', changeType: 'modify', category: 'Report',                      subcategory: '' },
  { id: 'SR_DM010', featureId: 'AUTH007', title: 'เพิ่ม Azure AD สำหรับองค์กร',                description: 'ขายให้ลูกค้า enterprise ขอ SSO ผ่าน Azure AD',                                      priority: 'medium', changeType: 'add',    category: 'การเข้าสู่ระบบ/ลงทะเบียน', subcategory: 'Enterprise SSO' },
  { id: 'SR_DM011', featureId: 'MIG005',  title: 'แชร์รายงานอาการกับคนในครอบครัว',           description: 'ผู้ดูแลผู้ป่วยอยากเห็นแนวโน้มอาการแบบ read-only',                                    priority: 'medium', changeType: 'add',    category: 'Migraine Tracking',           subcategory: '' },
  { id: 'SR_DM012', featureId: 'MED005',  title: 'Snooze แจ้งเตือนกินยา 5/10/15 นาที',         description: 'ผู้ใช้ขอเลื่อนเตือนได้เพราะอาจจะกำลังขับรถ',                                          priority: 'low',    changeType: 'add',    category: 'Medicine Pouch',              subcategory: '' },
  { id: 'SR_DM013', featureId: 'RPT001',  title: 'เพิ่ม heart rate variability ในรายงาน',     description: 'หมอขอข้อมูล HRV เพื่อประเมินความเครียดควบคู่กับอาการไมเกรน',                          priority: 'medium', changeType: 'modify', category: 'Report',                      subcategory: '' },
  { id: 'SR_DM014', featureId: 'DIS001',  title: 'ลบ Coupon collection ออก',                  description: 'CMO บอกว่า marketing model เปลี่ยน ไม่อยากให้ลูกค้าสะสมโค้ดอีก',                       priority: 'low',    changeType: 'remove', category: 'Discount code collection',    subcategory: '' },
  { id: 'SR_DM015', featureId: 'MKT004',  title: 'เพิ่มรีวิวสินค้าในประวัติการสั่งซื้อ',     description: 'ขอให้ผู้ใช้รีวิวได้จาก order ที่ถึงแล้ว',                                              priority: 'low',    changeType: 'modify', category: 'Marketplace',                 subcategory: 'My Purchase' },
]

const DOCTOR_MOBILE: ProjectMock = {
  commits: [
    { sha: 'a4f8c1b', msg: 'feat: Social login (Apple, LINE) + Whitelist device',         author: 'dev-somchai' },
    { sha: 'b3d2e5a', msg: 'feat: Voice symptom recording + drug interaction warning',    author: 'dev-malee' },
    { sha: 'c7e9f2d', msg: 'feat: Excel export + Wishlist + TrueMoney Wallet',            author: 'dev-nattapol' },
  ],
  added: DM_ADDED,
  modified: DM_MODIFIED,
  removed: DM_REMOVED,
  requirements: DM_REQUIREMENTS,
}

// ─── ClinicMate ───────────────────────────────────────────────────────────────

const CM_ADDED: Feature[] = [
  { id: 'CM_AUTH002', title: 'เข้าสู่ระบบด้วย Face ID / Touch ID',  description: 'รองรับ biometric login บน iOS และ Android ลด friction การล็อกอินซ้ำ',                                category: 'การเข้าสู่ระบบ',  subcategory: '' },
  { id: 'CM_APPT003', title: 'แจ้งเตือนนัดล่วงหน้า 24 ชั่วโมง',     description: 'ส่ง push notification และ SMS เตือนผู้ป่วยก่อนถึงเวลานัด รองรับการยืนยันหรือเลื่อนนัด',         category: 'การนัดหมาย',     subcategory: '' },
  { id: 'CM_REC003',  title: 'ดาวน์โหลดผลแล็บเป็น PDF',              description: 'ผู้ป่วยดาวน์โหลดผลแล็บเป็น PDF พร้อมตราประทับคลินิก สำหรับนำไปใช้ที่อื่น',                          category: 'เวชระเบียน',     subcategory: '' },
  { id: 'CM_TELE003', title: 'ปรึกษาแบบกลุ่ม (Group consultation)',  description: 'รองรับ video call หลายฝ่ายระหว่างผู้ป่วย ครอบครัว และทีมแพทย์พร้อมกัน',                            category: 'Telemedicine',   subcategory: '' },
]

const CM_MODIFIED: FeatureChange[] = [
  {
    old: { id: 'CM_BIL002',  title: 'ชำระค่ารักษาออนไลน์',                   description: 'ชำระเงินผ่าน QR promptpay หรือ credit card รองรับ Thai QR Payment Standard',                category: 'การเงิน',     subcategory: '' },
    new: { id: 'CM_BIL002',  title: 'ชำระค่ารักษาออนไลน์ + ใบเสร็จอิเล็กทรอนิกส์', description: 'เพิ่มใบเสร็จอิเล็กทรอนิกส์ (e-Receipt) ตามมาตรฐาน รด. ส่งเข้าอีเมลและบันทึกในแอป',           category: 'การเงิน',     subcategory: '' },
  },
  {
    old: { id: 'CM_TELE001', title: 'ปรึกษาแพทย์ผ่านวิดีโอคอล',                 description: 'เริ่ม video call กับแพทย์ผ่าน WebRTC รองรับ iOS และ Android ไม่ต้องติดตั้งแอปเพิ่ม',          category: 'Telemedicine', subcategory: '' },
    new: { id: 'CM_TELE001', title: 'ปรึกษาแพทย์ + Screen sharing ภาพถ่ายแผล',  description: 'เพิ่ม screen sharing สำหรับให้แพทย์ดูภาพถ่ายแผลหรือผลตรวจที่ผู้ป่วยถ่ายไว้',                 category: 'Telemedicine', subcategory: '' },
  },
]

const CM_REQUIREMENTS: SprintReqMockItem[] = [
  { id: 'SR_CM001', featureId: 'CM_AUTH002', title: 'เข้าสู่ระบบด้วย Face ID/Touch ID',         description: 'ผู้สูงอายุไม่อยากกรอกเลขบัตร 13 หลักทุกครั้ง ขอ biometric',                          priority: 'high',   changeType: 'add',    category: 'การเข้าสู่ระบบ',  subcategory: '' },
  { id: 'SR_CM002', featureId: 'CM_APPT003', title: 'แจ้งเตือนก่อนถึงนัด 1 วัน',                description: 'ลด no-show rate ของคลินิก ขอแจ้งเตือนล่วงหน้า 24 ชม.',                                  priority: 'high',   changeType: 'add',    category: 'การนัดหมาย',     subcategory: '' },
  { id: 'SR_CM003', featureId: 'CM_REC003',  title: 'ดาวน์โหลดผลแล็บเป็น PDF',                  description: 'ผู้ป่วยต้องนำผลแล็บไปยื่นที่โรงพยาบาลอื่นหรือบริษัทประกัน',                         priority: 'medium', changeType: 'add',    category: 'เวชระเบียน',     subcategory: '' },
  { id: 'SR_CM004', featureId: 'CM_BIL002',  title: 'เพิ่ม e-Receipt ตามมาตรฐานสรรพากร',        description: 'ลูกค้าองค์กรขอใบเสร็จอิเล็กทรอนิกส์ที่หักภาษีได้',                                     priority: 'high',   changeType: 'modify', category: 'การเงิน',         subcategory: '' },
  { id: 'SR_CM005', featureId: 'CM_TELE001', title: 'เพิ่ม Screen sharing ใน Video call',       description: 'แพทย์อยากเห็นภาพถ่ายแผลจากผู้ป่วยขณะปรึกษา',                                          priority: 'medium', changeType: 'modify', category: 'Telemedicine',   subcategory: '' },
  { id: 'SR_CM006', featureId: 'CM_TELE003', title: 'ปรับให้ Telemedicine เดิมรองรับหลายคน',    description: 'BA เข้าใจว่าเป็นการ extend feature เดิม แต่ dev สร้างเป็นเมนูใหม่แยก',                priority: 'medium', changeType: 'modify', category: 'Telemedicine',   subcategory: '' },
  { id: 'SR_CM007', featureId: 'CM_APPT004', title: 'จองคิวออนไลน์แบบ Walk-in',                 description: 'ผู้ป่วยที่เดินทางมาแล้วอยากเช็คคิวจากในแอปขณะรอ',                                    priority: 'medium', changeType: 'add',    category: 'การนัดหมาย',     subcategory: '' },
  { id: 'SR_CM008', featureId: 'CM_REC004',  title: 'บันทึกประวัติแพ้ยา/อาหาร',                 description: 'ผู้ป่วยกรอกแพ้ยา/อาหารเอง แสดงเป็น banner สำหรับแพทย์',                              priority: 'high',   changeType: 'add',    category: 'เวชระเบียน',     subcategory: '' },
  { id: 'SR_CM009', featureId: 'CM_BIL003',  title: 'ผ่อนชำระค่ารักษา 0% 3 เดือน',              description: 'ลูกค้ารายใหญ่ขอผ่อนผ่านบัตรเครดิต โดยคลินิกไม่รับ fee',                              priority: 'medium', changeType: 'add',    category: 'การเงิน',         subcategory: '' },
  { id: 'SR_CM010', featureId: 'CM_APPT001', title: 'เพิ่มเลือกแพทย์ตามภาษาที่พูดได้',          description: 'ผู้ป่วยต่างชาติเพิ่มขึ้น ขอกรองแพทย์ตามภาษา',                                       priority: 'low',    changeType: 'modify', category: 'การนัดหมาย',     subcategory: '' },
]

const CLINICMATE: ProjectMock = {
  commits: [
    { sha: 'f1d8a3c', msg: 'feat: Biometric login + Appointment reminders',                author: 'nattapong.w' },
    { sha: 'g2e9b4d', msg: 'feat: Lab PDF export + Group consultation',                    author: 'somsri.p' },
    { sha: 'h3f0c5e', msg: 'feat: e-Receipt + Screen sharing for telemedicine',            author: 'wichai.k' },
  ],
  added: CM_ADDED,
  modified: CM_MODIFIED,
  removed: [],
  requirements: CM_REQUIREMENTS,
}

// ─── FactoryPro (ระบบหลังบ้านบริหารโรงงาน) ───────────────────────────────────

const FP_ADDED: Feature[] = [
  // ไม่มีของเดิม → ถูกต้อง (req: add → diff: added → done)
  { id: 'FP_QC001',   title: 'ตรวจรับวัตถุดิบพร้อมบันทึกผล QC',              description: 'สแกน barcode วัตถุดิบที่รับเข้า บันทึกผลตรวจคุณภาพและรูปถ่ายพร้อมออกใบ GRN อัตโนมัติ',                                                                  category: 'ตรวจสอบคุณภาพวัตถุดิบและสินค้า',       subcategory: 'การรับวัตถุดิบ' },
  // ไม่มีของเดิม → ไม่ถูกต้อง (req: modify → diff: added → incorrect)
  { id: 'FP_QR001',   title: 'พิมพ์ QR Code ติดฉลากสินค้า (ระบบใหม่)',        description: 'สร้าง QR Code เข้ารหัส batch no. / lot no. / วันผลิต / วันหมดอายุ พิมพ์ผ่าน Zebra printer',                                                               category: 'พิมพ์ QR Code ติดฉลากสินค้า',           subcategory: '' },
  // ไม่มีของเดิม → ไม่มีใน Requirement (no req → no-req)
  { id: 'FP_MAT001',  title: 'บริหารสูตรการผลิต (Bill of Materials)',          description: 'กำหนด BOM หลายระดับ ระบุส่วนประกอบและปริมาณต่อหน่วย รองรับ revision control',                                                                            category: 'บริหารข้อมูลหลักสินค้าและสูตรการผลิต',  subcategory: '' },
  // ไม่มีของเดิม → ถูกต้อง: Export Excel จากผล Advance Search
  { id: 'FP_INV003',  title: 'Export รายงานสินค้าคงคลังเป็นไฟล์ Excel',       description: 'Export ผลการค้นหาจาก Advance Search เป็นไฟล์ .xlsx แยก sheet ตาม warehouse พร้อม summary row ท้ายตาราง',                                                  category: 'จัดการคลังวัตถุดิบและสินค้า',            subcategory: 'ค้นหาสินค้า' },
]

const FP_MODIFIED: FeatureChange[] = [
  // มีของเดิม → ถูกต้อง (req: modify → diff: modified → done)
  {
    old: { id: 'FP_PROD001', title: 'สร้างใบสั่งผลิต (Production Order)',              description: 'สร้างใบสั่งผลิตด้วยตนเอง ระบุสินค้า จำนวน และวันที่ต้องการ',                                                                                          category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',   subcategory: 'ใบสั่งผลิต' },
    new: { id: 'FP_PROD001', title: 'สร้างใบสั่งผลิตพร้อมตรวจสอบวัตถุดิบอัตโนมัติ',   description: 'ระบบตรวจสอบ stock วัตถุดิบก่อนยืนยัน Production Order แจ้งเตือนหาก material ไม่เพียงพอก่อนอนุมัติ',                                                   category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',   subcategory: 'ใบสั่งผลิต' },
  },
  // มีของเดิม → ไม่ถูกต้อง (req: add ใหม่ → แต่ dev modified ของเดิม → incorrect)
  {
    old: { id: 'FP_INV001',  title: 'ดูยอดคงเหลือสินค้าในคลัง',                       description: 'แสดงยอด stock สินค้าแยกตาม location และ warehouse',                                                                                                    category: 'จัดการคลังวัตถุดิบและสินค้า',           subcategory: 'ยอดคงเหลือ' },
    new: { id: 'FP_INV001',  title: 'ดูยอดคงเหลือสินค้าพร้อม lot tracking',            description: 'เพิ่มการแสดงยอดแยกตาม lot/batch และวันหมดอายุ รองรับ FEFO/FIFO',                                                                                        category: 'จัดการคลังวัตถุดิบและสินค้า',           subcategory: 'ยอดคงเหลือ' },
  },
  // มีของเดิม → ถูกต้อง: เปลี่ยน Simple filter → Advance Search
  {
    old: { id: 'FP_INV002',  title: 'ค้นหาสินค้าในคลังแบบ Simple Filter',             description: 'กรองสินค้าด้วย dropdown รหัสสินค้า และชื่อสินค้า',                                                                                                     category: 'จัดการคลังวัตถุดิบและสินค้า',           subcategory: 'ค้นหาสินค้า' },
    new: { id: 'FP_INV002',  title: 'ค้นหาสินค้าในคลังแบบ Advance Search',            description: 'กรองสินค้าได้หลายเงื่อนไขพร้อมกัน เช่น รหัสสินค้า หมวดหมู่ warehouse lot no. ช่วงวันหมดอายุ และสถานะสินค้า รองรับการบันทึก filter ที่ใช้บ่อย', category: 'จัดการคลังวัตถุดิบและสินค้า',           subcategory: 'ค้นหาสินค้า' },
  },
  // มีของเดิม → ไม่มีใน Requirement (no req → no-req)
  {
    old: { id: 'FP_PUR001',  title: 'สร้างใบสั่งซื้อ (Purchase Order)',                description: 'สร้าง PO ระบุผู้จำหน่าย รายการวัตถุดิบ ราคา และวันส่งมอบ',                                                                                            category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย',  subcategory: 'ใบสั่งซื้อ' },
    new: { id: 'FP_PUR001',  title: 'สร้างใบสั่งซื้อพร้อมอนุมัติหลายชั้น',            description: 'เพิ่ม approval workflow ตาม threshold มูลค่า PO — หัวหน้าฝ่ายอนุมัติ ≤ 50,000 บาท / ผู้จัดการอนุมัติ > 50,000 บาท',                                category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย',  subcategory: 'ใบสั่งซื้อ' },
  },
]

const FP_REMOVED: Feature[] = [
  { id: 'FP_WH001', title: 'นับสต็อกด้วย manual tally sheet', description: 'ยกเลิกเพราะเปลี่ยนเป็นระบบ cycle count ผ่านแอป mobile แทน', category: 'จัดการคลังวัตถุดิบและสินค้า', subcategory: 'นับสต็อก' },
]

const FP_REQUIREMENTS: SprintReqMockItem[] = [
  { id: 'SR_FP001', featureId: 'FP_QC001',   title: 'พนักงานสามารถบันทึกผล QC และออก GRN ได้ในขั้นตอนเดียว',        description: 'พนักงานสามารถบันทึกผล QC และออก GRN ได้ในขั้นตอนเดียว',        priority: 'high',   changeType: 'add',    category: 'ตรวจสอบคุณภาพวัตถุดิบและสินค้า',    subcategory: 'การรับวัตถุดิบ' },
  { id: 'SR_FP002', featureId: 'FP_QR001',   title: 'QR Code แสดง Lot No. วันผลิต และวันหมดอายุได้',                description: 'QR Code แสดง Lot No. วันผลิต และวันหมดอายุได้',                priority: 'medium', changeType: 'modify', category: 'พิมพ์ QR Code ติดฉลากสินค้า',         subcategory: '' },
  { id: 'SR_FP003', featureId: 'FP_PROD001', title: 'ระบบแจ้งเตือนเมื่อวัตถุดิบในคลังไม่เพียงพอก่อนยืนยันใบสั่งผลิต', description: 'ระบบแจ้งเตือนเมื่อวัตถุดิบในคลังไม่เพียงพอก่อนยืนยันใบสั่งผลิต', priority: 'high',   changeType: 'modify', category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',  subcategory: 'ใบสั่งผลิต' },
  { id: 'SR_FP004', featureId: 'FP_INV001',  title: 'ผู้ใช้สามารถดูประวัติการเคลื่อนไหวแยกตาม Lot/Batch ได้',      description: 'ผู้ใช้สามารถดูประวัติการเคลื่อนไหวแยกตาม Lot/Batch ได้',      priority: 'medium', changeType: 'add',    category: 'จัดการคลังวัตถุดิบและสินค้า',         subcategory: 'ยอดคงเหลือ' },
  { id: 'SR_FP005', featureId: 'FP_WH002',   title: 'พนักงานสแกน barcode เพื่อเบิกวัตถุดิบผ่านมือถือได้',           description: 'พนักงานสแกน barcode เพื่อเบิกวัตถุดิบผ่านมือถือได้',           priority: 'high',   changeType: 'add',    category: 'เบิกสินค้าและวัตถุดิบออกจากคลัง',    subcategory: '' },
  { id: 'SR_FP006', featureId: 'FP_PROD002', title: 'ผู้จัดการดู timeline Production Order แต่ละไลน์แบบ Gantt ได้',  description: 'ผู้จัดการดู timeline Production Order แต่ละไลน์แบบ Gantt ได้',  priority: 'medium', changeType: 'add',    category: 'บริหารแผนการผลิตและสั่งผลิตสินค้า',  subcategory: 'แผนการผลิต' },
  // Advance Search stories
  { id: 'SR_FP009', featureId: 'FP_INV002',  title: 'ผู้ใช้สามารถกรองสินค้าได้หลายเงื่อนไขพร้อมกันผ่าน Advance Search',  description: 'ผู้ใช้สามารถกรองสินค้าได้หลายเงื่อนไขพร้อมกันผ่าน Advance Search',  priority: 'high',   changeType: 'modify', category: 'จัดการคลังวัตถุดิบและสินค้า', subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_FP010', featureId: 'FP_INV003',  title: 'ผู้ใช้สามารถ Export ผลการค้นหาเป็นไฟล์ Excel ได้',                  description: 'ผู้ใช้สามารถ Export ผลการค้นหาเป็นไฟล์ Excel ได้',                  priority: 'medium', changeType: 'add',    category: 'จัดการคลังวัตถุดิบและสินค้า', subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_FP011', featureId: 'FP_INV004',  title: 'ผู้ใช้สามารถบันทึก Filter ที่ใช้บ่อยเพื่อเรียกใช้ภายหลังได้',       description: 'ผู้ใช้สามารถบันทึก Filter ที่ใช้บ่อยเพื่อเรียกใช้ภายหลังได้',       priority: 'low',    changeType: 'add',    category: 'จัดการคลังวัตถุดิบและสินค้า', subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_FP007', featureId: 'FP_PUR002',  title: 'ผู้ใช้บันทึกวันส่งมอบที่ยืนยันจากผู้จำหน่ายได้',              description: 'ผู้ใช้บันทึกวันส่งมอบที่ยืนยันจากผู้จำหน่ายได้',              priority: 'medium', changeType: 'add',    category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย', subcategory: 'ติดตาม PO' },
  { id: 'SR_FP008', featureId: 'FP_PUR003',  title: 'ระบบแจ้งเตือนอัตโนมัติเมื่อ due date ใกล้ถึงแต่ยังไม่รับของ', description: 'ระบบแจ้งเตือนอัตโนมัติเมื่อ due date ใกล้ถึงแต่ยังไม่รับของ', priority: 'medium', changeType: 'add',    category: 'สั่งซื้อและรับวัตถุดิบจากผู้จำหน่าย', subcategory: 'ติดตาม PO' },
]

const FACTORYPRO: ProjectMock = {
  commits: [
    { sha: 'a1b2c3d', msg: 'feat: Production Order with material check + BOM management',  author: 'krit.w' },
    { sha: 'e4f5g6h', msg: 'feat: QC goods receipt + QR Code label system',                author: 'nida.s' },
    { sha: 'i7j8k9l', msg: 'feat: PO approval workflow + lot tracking in inventory',       author: 'prasert.t' },
  ],
  added: FP_ADDED,
  modified: FP_MODIFIED,
  removed: FP_REMOVED,
  requirements: FP_REQUIREMENTS,
}

// ─── WMS Pro ──────────────────────────────────────────────────────────────────

const WP_ADDED: Feature[] = [
  // ✅ การเข้าสู่ระบบ / จัดการ Session
  { id: 'WP_AUTH003', title: 'ต่ออายุ Session อัตโนมัติเมื่อใกล้หมดอายุ',
    description: 'ระบบ refresh token อัตโนมัติก่อนหมดอายุ 5 นาที โดยไม่ต้องให้ผู้ใช้ login ใหม่',
    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'จัดการ Session' },
  // ⬜ การเข้าสู่ระบบ / เข้าสู่ระบบด้วย QR Code — ไม่มีของเดิม, ไม่มีใน req → no-req
  { id: 'WP_AUTH004', title: 'แสดง QR Code ชั่วคราวบนหน้า Login เพื่อสแกนจากมือถือ',
    description: 'สร้าง QR Code หมดอายุใน 60 วินาที สแกนด้วยแอปมือถือที่ login แล้วเพื่อยืนยันตัวตนบน desktop',
    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วย QR Code' },
  // ✅ จัดการสินค้า / ค้นหาสินค้า — ไม่มีของเดิม, req: add → done
  { id: 'WP_STK003',  title: 'Export รายงานสินค้าคงคลังเป็นไฟล์ Excel',
    description: 'Export ผลค้นหาจาก Advance Search เป็น .xlsx แยก sheet ตาม warehouse พร้อม summary row',
    category: 'จัดการสินค้าในคลัง', subcategory: 'ค้นหาสินค้า' },
  // ❌ รับสินค้า / รับสินค้าเข้าคลัง — ไม่มีของเดิม, req: modify → added → incorrect
  { id: 'WP_RCV002',  title: 'สแกน QR Code บนใบส่งของเพื่อ Match กับ PO อัตโนมัติ (ระบบใหม่)',
    description: 'สแกน QR Code บนใบส่งของ ระบบดึง PO ที่ตรงกันให้อัตโนมัติ ไม่ต้องกรอกเลข PO ด้วยตนเอง',
    category: 'รับและส่งสินค้า', subcategory: 'รับสินค้าเข้าคลัง' },
  // ✅ เบิก-จ่ายสินค้า / เบิกสินค้า — ไม่มีของเดิม, req: add → done
  { id: 'WP_ISS002',  title: 'แจ้งเตือนเมื่อสินค้าที่เบิกใกล้หมดสต็อก',
    description: 'ระบบแสดง warning เมื่อยอดคงเหลือหลังเบิกต่ำกว่า minimum stock ที่กำหนด',
    category: 'เบิก-จ่ายสินค้า', subcategory: 'เบิกสินค้าออกจากคลัง' },
  // ⬜ เบิก-จ่ายสินค้า / เบิกสินค้า — ไม่มีของเดิม, ไม่มีใน req → no-req
  { id: 'WP_ISS003',  title: 'บันทึกเหตุผลการเบิกสินค้าเกินแผน',
    description: 'กรณีเบิกเกิน production order กำหนด ผู้ใช้ต้องระบุเหตุผลก่อนยืนยัน',
    category: 'เบิก-จ่ายสินค้า', subcategory: 'เบิกสินค้าออกจากคลัง' },
  // ✅ ตรวจนับสินค้า — ไม่มีของเดิม, req: add → done
  { id: 'WP_CNT001',  title: 'สร้างรอบตรวจนับสินค้าแบบ Cycle Count',
    description: 'กำหนดรอบ cycle count รายวัน/รายสัปดาห์ สุ่มเลือกสินค้าที่ต้องนับ แจกจ่าย task ให้พนักงานผ่านมือถือ',
    category: 'ตรวจนับสินค้า', subcategory: 'Cycle Count' },
  // ✅ รายงานและสถิติ — ไม่มีของเดิม, req: add → done
  { id: 'WP_RPT001',  title: 'ดูรายงานสรุปยอดรับ-จ่ายสินค้าประจำวัน',
    description: 'Dashboard แสดงยอดรับเข้า จ่ายออก และยอดคงเหลือสิ้นวัน แยกตาม warehouse และหมวดหมู่สินค้า',
    category: 'รายงานและสถิติ', subcategory: 'รายงานประจำวัน' },
]

const WP_MODIFIED: FeatureChange[] = [
  // ✅ จัดการผู้ใช้งาน / สิทธิ์การเข้าถึง — มีของเดิม, req: modify → done
  {
    old: { id: 'WP_USR001',  title: 'กำหนดสิทธิ์ผู้ใช้แบบ Role-based (Admin/User)',
      description: 'แบ่งสิทธิ์เป็น Admin และ User ทั่วไป Admin แก้ไขได้ทุกอย่าง',
      category: 'จัดการผู้ใช้งาน', subcategory: 'สิทธิ์การเข้าถึง' },
    new: { id: 'WP_USR001',  title: 'กำหนดสิทธิ์ผู้ใช้แบบ Role-based แยกตาม Warehouse',
      description: 'แบ่งสิทธิ์ตาม role (Admin / Warehouse Manager / Staff) และจำกัดการเข้าถึงเฉพาะ warehouse ที่รับผิดชอบ',
      category: 'จัดการผู้ใช้งาน', subcategory: 'สิทธิ์การเข้าถึง' },
  },
  // ✅ ตั้งค่าระบบ / ข้อมูลหลัก — มีของเดิม, req: modify → done
  {
    old: { id: 'WP_CFG001',  title: 'ตั้งค่าข้อมูลหลักสินค้า (Item Master)',
      description: 'กรอกรหัสสินค้า ชื่อ หน่วยนับ และหมวดหมู่',
      category: 'ตั้งค่าระบบ', subcategory: 'ข้อมูลหลัก' },
    new: { id: 'WP_CFG001',  title: 'ตั้งค่าข้อมูลหลักสินค้าพร้อม Barcode และ Min/Max Stock',
      description: 'เพิ่มช่องกรอก barcode, minimum stock และ maximum stock เพื่อใช้กับการแจ้งเตือนและ cycle count',
      category: 'ตั้งค่าระบบ', subcategory: 'ข้อมูลหลัก' },
  },
  // ✅ การเข้าสู่ระบบ / เข้าสู่ระบบด้วยเบอร์โทร — มีของเดิม, req: modify → done
  {
    old: { id: 'WP_AUTH001', title: 'ระบุเบอร์โทรศัพท์เพื่อขอรหัส OTP',
      description: 'ระบบเลือกประเทศไทย (+66) เป็นค่าเริ่มต้น ผู้ใช้กรอกเฉพาะเบอร์โทร',
      category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' },
    new: { id: 'WP_AUTH001', title: 'ระบุรหัสประเทศและเบอร์โทรศัพท์ก่อนขอรหัส OTP',
      description: 'ระบบแสดงช่องเลือกรหัสประเทศและช่องกรอกเบอร์โทรแยกกัน ไม่มีค่าเริ่มต้น รองรับผู้ใช้ต่างประเทศ',
      category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' },
  },
  // ⬜ การเข้าสู่ระบบ / เข้าสู่ระบบด้วยเบอร์โทร — มีของเดิม, ไม่มีใน req → no-req
  {
    old: { id: 'WP_AUTH002', title: 'แสดงข้อความ error เมื่อกรอก OTP ผิด',
      description: 'แสดง toast "รหัส OTP ไม่ถูกต้อง" ทับหน้าจอ 3 วินาที',
      category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' },
    new: { id: 'WP_AUTH002', title: 'แสดงจำนวนครั้งที่เหลือและล็อกบัญชีเมื่อกรอก OTP ผิดเกินกำหนด',
      description: 'แสดงข้อความ "รหัสไม่ถูกต้อง เหลืออีก X ครั้ง" และล็อกบัญชี 15 นาทีเมื่อครบ 5 ครั้ง',
      category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' },
  },
  // ✅ จัดการสินค้า / ค้นหาสินค้า — มีของเดิม, req: modify → done
  {
    old: { id: 'WP_STK001',  title: 'ค้นหาสินค้าในคลังแบบ Simple Filter',
      description: 'กรองด้วย dropdown รหัสสินค้าและชื่อสินค้าเพียงอย่างเดียว',
      category: 'จัดการสินค้าในคลัง', subcategory: 'ค้นหาสินค้า' },
    new: { id: 'WP_STK001',  title: 'ค้นหาสินค้าในคลังแบบ Advance Search',
      description: 'กรองสินค้าได้หลายเงื่อนไขพร้อมกัน: รหัส ชื่อ หมวดหมู่ warehouse lot no. ช่วงวันหมดอายุ และสถานะ',
      category: 'จัดการสินค้าในคลัง', subcategory: 'ค้นหาสินค้า' },
  },
  // ❌ จัดการสินค้า / ยอดคงเหลือ — มีของเดิม, req: add (หน้าใหม่) → แต่ dev modified ของเดิม → incorrect
  {
    old: { id: 'WP_STK002',  title: 'แสดงยอดสินค้าคงเหลือรายสินค้า',
      description: 'ตารางแสดงยอด on-hand แยกตามรหัสสินค้า',
      category: 'จัดการสินค้าในคลัง', subcategory: 'ยอดคงเหลือ' },
    new: { id: 'WP_STK002',  title: 'แสดงยอดสินค้าคงเหลือพร้อม Lot และวันหมดอายุ',
      description: 'ตารางแสดงยอด on-hand แยกตาม lot/batch วันหมดอายุ และ location รองรับ FEFO',
      category: 'จัดการสินค้าในคลัง', subcategory: 'ยอดคงเหลือ' },
  },
  // ✅ รับสินค้า / รับสินค้าเข้าคลัง — มีของเดิม, req: modify → done
  {
    old: { id: 'WP_RCV001',  title: 'บันทึกรับสินค้าเข้าคลังด้วยการกรอกข้อมูล',
      description: 'กรอกเลข PO รหัสสินค้า จำนวน และ lot no. ด้วยตนเองก่อนยืนยัน',
      category: 'รับและส่งสินค้า', subcategory: 'รับสินค้าเข้าคลัง' },
    new: { id: 'WP_RCV001',  title: 'บันทึกรับสินค้าพร้อมถ่ายรูปและบันทึกผลตรวจคุณภาพ',
      description: 'กรอกข้อมูลรับสินค้า พร้อมถ่ายรูปและระบุผลตรวจ QC (ผ่าน/ไม่ผ่าน/รอตรวจ) ก่อนยืนยัน GRN',
      category: 'รับและส่งสินค้า', subcategory: 'รับสินค้าเข้าคลัง' },
  },
  // ❌ เบิก-จ่ายสินค้า / เบิกสินค้า — มีของเดิม, req: remove → แต่ dev modified ของเดิม → incorrect
  {
    old: { id: 'WP_ISS001',  title: 'เบิกสินค้าด้วยการกรอกรหัสและจำนวนด้วยตนเอง',
      description: 'กรอกรหัสสินค้าและจำนวนที่ต้องการเบิก เลือก warehouse และยืนยัน',
      category: 'เบิก-จ่ายสินค้า', subcategory: 'เบิกสินค้าออกจากคลัง' },
    new: { id: 'WP_ISS001',  title: 'เบิกสินค้าด้วยการสแกน Barcode แทนการกรอกรหัส',
      description: 'สแกน barcode สินค้าแทนการพิมพ์รหัส ลดความผิดพลาด รองรับสแกนต่อเนื่องหลายรายการ',
      category: 'เบิก-จ่ายสินค้า', subcategory: 'เบิกสินค้าออกจากคลัง' },
  },
]

const WP_REMOVED: Feature[] = [
  // ✅ การเข้าสู่ระบบ — req: remove → removed → done
  { id: 'WP_AUTH005', title: 'Login ด้วย Username และ Password',
    description: 'ยกเลิกเพราะเปลี่ยนไปใช้ OTP ทางเบอร์โทรทั้งหมด เพื่อลด friction และเพิ่มความปลอดภัย',
    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วย Username' },
  // ⬜ จัดการสินค้า — ไม่มีใน req → removed → no-req
  { id: 'WP_STK006',  title: 'แสดงกราฟยอดรับ-จ่ายสินค้ารายสัปดาห์',
    description: 'กราฟ bar chart แสดงปริมาณรับและจ่ายสินค้าย้อนหลัง 4 สัปดาห์',
    category: 'จัดการสินค้าในคลัง', subcategory: 'ภาพรวมคลัง' },
]

const WP_REQUIREMENTS: SprintReqMockItem[] = [
  // การเข้าสู่ระบบ
  { id: 'SR_WP001', featureId: 'WP_AUTH001', title: 'ระบบรองรับการกรอกรหัสประเทศสำหรับผู้ใช้ต่างประเทศได้',           description: 'ระบบรองรับการกรอกรหัสประเทศสำหรับผู้ใช้ต่างประเทศได้',           priority: 'high',   changeType: 'modify', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' },
  { id: 'SR_WP002', featureId: 'WP_AUTH003', title: 'ผู้ใช้ไม่ถูก Logout กะทันหันระหว่างใช้งานเมื่อ Token หมดอายุ',  description: 'ผู้ใช้ไม่ถูก Logout กะทันหันระหว่างใช้งานเมื่อ Token หมดอายุ',  priority: 'high',   changeType: 'add',    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'จัดการ Session' },
  { id: 'SR_WP003', featureId: 'WP_AUTH005', title: 'ระบบนำ Login ด้วย Username/Password ออก',                        description: 'ระบบนำ Login ด้วย Username/Password ออก',                        priority: 'medium', changeType: 'remove', category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'เข้าสู่ระบบด้วย Username' },
  { id: 'SR_WP004', featureId: 'WP_AUTH006', title: 'ผู้ใช้สมัครสมาชิกด้วยเบอร์โทรและกำหนดชื่อได้',                  description: 'ผู้ใช้สมัครสมาชิกด้วยเบอร์โทรและกำหนดชื่อได้',                  priority: 'medium', changeType: 'add',    category: 'การเข้าสู่ระบบและลงทะเบียน', subcategory: 'ลงทะเบียนผู้ใช้ใหม่' },
  // จัดการสินค้า
  { id: 'SR_WP005', featureId: 'WP_STK001',  title: 'ผู้ใช้กรองสินค้าได้หลายเงื่อนไขพร้อมกันผ่าน Advance Search',    description: 'ผู้ใช้กรองสินค้าได้หลายเงื่อนไขพร้อมกันผ่าน Advance Search',    priority: 'high',   changeType: 'modify', category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP006', featureId: 'WP_STK003',  title: 'ผู้ใช้ Export ผลการค้นหาเป็นไฟล์ Excel ได้',                    description: 'ผู้ใช้ Export ผลการค้นหาเป็นไฟล์ Excel ได้',                    priority: 'medium', changeType: 'add',    category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP007', featureId: 'WP_STK004',  title: 'ผู้ใช้บันทึก Filter ที่ใช้บ่อยเพื่อเรียกใช้ภายหลังได้',         description: 'ผู้ใช้บันทึก Filter ที่ใช้บ่อยเพื่อเรียกใช้ภายหลังได้',         priority: 'low',    changeType: 'add',    category: 'จัดการสินค้าในคลัง',          subcategory: 'ค้นหาสินค้า' },
  { id: 'SR_WP008', featureId: 'WP_STK002',  title: 'ผู้ใช้ดูประวัติเคลื่อนไหว Lot/Batch ในหน้าแยกต่างหากได้',      description: 'ผู้ใช้ดูประวัติเคลื่อนไหว Lot/Batch ในหน้าแยกต่างหากได้',      priority: 'medium', changeType: 'add',    category: 'จัดการสินค้าในคลัง',          subcategory: 'ยอดคงเหลือ' },
  // รับสินค้า
  { id: 'SR_WP009', featureId: 'WP_RCV001',  title: 'พนักงานถ่ายรูปและบันทึกผล QC ในขั้นตอนรับสินค้าได้',           description: 'พนักงานถ่ายรูปและบันทึกผล QC ในขั้นตอนรับสินค้าได้',           priority: 'high',   changeType: 'modify', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP010', featureId: 'WP_RCV002',  title: 'ระบบ Match ใบส่งของกับ PO ได้เมื่อสแกน QR Code บนใบส่งของ',   description: 'ระบบ Match ใบส่งของกับ PO ได้เมื่อสแกน QR Code บนใบส่งของ',   priority: 'medium', changeType: 'modify', category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  { id: 'SR_WP011', featureId: 'WP_RCV003',  title: 'ระบบแจ้งเตือน Buyer เมื่อรับสินค้าครบตาม PO แล้ว',            description: 'ระบบแจ้งเตือน Buyer เมื่อรับสินค้าครบตาม PO แล้ว',            priority: 'low',    changeType: 'add',    category: 'รับและส่งสินค้า',             subcategory: 'รับสินค้าเข้าคลัง' },
  // เบิก-จ่าย
  { id: 'SR_WP012', featureId: 'WP_ISS001',  title: 'ระบบนำฟอร์มกรอกรหัสสินค้าด้วยตนเองออก',                       description: 'ระบบนำฟอร์มกรอกรหัสสินค้าด้วยตนเองออก',                       priority: 'medium', changeType: 'remove', category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'SR_WP013', featureId: 'WP_ISS002',  title: 'ระบบแจ้งเตือนเมื่อสินค้าที่เบิกทำให้ยอดต่ำกว่า Minimum Stock', description: 'ระบบแจ้งเตือนเมื่อสินค้าที่เบิกทำให้ยอดต่ำกว่า Minimum Stock', priority: 'high',   changeType: 'add',    category: 'เบิก-จ่ายสินค้า',             subcategory: 'เบิกสินค้าออกจากคลัง' },
  { id: 'SR_WP014', featureId: 'WP_ISS004',  title: 'ผู้ใช้ดูประวัติการเบิกสินค้าย้อนหลัง 90 วันได้',              description: 'ผู้ใช้ดูประวัติการเบิกสินค้าย้อนหลัง 90 วันได้',              priority: 'low',    changeType: 'add',    category: 'เบิก-จ่ายสินค้า',             subcategory: 'ประวัติการเบิก' },
  // ตรวจนับสินค้า
  { id: 'SR_WP015', featureId: 'WP_CNT001',  title: 'ระบบสร้างและแจกจ่าย task Cycle Count ให้พนักงานได้',         description: 'ระบบสร้างและแจกจ่าย task Cycle Count ให้พนักงานได้',         priority: 'high',   changeType: 'add',    category: 'ตรวจนับสินค้า',               subcategory: 'Cycle Count' },
  { id: 'SR_WP016', featureId: 'WP_CNT002',  title: 'พนักงานบันทึกผลนับสินค้าผ่านมือถือได้',                      description: 'พนักงานบันทึกผลนับสินค้าผ่านมือถือได้',                      priority: 'high',   changeType: 'add',    category: 'ตรวจนับสินค้า',               subcategory: 'Cycle Count' },
  // รายงาน
  { id: 'SR_WP017', featureId: 'WP_RPT001',  title: 'ผู้จัดการดูรายงานสรุปยอดรับ-จ่ายสินค้าประจำวันได้',         description: 'ผู้จัดการดูรายงานสรุปยอดรับ-จ่ายสินค้าประจำวันได้',         priority: 'medium', changeType: 'add',    category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำวัน' },
  { id: 'SR_WP018', featureId: 'WP_RPT002',  title: 'ผู้ใช้ Export รายงานประจำเดือนเป็น PDF ได้',                  description: 'ผู้ใช้ Export รายงานประจำเดือนเป็น PDF ได้',                  priority: 'low',    changeType: 'add',    category: 'รายงานและสถิติ',               subcategory: 'รายงานประจำเดือน' },
  // จัดการผู้ใช้
  { id: 'SR_WP019', featureId: 'WP_USR001',  title: 'ผู้ดูแลกำหนดสิทธิ์ผู้ใช้แยกตาม Warehouse ได้',              description: 'ผู้ดูแลกำหนดสิทธิ์ผู้ใช้แยกตาม Warehouse ได้',              priority: 'high',   changeType: 'modify', category: 'จัดการผู้ใช้งาน',             subcategory: 'สิทธิ์การเข้าถึง' },
  { id: 'SR_WP020', featureId: 'WP_USR002',  title: 'ผู้ดูแลดูประวัติการใช้งานของผู้ใช้แต่ละคนได้',              description: 'ผู้ดูแลดูประวัติการใช้งานของผู้ใช้แต่ละคนได้',              priority: 'low',    changeType: 'add',    category: 'จัดการผู้ใช้งาน',             subcategory: 'ประวัติการใช้งาน' },
  // ตั้งค่าระบบ
  { id: 'SR_WP021', featureId: 'WP_CFG001',  title: 'ผู้ดูแลตั้งค่า Min/Max Stock ของสินค้าแต่ละรายการได้',       description: 'ผู้ดูแลตั้งค่า Min/Max Stock ของสินค้าแต่ละรายการได้',       priority: 'medium', changeType: 'modify', category: 'ตั้งค่าระบบ',                  subcategory: 'ข้อมูลหลัก' },
]

const WMSPRO: ProjectMock = {
  commits: [
    { sha: 'a1c3e5f', msg: 'feat: OTP login with country code + session auto-refresh',    author: 'tanawit.p' },
    { sha: 'b2d4f6a', msg: 'feat: Advance Search + Excel export + lot tracking',           author: 'siriporn.k' },
    { sha: 'c3e5g7b', msg: 'feat: QC on goods receipt + barcode issue + stock alert',     author: 'nattawut.s' },
  ],
  added:    WP_ADDED,
  modified: WP_MODIFIED,
  removed:  WP_REMOVED,
  requirements: WP_REQUIREMENTS,
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

const MOCKS: Record<string, ProjectMock> = {
  'Doctor Mobile': DOCTOR_MOBILE,
  'ClinicMate': CLINICMATE,
  'FactoryPro': FACTORYPRO,
  'WMS Pro': WMSPRO,
}

export function getProjectMock(projectName: string): ProjectMock | null {
  return MOCKS[projectName] ?? null
}
