import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Feature } from '@/lib/types'

function groupByCategory(features: Feature[]) {
  const map = new Map<string, Feature[]>()
  for (const f of features) {
    const cat = f.category ?? 'ทั่วไป'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(f)
  }
  return Array.from(map.entries()).map(([category, features]) => ({ category, features }))
}

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

  const groups = groupByCategory(features)
  const relatedFeatures = features.filter(
    (f) => f.id !== featureId && f.category === feature.category
  )
  const userCases = buildUserCases(feature)

  return (
    <div className="max-w-3xl mx-auto px-10 py-10">
      {/* Breadcrumb */}
      <p className="text-xs text-[var(--text-muted)] mb-5 flex items-center gap-1.5">
        <Link href={`/projects/${id}/knowledge`} className="hover:text-[var(--text-primary)] transition-colors">
          Business Overview
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{feature.category}</span>
        <span>/</span>
        <span className="text-[var(--text-primary)]">{feature.title}</span>
      </p>

      {/* Title */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{feature.title}</h1>

      {/* Tabs */}
      <div className="flex gap-0 mt-5 border-b border-[var(--border)]">
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px">
          <span className="text-[10px]">🟠</span> Business
        </button>
        <button className="px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1.5">
          <span className="text-[10px]">📋</span> Technical
        </button>
      </div>

      {/* Item details */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Item details</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[180px_1fr] border-b border-[var(--border)] bg-[var(--bg-hover)]">
            <p className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Field name</p>
            <p className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Validations</p>
          </div>
          <div className="grid grid-cols-[180px_1fr]">
            <div className="px-5 py-4 border-r border-[var(--border)]">
              <span className="inline-block text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)] px-2.5 py-1 rounded font-mono">
                {feature.id}
              </span>
            </div>
            <div className="px-5 py-4 space-y-1.5">
              <p className="text-sm text-[var(--text-secondary)] flex gap-2">
                <span className="shrink-0">•</span> {feature.description}
              </p>
              <p className="text-sm text-[var(--text-muted)] flex gap-2">
                <span className="shrink-0">•</span> จำเป็นต้องระบุ (Required)
              </p>
              <p className="text-sm text-[var(--text-muted)] flex gap-2">
                <span className="shrink-0">•</span> ความยาวไม่เกิน 255 ตัวอักษร
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Conditions */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Feature Conditions</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{feature.title}</p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">เงื่อนไขเพิ่มเติม</p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 space-y-1.5">
              <p className="text-sm text-[var(--text-secondary)]">• ผู้ใช้ต้องล็อกอินก่อนเข้าถึง feature นี้</p>
              <p className="text-sm text-[var(--text-secondary)]">• ระบบต้องรองรับ session ที่ยังไม่หมดอายุ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles & Action */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Roles & Action</h2>
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">1. ผู้ใช้งานทั่วไป</p>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 space-y-1.5">
            <p className="text-sm text-[var(--text-secondary)] flex gap-2">
              <span className="shrink-0">•</span>
              เข้าถึงและใช้งาน {feature.title}
            </p>
            <p className="text-sm text-[var(--text-secondary)] flex gap-2">
              <span className="shrink-0">•</span>
              {feature.description}
            </p>
            <p className="text-sm text-[var(--text-secondary)] flex gap-2">
              <span className="shrink-0">•</span>
              แก้ไขข้อมูลส่วนตัวที่เกี่ยวข้องกับ feature นี้ได้
            </p>
          </div>
        </div>
      </section>

      {/* User Case */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">User Case</h2>
        <div className="space-y-3">
          {userCases.map(({ label, steps }) => (
            <div
              key={label}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4"
            >
              <p className="text-sm text-[var(--text-secondary)] mb-3">{label}</p>
              <div className="flex flex-wrap gap-2">
                {steps.map((step, i) => (
                  <span
                    key={i}
                    className="text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border)] px-3 py-1.5 rounded-full"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connections */}
      {relatedFeatures.length > 0 && (
        <section className="mt-8 pb-16">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Connections to Other Related Features
          </h2>
          <div className="space-y-2">
            {relatedFeatures.map((f) => (
              <p key={f.id} className="text-sm text-[var(--text-secondary)] flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  <Link
                    href={`/projects/${id}/knowledge/${f.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {f.title}
                  </Link>
                  {' — '}
                  {f.description}
                </span>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
