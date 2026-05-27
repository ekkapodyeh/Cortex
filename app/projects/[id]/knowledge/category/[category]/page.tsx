export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRightIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/dist/ssr'
import { CategoryDiagramViewer } from '@/components/CategoryDiagramViewer'
import type { Feature } from '@/lib/types'

export default async function CategoryOverviewPage({
  params,
}: {
  params: Promise<{ id: string; category: string }>
}) {
  const { id, category: categoryParam } = await params
  const category = decodeURIComponent(categoryParam)

  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  if (!latestDoc) notFound()

  const features = (latestDoc.features as unknown as Feature[]) ?? []
  const categoryFeatures = features.filter((f) => (f.category ?? 'ทั่วไป') === category)
  if (categoryFeatures.length === 0) notFound()

  const flowDiagram = categoryFeatures.find((f) => f.flowDiagram)?.flowDiagram ?? null

  // Build category list for prev/next navigation
  const categoryOrder: string[] = []
  for (const f of features) {
    const c = f.category ?? 'ทั่วไป'
    if (!categoryOrder.includes(c)) categoryOrder.push(c)
  }
  const idx = categoryOrder.indexOf(category)
  const prevCategory = idx > 0 ? categoryOrder[idx - 1] : null
  const nextFeature = categoryFeatures[0]

  const prevHref = prevCategory
    ? `/projects/${id}/knowledge/category/${encodeURIComponent(prevCategory)}`
    : `/projects/${id}/knowledge`
  const prevLabel = prevCategory ?? 'Business Overview'

  return (
    <div className="pt-[48px] px-[32px] pb-24">
      <div className="max-w-[896px] mx-auto flex flex-col gap-[48px]">
        {/* Title */}
        <h1 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">
          {category}
        </h1>

        {/* Feature Overview & How It Works */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">
            Feature Overview & How It Works
          </h2>
          <CategoryDiagramViewer
            projectId={id}
            category={category}
            initialDiagram={flowDiagram}
          />
        </section>

        {/* Content */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">Content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryFeatures.map((f) => (
              <Link
                key={f.id}
                href={`/projects/${id}/knowledge/${f.id}`}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 flex items-center justify-between gap-3 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span className="text-sm text-[var(--text-secondary)] truncate">{f.title}</span>
                <ArrowUpRightIcon size={16} className="text-[var(--text-muted)] shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Prev / Next nav */}
        <nav className="flex items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
          <Link
            href={prevHref}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-w-0"
          >
            <CaretLeftIcon size={14} className="shrink-0" />
            <span className="truncate">{prevLabel}</span>
          </Link>
          {nextFeature && (
            <Link
              href={`/projects/${id}/knowledge/${nextFeature.id}`}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-w-0"
            >
              <span className="truncate">{nextFeature.title}</span>
              <CaretRightIcon size={14} className="shrink-0" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
