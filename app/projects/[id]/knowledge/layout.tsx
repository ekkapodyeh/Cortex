import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { KnowledgeDocNav } from '@/components/KnowledgeDocNav'
import type { Feature } from '@/lib/types'

function groupByCategory(features: Feature[]) {
  const catMap = new Map<string, Map<string, Feature[]>>()
  for (const f of features) {
    const cat = f.category ?? 'ทั่วไป'
    const sub = f.subcategory ?? ''
    if (!catMap.has(cat)) catMap.set(cat, new Map())
    if (!catMap.get(cat)!.has(sub)) catMap.get(cat)!.set(sub, [])
    catMap.get(cat)!.get(sub)!.push(f)
  }
  return Array.from(catMap.entries()).map(([category, subMap]) => ({
    category,
    subcategories: Array.from(subMap.entries()).map(([subcategory, features]) => ({ subcategory, features })),
  }))
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
