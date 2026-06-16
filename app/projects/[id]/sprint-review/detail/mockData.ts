import type { SubcategoryGroup } from './SubcategoryList'

function item(
  id: string,
  newTitle: string,
  newDescription: string,
  reqStatus: 'done' | 'incorrect' | 'pending' | 'no-req',
  reqNote: string | null,
  conditions: SubcategoryGroup['items'][0]['conditions'],
  isSynthetic = false,
): SubcategoryGroup['items'][0] {
  return {
    id,
    changeType: 'added' as const,
    oldTitle: null,
    oldDescription: null,
    newTitle,
    newDescription,
    impact: null,
    reqStatus,
    reqNote,
    reqChangeType: reqStatus !== 'no-req' ? ('add' as const) : null,
    isSynthetic,
    commits: [],
    changeTypeMismatchReason: null,
    conditions: conditions ?? [],
  }
}

export const MOCK_BY_CAT: Record<string, SubcategoryGroup[]> = {
  'เข้าสู่ระบบ': [{
    sub: 'การตรวจสอบสิทธิ์',
    items: [
      item('mk-auth-done', 'เข้าสู่ระบบด้วย Username/Password', 'ระบบ login มาตรฐาน รองรับ remember me และ force logout session เก่า', 'done', 'ผู้ใช้สามารถเข้าสู่ระบบด้วย Username และ Password ได้', [
        { id: 'mk-a-c1', description: 'ตรวจสอบ Username และ Password กับฐานข้อมูล', status: 'match' },
        { id: 'mk-a-c2', description: 'รองรับ Remember me เก็บ session 30 วัน', status: 'match' },
        { id: 'mk-a-c3', description: 'Force logout session เก่าเมื่อ login ใหม่', status: 'match' },
      ]),
      item('mk-auth-wrong', 'ยืนยันตัวตน 2 ขั้นตอน (OTP)', 'ระบบส่ง OTP ผ่าน SMS แต่ยังไม่รองรับ OTP ผ่าน Email', 'incorrect', 'ยืนยันตัวตนด้วย OTP ผ่าน SMS หรือ Email ได้', [
        { id: 'mk-a-c4', description: 'ส่ง OTP ผ่าน SMS ได้', status: 'match' },
        { id: 'mk-a-c5', description: 'ส่ง OTP ผ่าน Email ได้', status: 'wrong', note: 'โค้ดทำ: รองรับเฉพาะ SMS ยังไม่ได้ทำ Email OTP' },
        { id: 'mk-a-c6', description: 'OTP หมดอายุหลัง 5 นาที', status: 'match' },
      ]),
      item('mk-auth-pending', 'Username ไม่สามารถกรอกภาษาไทยได้', 'Validate ให้ Username รับได้เฉพาะ a-z, 0-9 และ _ เท่านั้น', 'pending', 'Username รองรับเฉพาะภาษาอังกฤษและตัวเลข', [
        { id: 'mk-a-c7', description: 'Validate ห้ามกรอก Unicode ภาษาไทยใน Username', status: 'missing' },
        { id: 'mk-a-c8', description: 'แสดง error message "Username ต้องเป็นภาษาอังกฤษเท่านั้น"', status: 'missing' },
      ], true),
      item('mk-auth-noreq', 'สามารถกดแสดงหรือซ่อนรหัสผ่านได้', 'ปุ่ม toggle แสดง/ซ่อน password ในช่อง input', 'no-req', null, []),
    ],
  }],
  'การเข้าสู่ระบบและลงทะเบียน': [{
    sub: 'การตรวจสอบสิทธิ์',
    items: [
      item('mk-auth2-done', 'เข้าสู่ระบบด้วย Username/Password', 'ระบบ login มาตรฐาน รองรับ remember me และ force logout session เก่า', 'done', 'ผู้ใช้สามารถเข้าสู่ระบบด้วย Username และ Password ได้', [
        { id: 'mk-b-c1', description: 'ตรวจสอบ Username และ Password กับฐานข้อมูล', status: 'match' },
        { id: 'mk-b-c2', description: 'รองรับ Remember me เก็บ session 30 วัน', status: 'match' },
        { id: 'mk-b-c3', description: 'Force logout session เก่าเมื่อ login ใหม่', status: 'match' },
      ]),
      item('mk-auth2-wrong', 'ยืนยันตัวตน 2 ขั้นตอน (OTP)', 'ระบบส่ง OTP ผ่าน SMS แต่ยังไม่รองรับ OTP ผ่าน Email', 'incorrect', 'ยืนยันตัวตนด้วย OTP ผ่าน SMS หรือ Email ได้', [
        { id: 'mk-b-c4', description: 'ส่ง OTP ผ่าน SMS ได้', status: 'match' },
        { id: 'mk-b-c5', description: 'ส่ง OTP ผ่าน Email ได้', status: 'wrong', note: 'โค้ดทำ: รองรับเฉพาะ SMS ยังไม่ได้ทำ Email OTP' },
        { id: 'mk-b-c6', description: 'OTP หมดอายุหลัง 5 นาที', status: 'match' },
      ]),
      item('mk-auth2-pending', 'Username ไม่สามารถกรอกภาษาไทยได้', 'Validate ให้ Username รับได้เฉพาะ a-z, 0-9 และ _ เท่านั้น', 'pending', 'Username รองรับเฉพาะภาษาอังกฤษและตัวเลข', [
        { id: 'mk-b-c7', description: 'Validate ห้ามกรอก Unicode ภาษาไทยใน Username', status: 'missing' },
        { id: 'mk-b-c8', description: 'แสดง error message "Username ต้องเป็นภาษาอังกฤษเท่านั้น"', status: 'missing' },
      ], true),
      item('mk-auth2-noreq', 'สามารถกดแสดงหรือซ่อนรหัสผ่านได้', 'ปุ่ม toggle แสดง/ซ่อน password ในช่อง input', 'no-req', null, []),
    ],
  }],
  'จัดการสินค้าในคลัง': [{
    sub: 'การจัดการสต็อก',
    items: [
      item('mk-inv-done', 'เพิ่มสินค้าใหม่เข้าคลัง', 'พนักงานกรอกชื่อสินค้า หมวดหมู่ จำนวน ราคาต้นทุน และกำหนด Reorder Point ระบบบันทึกและแสดงสินค้าใหม่ในรายการทันที', 'done', 'พนักงานสามารถเพิ่มสินค้าใหม่พร้อมกำหนด Reorder Point ได้', [
        { id: 'mk-i-c1', description: 'กรอกชื่อสินค้า หมวดหมู่ จำนวน และราคาต้นทุนได้', status: 'match' },
        { id: 'mk-i-c2', description: 'กำหนดค่า Reorder Point ต่อสินค้าได้', status: 'match' },
        { id: 'mk-i-c3', description: 'สินค้าใหม่แสดงในรายการทันทีหลังบันทึก', status: 'match' },
      ]),
      item('mk-inv-wrong', 'ค้นหาสินค้าในคลัง', 'ค้นหาด้วย keyword ชื่อสินค้า แสดงผลทันทีขณะพิมพ์ ยังไม่รองรับกรองหลายเงื่อนไขพร้อมกัน', 'incorrect', 'ค้นหาสินค้าได้หลายเงื่อนไขพร้อมกัน และบันทึกประวัติการค้นหา', [
        { id: 'mk-i-c4', description: 'ค้นหาได้หลายเงื่อนไขพร้อมกัน (ชื่อ + หมวดหมู่ + ราคา)', status: 'wrong', note: 'โค้ดทำ: ค้นหาได้เฉพาะชื่อสินค้าเท่านั้น' },
        { id: 'mk-i-c5', description: 'แสดงผลการค้นหาแบบ real-time ขณะพิมพ์', status: 'match' },
        { id: 'mk-i-c6', description: 'บันทึกประวัติการค้นหา 10 รายการล่าสุด', status: 'missing' },
      ]),
      item('mk-inv-pending', 'แจ้งเตือนเมื่อสินค้าใกล้หมด', 'ตรวจสอบ stock เทียบ Reorder Point และแจ้งเตือนผ่าน LINE Notify', 'pending', 'แจ้งเตือนผ่าน LINE Notify เมื่อสินค้าต่ำกว่า Reorder Point', [
        { id: 'mk-i-c7', description: 'ตรวจสอบ stock เทียบ Reorder Point ทุก 1 ชั่วโมง', status: 'missing' },
        { id: 'mk-i-c8', description: 'ส่งข้อความแจ้งเตือนผ่าน LINE Notify พร้อมชื่อสินค้าและจำนวนคงเหลือ', status: 'missing' },
      ], true),
      item('mk-inv-noreq', 'Export รายงานสต็อกเป็น PDF', 'ส่งออกรายงานสรุปสินค้าทั้งหมดพร้อมสถานะ stock เป็นไฟล์ PDF', 'no-req', null, []),
    ],
  }],
  'รับและส่งสินค้า': [{
    sub: 'การรับสินค้า',
    items: [
      item('mk-recv-done', 'บันทึกการรับสินค้าจาก Supplier', 'สแกน barcode หรือกรอกรหัสสินค้า ระบุจำนวนที่รับจริง และอัปเดต stock อัตโนมัติ', 'done', 'พนักงานบันทึกการรับสินค้าและอัปเดต stock ได้', [
        { id: 'mk-r-c1', description: 'สแกน barcode หรือกรอกรหัสสินค้าได้', status: 'match' },
        { id: 'mk-r-c2', description: 'ระบุจำนวนที่รับจริงและอัปเดต stock อัตโนมัติ', status: 'match' },
      ]),
      item('mk-recv-wrong', 'พิมพ์ใบรับสินค้า', 'พิมพ์ใบรับสินค้าได้แต่ยังไม่มี QR code', 'incorrect', 'พิมพ์ใบรับสินค้าพร้อม QR code อ้างอิงเลขที่รับ', [
        { id: 'mk-r-c3', description: 'พิมพ์ใบรับสินค้าพร้อมข้อมูลครบถ้วน', status: 'match' },
        { id: 'mk-r-c4', description: 'มี QR code อ้างอิงเลขที่รับสินค้าบนใบ', status: 'wrong', note: 'โค้ดทำ: พิมพ์ใบได้แต่ไม่มี QR code' },
      ]),
      item('mk-recv-pending', 'แจ้ง Supervisor เมื่อสินค้าที่รับไม่ตรงกับ PO', 'เปรียบเทียบจำนวนที่รับกับ PO อัตโนมัติ และส่ง notification ให้ Supervisor', 'pending', 'ระบบแจ้งเตือน Supervisor เมื่อจำนวนรับไม่ตรง PO', [
        { id: 'mk-r-c5', description: 'เปรียบเทียบจำนวนรับกับ PO อัตโนมัติ', status: 'missing' },
        { id: 'mk-r-c6', description: 'ส่ง notification ให้ Supervisor ทันที', status: 'missing' },
      ], true),
      item('mk-recv-noreq', 'ถ่ายรูปสินค้าที่รับเข้าแนบกับใบรับ', 'อัปโหลดรูปสินค้าแนบกับเอกสารรับสินค้า', 'no-req', null, []),
    ],
  }],
  'เบิก-จ่ายสินค้า': [{
    sub: 'การเบิกสินค้า',
    items: [
      item('mk-disp-done', 'สร้างใบเบิกสินค้า', 'พนักงานเลือกสินค้าและระบุจำนวนที่ต้องการ ระบบตรวจสอบ stock ก่อนอนุมัติ', 'done', 'พนักงานสร้างใบเบิกสินค้าพร้อมตรวจสอบ stock ได้', [
        { id: 'mk-d-c1', description: 'เลือกสินค้าและระบุจำนวนที่ต้องการเบิก', status: 'match' },
        { id: 'mk-d-c2', description: 'ตรวจสอบ stock ก่อนอนุมัติการเบิก', status: 'match' },
        { id: 'mk-d-c3', description: 'แสดง error เมื่อ stock ไม่เพียงพอ', status: 'match' },
      ]),
      item('mk-disp-wrong', 'อนุมัติใบเบิกโดย Supervisor', 'Supervisor กดอนุมัติได้แต่ยังไม่สามารถแนบหมายเหตุปฏิเสธ', 'incorrect', 'Supervisor อนุมัติหรือปฏิเสธใบเบิกพร้อมหมายเหตุ', [
        { id: 'mk-d-c4', description: 'Supervisor อนุมัติใบเบิกได้', status: 'match' },
        { id: 'mk-d-c5', description: 'Supervisor ปฏิเสธพร้อมระบุหมายเหตุได้', status: 'wrong', note: 'โค้ดทำ: ปฏิเสธได้แต่ไม่มีช่องกรอกหมายเหตุ' },
      ]),
      item('mk-disp-pending', 'ประวัติการเบิกสินค้าย้อนหลัง 90 วัน', 'แสดงรายการเบิกทั้งหมดพร้อมกรองตามแผนกและช่วงวันที่', 'pending', 'ดูประวัติการเบิกย้อนหลัง 90 วันกรองตามแผนกได้', [
        { id: 'mk-d-c6', description: 'แสดงรายการเบิกย้อนหลัง 90 วัน', status: 'missing' },
        { id: 'mk-d-c7', description: 'กรองตามแผนกและช่วงวันที่ได้', status: 'missing' },
      ], true),
      item('mk-disp-noreq', 'Export ใบเบิกเป็นไฟล์ Excel', 'ส่งออกรายการใบเบิกเป็น .xlsx', 'no-req', null, []),
    ],
  }],
  'ตรวจนับสินค้า': [{
    sub: 'การตรวจนับ',
    items: [
      item('mk-cnt-done', 'สร้างรอบการตรวจนับสินค้า', 'ผู้ดูแลสร้างรอบนับ กำหนดสินค้าที่ต้องนับ และมอบหมายทีม', 'done', 'ผู้ดูแลสร้างรอบตรวจนับพร้อมมอบหมายทีมได้', [
        { id: 'mk-c-c1', description: 'สร้างรอบนับและเลือกสินค้าที่ต้องตรวจนับ', status: 'match' },
        { id: 'mk-c-c2', description: 'มอบหมายทีมผู้ตรวจนับแต่ละรายการ', status: 'match' },
      ]),
      item('mk-cnt-wrong', 'บันทึกผลการตรวจนับ', 'บันทึกจำนวนจริงได้แต่ยังไม่คำนวณส่วนต่างอัตโนมัติ', 'incorrect', 'บันทึกจำนวนจริงและแสดงส่วนต่างกับระบบทันที', [
        { id: 'mk-c-c3', description: 'กรอกจำนวนที่นับได้จริง', status: 'match' },
        { id: 'mk-c-c4', description: 'แสดงส่วนต่างเทียบกับ stock ในระบบทันที', status: 'wrong', note: 'โค้ดทำ: บันทึกได้แต่ต้องกด refresh ถึงจะเห็นส่วนต่าง' },
      ]),
      item('mk-cnt-pending', 'รายงานสรุปผลการตรวจนับ', 'สรุปสินค้าที่ตรงและไม่ตรง พร้อมมูลค่าส่วนต่าง', 'pending', 'รายงานสรุปผลนับพร้อมมูลค่าส่วนต่างทั้งหมด', [
        { id: 'mk-c-c5', description: 'สรุปรายการที่ stock ตรงและไม่ตรง', status: 'missing' },
        { id: 'mk-c-c6', description: 'แสดงมูลค่าส่วนต่างรวม', status: 'missing' },
      ], true),
      item('mk-cnt-noreq', 'ถ่ายรูปสินค้าขณะตรวจนับ', 'อัปโหลดรูปสินค้าแนบกับรายการตรวจนับ', 'no-req', null, []),
    ],
  }],
  'รายงานและสถิติ': [{
    sub: 'รายงานสรุป',
    items: [
      item('mk-rpt-done', 'รายงานการเคลื่อนไหวสินค้าประจำวัน', 'แสดงยอดรับ เบิก และ stock คงเหลือรายวัน กรองตามหมวดหมู่ได้', 'done', 'รายงานการเคลื่อนไหวสินค้ารายวันกรองตามหมวดหมู่', [
        { id: 'mk-rp-c1', description: 'แสดงยอดรับ เบิก และ stock คงเหลือรายวัน', status: 'match' },
        { id: 'mk-rp-c2', description: 'กรองตามหมวดหมู่สินค้าได้', status: 'match' },
      ]),
      item('mk-rpt-wrong', 'กราฟแนวโน้ม stock รายเดือน', 'กราฟแสดงข้อมูลรายเดือนแต่ยังไม่รองรับเปรียบเทียบหลายหมวดพร้อมกัน', 'incorrect', 'กราฟแนวโน้ม stock เปรียบเทียบหลายหมวดหมู่', [
        { id: 'mk-rp-c3', description: 'กราฟแสดงแนวโน้ม stock รายเดือน', status: 'match' },
        { id: 'mk-rp-c4', description: 'เปรียบเทียบหลายหมวดหมู่พร้อมกันบนกราฟเดียว', status: 'wrong', note: 'โค้ดทำ: ดูได้ทีละหมวด ยังไม่ overlay หลายหมวด' },
      ]),
      item('mk-rpt-pending', 'รายงานสินค้าที่ใกล้หมดอายุ', 'แสดงรายการสินค้าที่จะหมดอายุภายใน 30 วัน พร้อมจำนวนคงเหลือ', 'pending', 'รายงานสินค้าใกล้หมดอายุภายใน 30 วัน', [
        { id: 'mk-rp-c5', description: 'กรองสินค้าที่หมดอายุภายใน 30 วัน', status: 'missing' },
        { id: 'mk-rp-c6', description: 'แสดงจำนวนคงเหลือและวันหมดอายุ', status: 'missing' },
      ], true),
      item('mk-rpt-noreq', 'Export กราฟเป็นไฟล์รูปภาพ', 'บันทึกกราฟเป็น PNG สำหรับนำไปใช้งาน', 'no-req', null, []),
    ],
  }],
  'จัดการผู้ใช้งาน': [{
    sub: 'สิทธิ์และบัญชีผู้ใช้',
    items: [
      item('mk-usr-done', 'เพิ่มผู้ใช้งานใหม่', 'Admin กรอกชื่อ email และเลือก role ระบบส่ง email ตั้งรหัสผ่านให้ผู้ใช้อัตโนมัติ', 'done', 'Admin เพิ่มผู้ใช้ใหม่และระบบส่ง email ตั้งรหัสผ่าน', [
        { id: 'mk-u-c1', description: 'กรอกชื่อ email และกำหนด role ได้', status: 'match' },
        { id: 'mk-u-c2', description: 'ระบบส่ง email ให้ผู้ใช้ตั้งรหัสผ่านเอง', status: 'match' },
      ]),
      item('mk-usr-wrong', 'กำหนดสิทธิ์การเข้าถึงแต่ละโมดูล', 'กำหนด role ได้แต่ยังไม่สามารถตั้ง permission ระดับ feature', 'incorrect', 'กำหนดสิทธิ์ระดับ feature ต่อผู้ใช้แต่ละคน', [
        { id: 'mk-u-c3', description: 'กำหนด role (Admin/Manager/Staff) ได้', status: 'match' },
        { id: 'mk-u-c4', description: 'ตั้ง permission ระดับ feature ต่อผู้ใช้แต่ละคน', status: 'wrong', note: 'โค้ดทำ: รองรับแค่ role รวม ยังไม่มี feature-level permission' },
      ]),
      item('mk-usr-pending', 'ล็อก account อัตโนมัติหลัง login ผิด 5 ครั้ง', 'นับจำนวนครั้ง login ผิดและล็อก account ชั่วคราว 30 นาที', 'pending', 'ล็อก account อัตโนมัติเมื่อ login ผิดเกินกำหนด', [
        { id: 'mk-u-c5', description: 'นับจำนวน login ผิดต่อเนื่อง', status: 'missing' },
        { id: 'mk-u-c6', description: 'ล็อก account ชั่วคราว 30 นาที หลังผิด 5 ครั้ง', status: 'missing' },
      ], true),
      item('mk-usr-noreq', 'ดูประวัติการ login ของผู้ใช้แต่ละคน', 'Log การ login พร้อม IP และ device', 'no-req', null, []),
    ],
  }],
}
