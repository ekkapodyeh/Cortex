export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SeedButton } from '@/components/SeedButton'
import { BrainIcon } from '@phosphor-icons/react/dist/ssr'

export default async function RootPage() {
  const project = await db.project.findFirst({
    where: { name: 'ระบบสต็อกสินค้า' },
  })

  if (project) redirect(`/projects/${project.id}`)

  const fallback = await db.project.findFirst({ orderBy: { createdAt: 'asc' } })
  if (fallback) redirect(`/projects/${fallback.id}`)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
      <div className="text-center">
        <BrainIcon size={28} className="text-[var(--accent)] mx-auto mb-2" />
        <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Cortex</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">ยังไม่มีข้อมูลในระบบ</p>
        <SeedButton />
      </div>
    </div>
  )
}
