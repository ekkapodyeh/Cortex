'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlayIcon } from '@phosphor-icons/react'

const MOCK_ITEMS = [
  { id: 'SR001', featureId: 'P001', title: 'เพิ่มรองรับ Multi-Currency', description: 'ระบบต้องรองรับ THB, USD, SGD, MYR พร้อมอัตราแลกเปลี่ยน Real-time', priority: 'high', changeType: 'add' },
  { id: 'SR002', featureId: 'P002', title: 'ปรับปรุง Payment Gateway เป็น Strategy Pattern', description: 'Refactor ให้รองรับ Omise, 2C2P, Stripe พร้อม Retry Logic', priority: 'high', changeType: 'modify' },
  { id: 'SR003', featureId: 'SEC001', title: 'เพิ่มระบบ Webhook Security (HMAC-SHA256)', description: 'Validate Signature ทุก Webhook พร้อมป้องกัน Replay Attack', priority: 'high', changeType: 'add' },
  { id: 'SR004', featureId: 'REF001', title: 'Refactor Notification Service เป็น Queue-based', description: 'ใช้ Bull MQ ส่ง Email/SMS/Push พร้อม Retry อัตโนมัติ', priority: 'medium', changeType: 'modify' },
  { id: 'SR005', featureId: 'FR001', title: 'เพิ่ม Fraud Detection Rule Engine', description: 'ตรวจจับธุรกรรมน่าสงสัยด้วย Rule-based System', priority: 'high', changeType: 'add' },
  { id: 'SR006', featureId: 'P003', title: 'เพิ่มระบบ Installment Payment', description: 'รองรับผ่อนชำระ 3/6/12 เดือนผ่าน KBank และ SCB', priority: 'medium', changeType: 'add' },
  { id: 'SR007', featureId: 'AUD001', title: 'ปรับปรุง Audit Log System', description: 'เพิ่ม Structured Logging (JSON), Export CSV/Excel, Retention 90 วัน', priority: 'low', changeType: 'modify' },
  { id: 'SR008', featureId: 'DEP001', title: 'ยกเลิก Legacy Payment API v1', description: 'ลบ /api/v1/pay endpoint และ LegacyPaymentController', priority: 'low', changeType: 'remove' },
]

interface Props {
  projectId: string
  jobId: string
}

export function TrialUploadButton({ projectId, jobId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleTrial() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    await fetch(`/api/projects/${projectId}/sprint-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        items: MOCK_ITEMS,
        fileName: 'mock-sprint-requirement.txt',
        createdBy: 'BA',
      }),
    })
    router.push(`/projects/${projectId}/sprint-review`)
  }

  return (
    <button
      onClick={handleTrial}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          กำลังโหลด...
        </>
      ) : (
        <>
          <PlayIcon size={14} weight="fill" />
          ทดลอง Sprint Review
        </>
      )}
    </button>
  )
}
