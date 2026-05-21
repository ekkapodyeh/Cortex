export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const project = await db.project.findFirst({
    where: { name: 'ระบบสต็อกสินค้า' },
  })

  if (project) redirect(`/projects/${project.id}`)

  const fallback = await db.project.findFirst({ orderBy: { createdAt: 'asc' } })
  if (fallback) redirect(`/projects/${fallback.id}`)

  redirect('/projects')
}
