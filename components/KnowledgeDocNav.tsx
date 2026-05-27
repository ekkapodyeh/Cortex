'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CaretRightIcon, ClockCounterClockwiseIcon, BookOpenIcon, MonitorIcon } from '@phosphor-icons/react'

interface Feature {
  id: string
  title: string
}

interface SubcategoryGroup {
  subcategory: string
  features: Feature[]
}

interface CategoryGroup {
  category: string
  subcategories: SubcategoryGroup[]
}

interface KnowledgeDocNavProps {
  projectId: string
  groups: CategoryGroup[]
}

function SubcategoryItem({ projectId, subcategory, features }: { projectId: string; subcategory: string; features: Feature[] }) {
  const pathname = usePathname()
  const hasActive = features.some(f => pathname === `/projects/${projectId}/knowledge/${f.id}`)
  const [open, setOpen] = useState(hasActive)

  if (!subcategory) {
    return (
      <>
        {features.map((f) => {
          const href = `/projects/${projectId}/knowledge/${f.id}`
          const active = pathname === href
          return (
            <Link
              key={f.id}
              href={href}
              className={`block pl-5 pr-3 py-2 rounded-lg text-sm transition-colors truncate ${
                active
                  ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {f.title}
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
          hasActive
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        <CaretRightIcon
          size={10}
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
        <span className="truncate">{subcategory}</span>
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {features.map((f) => {
            const href = `/projects/${projectId}/knowledge/${f.id}`
            const active = pathname === href
            return (
              <Link
                key={f.id}
                href={href}
                className={`block pl-8 pr-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  active
                    ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {f.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CategoryItem({ projectId, category, subcategories }: { projectId: string; category: string; subcategories: SubcategoryGroup[] }) {
  const pathname = usePathname()
  const allFeatures = subcategories.flatMap(s => s.features)
  const hasActive = allFeatures.some(f => pathname === `/projects/${projectId}/knowledge/${f.id}`)
  const [open, setOpen] = useState(hasActive)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-left hover:bg-[var(--bg-hover)]"
      >
        <CaretRightIcon
          size={10}
          className={`shrink-0 text-[var(--text-muted)] transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium text-[var(--text-secondary)] truncate">{category}</span>
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5 ml-1">
          {subcategories.map(({ subcategory, features }) => (
            <SubcategoryItem
              key={subcategory || '__no_sub__'}
              projectId={projectId}
              subcategory={subcategory}
              features={features}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function KnowledgeDocNav({ projectId, groups }: KnowledgeDocNavProps) {
  const pathname = usePathname()
  const overviewHref = `/projects/${projectId}/knowledge`
  const sprintHref = `/projects/${projectId}/sprint-review`
  const studioHref = `/studio/${projectId}`

  const isOverview = pathname === overviewHref
  const isSprint = pathname.startsWith(sprintHref)

  return (
    <aside className="w-[280px] shrink-0 border-r border-[var(--border)] py-5 overflow-y-auto">
      {/* Getting Started */}
      <div className="px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Getting Started
        </p>
        <div className="space-y-0.5">
          <Link
            href={overviewHref}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isOverview
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpenIcon size={15} className="shrink-0" />
            Business Overview
          </Link>
          <a
            href={studioHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <MonitorIcon size={15} className="shrink-0" />
            Workspace Studio
          </a>
          <Link
            href={sprintHref}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isSprint
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ClockCounterClockwiseIcon size={15} className="shrink-0" />
            Sprint Review
          </Link>
        </div>
      </div>

      {/* Content */}
      {groups.length > 0 && (
        <div className="mt-5 px-3">
          <p className="px-3 pb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Content
          </p>
          <div className="space-y-1">
            {groups.map(({ category, subcategories }) => (
              <CategoryItem
                key={category}
                projectId={projectId}
                category={category}
                subcategories={subcategories}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
