import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { KnowledgeDocNav } from '@/components/KnowledgeDocNav'
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

export default async function KnowledgeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  const features = (latestDoc?.features as unknown as Feature[]) ?? []
  const groups = groupByCategory(features)

  return (
    <div className="flex min-h-screen">
      <KnowledgeDocNav projectId={id} groups={groups} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
