import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { KnowledgeDocNav } from '@/components/KnowledgeDocNav'
import { ProjectBreadcrumb } from '@/components/ProjectBreadcrumb'
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

export default async function ProjectLayout({
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
  const featureMap = Object.fromEntries(features.map(f => [f.id, f.title]))

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="h-12 shrink-0 bg-[var(--bg-base)] border-b border-[#242425] flex items-center justify-between px-6">
        <a href="/">
          <img src="/logo.svg" alt="Cortex" className="h-6" />
        </a>
        <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">C</div>
      </header>
      <ProjectBreadcrumb projectId={id} projectName={project.name} featureMap={featureMap} />

      <div className="flex flex-1 overflow-hidden">
        <KnowledgeDocNav projectId={id} groups={groups} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
