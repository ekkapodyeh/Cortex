export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Feature } from '@/lib/types'
import { FeatureDetailClient } from './FeatureDetailClient'

function buildUserCases(feature: Feature) {
  return [
    {
      label: `1. ผู้ใช้งานใช้ ${feature.title} สำเร็จ`,
      steps: ['เข้าสู่หน้า', 'กรอกข้อมูล', 'ยืนยัน', 'สำเร็จ'],
    },
    {
      label: `2. ผู้ใช้งานใช้ ${feature.title} ไม่สำเร็จ`,
      steps: ['เข้าสู่หน้า', 'กรอกข้อมูลผิด', 'แสดง Error', 'กลับไปลองใหม่'],
    },
  ]
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string; featureId: string }>
}) {
  const { id, featureId } = await params

  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  if (!latestDoc) notFound()

  const features = (latestDoc.features as unknown as Feature[]) ?? []
  const feature = features.find((f) => f.id === featureId)
  if (!feature) notFound()

  const relatedFeatures = features.filter(
    (f) => f.id !== featureId && f.category === feature.category
  )
  const userCases = buildUserCases(feature)

  return (
    <FeatureDetailClient
      projectId={id}
      feature={feature}
      relatedFeatures={relatedFeatures}
      userCases={userCases}
    />
  )
}
