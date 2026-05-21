'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Feature {
  id: string
  title: string
  category?: string
}

interface CategoryGroup {
  category: string
  features: Feature[]
}

interface KnowledgeDocNavProps {
  projectId: string
  groups: CategoryGroup[]
}

export function KnowledgeDocNav({ projectId, groups }: KnowledgeDocNavProps) {
  const pathname = usePathname()
  const overviewHref = `/projects/${projectId}/knowledge`
  const isOverview = pathname === overviewHref

  return (
    <aside className="w-52 shrink-0 border-r border-[var(--border)] py-5 overflow-y-auto">
      <div className="px-3 space-y-0.5">
        <Link
          href={overviewHref}
          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
            isOverview
              ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
          }`}
        >
          Business Overview
        </Link>
      </div>

      <div className="mt-4 px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Content
        </p>
        <div className="space-y-3">
          {groups.map(({ category, features }) => (
            <div key={category}>
              <p className="px-3 py-1 text-xs font-medium text-[var(--text-secondary)] truncate">{category}</p>
              <div className="space-y-0.5">
                {features.map((f) => {
                  const href = `/projects/${projectId}/knowledge/${f.id}`
                  const active = pathname === href
                  return (
                    <Link
                      key={f.id}
                      href={href}
                      className={`block pl-5 pr-3 py-1.5 rounded-md text-xs transition-colors truncate ${
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
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
