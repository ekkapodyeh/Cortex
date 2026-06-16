export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { SubcategoryList } from './SubcategoryList'
import type { SubcategoryGroup } from './SubcategoryList'

const MOCK: SubcategoryGroup = {
  sub: 'ตัวอย่างสถานะ BoltCheck',
  items: [
    {
      id: 'mk-done',
      changeType: 'added' as const,
      oldTitle: null, oldDescription: null,
      newTitle: 'เข้าสู่ระบบด้วย Username/Password',
      newDescription: 'ระบบ login มาตรฐาน รองรับ remember me และ force logout session เก่า',
      impact: null, reqStatus: 'done' as const,
      reqNote: 'ผู้ใช้สามารถเข้าสู่ระบบด้วย Username และ Password ได้',
      reqChangeType: 'add' as const, isSynthetic: false, commits: [], changeTypeMismatchReason: null,
      conditions: [
        { id: 'mk-c1', description: 'ตรวจสอบ Username และ Password กับฐานข้อมูล', status: 'match' as const },
        { id: 'mk-c2', description: 'รองรับ Remember me เก็บ session 30 วัน', status: 'match' as const },
        { id: 'mk-c3', description: 'Force logout session เก่าเมื่อ login ใหม่', status: 'match' as const },
      ],
    },
    {
      id: 'mk-wrong',
      changeType: 'added' as const,
      oldTitle: null, oldDescription: null,
      newTitle: 'ยืนยันตัวตน 2 ขั้นตอน (OTP)',
      newDescription: 'ระบบส่ง OTP ผ่าน SMS แต่ยังไม่รองรับ OTP ผ่าน Email',
      impact: null, reqStatus: 'incorrect' as const,
      reqNote: 'ยืนยันตัวตนด้วย OTP ผ่าน SMS หรือ Email ได้',
      reqChangeType: 'add' as const, isSynthetic: false, commits: [], changeTypeMismatchReason: null,
      conditions: [
        { id: 'mk-c4', description: 'ส่ง OTP ผ่าน SMS ได้', status: 'match' as const },
        { id: 'mk-c5', description: 'ส่ง OTP ผ่าน Email ได้', status: 'wrong' as const, note: 'โค้ดทำ: รองรับเฉพาะ SMS ยังไม่ได้ทำ Email OTP' },
        { id: 'mk-c6', description: 'OTP หมดอายุหลัง 5 นาที', status: 'match' as const },
      ],
    },
    {
      id: 'mk-pending',
      changeType: 'added' as const,
      oldTitle: null, oldDescription: null,
      newTitle: 'Username ไม่สามารถกรอกภาษาไทยได้',
      newDescription: 'Validate ให้ Username รับได้เฉพาะ a-z, 0-9 และ _ เท่านั้น',
      impact: null, reqStatus: 'pending' as const,
      reqNote: 'Username รองรับเฉพาะภาษาอังกฤษและตัวเลข',
      reqChangeType: 'add' as const, isSynthetic: true, commits: [], changeTypeMismatchReason: null,
      conditions: [
        { id: 'mk-c7', description: 'Validate ห้ามกรอก Unicode ภาษาไทยใน Username', status: 'missing' as const },
        { id: 'mk-c8', description: 'แสดง error message "Username ต้องเป็นภาษาอังกฤษเท่านั้น"', status: 'missing' as const },
      ],
    },
    {
      id: 'mk-noreq',
      changeType: 'added' as const,
      oldTitle: null, oldDescription: null,
      newTitle: 'สามารถกดแสดงหรือซ่อนรหัสผ่านได้',
      newDescription: 'ปุ่ม toggle แสดง/ซ่อน password ในช่อง input',
      impact: null, reqStatus: 'no-req' as const,
      reqNote: 'ไม่ได้ระบุใน Requirement',
      reqChangeType: null, isSynthetic: false, commits: [], changeTypeMismatchReason: null,
      conditions: [],
    },
  ],
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cat?: string; sprintId?: string }>
}) {
  const { id } = await params
  const { cat, sprintId } = await searchParams

  const backHref = sprintId
    ? `/projects/${id}/sprint-review/${sprintId}`
    : `/projects/${id}/sprint-review`

  return (
    <div className="pt-[48px] px-[32px] pb-24">
      <div className="max-w-[896px] mx-auto flex flex-col gap-[48px]">
        <div className="flex flex-col gap-3">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <CaretLeftIcon size={12} />
            BoltCheck
          </Link>
          <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">
            {cat ?? 'รายละเอียด'}
          </h2>
        </div>

        <SubcategoryList groups={[MOCK]} hasReq={true} />
      </div>
    </div>
  )
}
