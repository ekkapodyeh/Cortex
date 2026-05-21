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

const MOCK_INTEGRATIONS = [
  { label: '1. บริการ Authentication', items: ['Firebase Auth', 'Google Sign-In / Sign in with Apple'] },
  { label: '2. ระบบ Cloud & Hosting', items: ['Google Cloud Platform', 'Vercel'] },
  { label: '3. การแจ้งเตือน', items: ['Firebase Cloud Messaging (FCM)', 'SMTP / Email Service'] },
]

export default async function KnowledgeOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  if (!latestDoc) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="text-center">
          <p className="text-[var(--text-muted)] text-lg">ยังไม่มี Knowledge Doc</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Knowledge Doc จะถูกสร้างเมื่อ Approve Project Update Doc แรก
          </p>
        </div>
      </div>
    )
  }

  const features = (latestDoc.features as unknown as Feature[]) ?? []
  const groups = groupByCategory(features)

  return (
    <div className="max-w-3xl mx-auto px-10 py-10">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        Knowledge Doc v{latestDoc.version} · Approved by {latestDoc.approvedBy}
      </p>

      {/* Project description */}
      <div className="mt-5">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          เอกสารรวบรวมข้อมูล feature specification และ business logic ทั้งหมดของ {project.name}
        </p>
        <ul className="mt-3 space-y-1.5">
          {groups.map(({ category, features: fs }) => (
            <li key={category} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
              {category} — {fs.length} feature{fs.length > 1 ? 's' : ''}
            </li>
          ))}
        </ul>
      </div>

      {/* System Structure */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          System Structure and Feature List
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {groups.map(({ category, features: fs }) => (
            <div
              key={category}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4"
            >
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 truncate">
                {category}
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{fs.length}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">features</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Content</h2>
        <div className="space-y-5">
          {groups.map(({ category, features: fs }) => (
            <div key={category}>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                <span className="text-[var(--text-muted)]">▸</span>
                {category}
              </p>
              <div className="ml-4 space-y-0.5">
                {fs.map((f) => (
                  <Link
                    key={f.id}
                    href={`/projects/${id}/knowledge/${f.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <span className="text-xs text-[var(--text-muted)]">→</span>
                    {f.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles & Action */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Roles & Action</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">1. ผู้ใช้งานทั่วไป</p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 space-y-2">
              {features.slice(0, Math.min(5, features.length)).map((f) => (
                <p key={f.id} className="text-sm text-[var(--text-secondary)] flex gap-2">
                  <span className="shrink-0 mt-0.5">•</span>
                  {f.description}
                </p>
              ))}
            </div>
          </div>

          {features.length > 5 && (
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">2. ผู้ดูแลระบบ</p>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 space-y-2">
                {features.slice(5, Math.min(9, features.length)).map((f) => (
                  <p key={f.id} className="text-sm text-[var(--text-secondary)] flex gap-2">
                    <span className="shrink-0 mt-0.5">•</span>
                    {f.description}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* External Integrations */}
      <section className="mt-10 pb-16">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">External Integrations</h2>
        <div className="space-y-4">
          {MOCK_INTEGRATIONS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</p>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-3 space-y-1.5">
                {items.map((item) => (
                  <p key={item} className="text-sm text-[var(--text-secondary)]">• {item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
