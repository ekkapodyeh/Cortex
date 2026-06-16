'use client'

import { SubcategoryList } from './SubcategoryList'
import type { SubcategoryGroup } from './SubcategoryList'

const AUTH_MOCK: SubcategoryGroup = {
  sub: 'Mock: ตัวอย่างสถานะ BoltCheck',
  items: [
    {
      id: 'mk-done', changeType: 'added', oldTitle: null, oldDescription: null,
      newTitle: 'เข้าสู่ระบบด้วย Username/Password',
      newDescription: 'ระบบ login มาตรฐาน รองรับ remember me และ force logout session เก่า',
      impact: null, reqStatus: 'done', reqNote: 'ผู้ใช้สามารถเข้าสู่ระบบด้วย Username และ Password ได้',
      reqChangeType: 'add', isSynthetic: false, commits: [], changeTypeMismatchReason: null,
      conditions: [
        { id: 'mk-c1', description: 'ตรวจสอบ Username และ Password กับฐานข้อมูล', status: 'match' },
        { id: 'mk-c2', description: 'รองรับ Remember me เก็บ session 30 วัน', status: 'match' },
        { id: 'mk-c3', description: 'Force logout session เก่าเมื่อ login ใหม่', status: 'match' },
      ],
    },
    {
      id: 'mk-wrong', changeType: 'added', oldTitle: null, oldDescription: null,
      newTitle: 'ยืนยันตัวตน 2 ขั้นตอน (OTP)',
      newDescription: 'ระบบส่ง OTP ผ่าน SMS แต่ยังไม่รองรับ OTP ผ่าน Email',
      impact: null, reqStatus: 'incorrect', reqNote: 'ยืนยันตัวตนด้วย OTP ผ่าน SMS หรือ Email ได้',
      reqChangeType: 'add', isSynthetic: false, commits: [], changeTypeMismatchReason: null,
      conditions: [
        { id: 'mk-c4', description: 'ส่ง OTP ผ่าน SMS ได้', status: 'match' },
        { id: 'mk-c5', description: 'ส่ง OTP ผ่าน Email ได้', status: 'wrong', note: 'โค้ดทำ: รองรับเฉพาะ SMS ยังไม่ได้ทำ Email OTP' },
        { id: 'mk-c6', description: 'OTP หมดอายุหลัง 5 นาที', status: 'match' },
      ],
    },
    {
      id: 'mk-pending', changeType: 'added', oldTitle: null, oldDescription: null,
      newTitle: 'Username ไม่สามารถกรอกภาษาไทยได้',
      newDescription: 'Validate ให้ Username รับได้เฉพาะ a-z, 0-9 และ _ เท่านั้น',
      impact: null, reqStatus: 'pending', reqNote: 'Username รองรับเฉพาะภาษาอังกฤษและตัวเลข',
      reqChangeType: 'add', isSynthetic: true, commits: [], changeTypeMismatchReason: null,
      conditions: [
        { id: 'mk-c7', description: 'Validate ห้ามกรอก Unicode ภาษาไทยใน Username', status: 'missing' },
        { id: 'mk-c8', description: 'แสดง error message "Username ต้องเป็นภาษาอังกฤษเท่านั้น"', status: 'missing' },
      ],
    },
    {
      id: 'mk-noreq', changeType: 'added', oldTitle: null, oldDescription: null,
      newTitle: 'สามารถกดแสดงหรือซ่อนรหัสผ่านได้',
      newDescription: 'ปุ่ม toggle แสดง/ซ่อน password ในช่อง input',
      impact: null, reqStatus: 'no-req', reqNote: 'ไม่ได้ระบุใน Requirement',
      reqChangeType: null, isSynthetic: false, commits: [], changeTypeMismatchReason: null,
      conditions: [],
    },
  ],
}

export function MockSection() {
  return <SubcategoryList groups={[AUTH_MOCK]} hasReq={true} />
}
