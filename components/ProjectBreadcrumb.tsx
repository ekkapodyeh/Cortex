'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTION_LABELS: Record<string, string> = {
  'knowledge':     'Knowledge Doc',
  'sprint-review': 'Sprint Review',
  'monitor':       'ประวัติการอัปเดต',
  'requirements':  'Document Requirement',
}

const SUB_LABELS: Record<string, string> = {
  'summary': 'สรุปผล',
  'history': 'ประวัติการอัปเดต',
  'detail':  'รายละเอียด',
}

interface BreadcrumbItem {
  label: string
  href?: string
}

export function ProjectBreadcrumb({
  projectId,
  projectName,
  featureMap = {},
}: {
  projectId: string
  projectName: string
  featureMap?: Record<string, string>
}) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const items: BreadcrumbItem[] = [
    { label: 'All Project', href: '/' },
    { label: projectName, href: `/projects/${projectId}/knowledge` },
  ]

  const sectionIdx = segments.findIndex(s => SECTION_LABELS[s])
  if (sectionIdx !== -1) {
    const section = segments[sectionIdx]
    const sectionHref = `/projects/${projectId}/${section}`
    const afterSection = segments[sectionIdx + 1]

    if (afterSection) {
      if (afterSection === 'category') {
        const categoryName = segments[sectionIdx + 2]
          ? decodeURIComponent(segments[sectionIdx + 2])
          : ''
        items.push({ label: SECTION_LABELS[section], href: sectionHref })
        if (categoryName) items.push({ label: categoryName })
      } else if (SUB_LABELS[afterSection]) {
        items.push({ label: SECTION_LABELS[section], href: sectionHref })
        items.push({ label: SUB_LABELS[afterSection] })
      } else {
        const featureTitle = featureMap[afterSection] ?? afterSection
        items.push({ label: SECTION_LABELS[section], href: sectionHref })
        items.push({ label: featureTitle })
      }
    } else {
      items.push({ label: SECTION_LABELS[section] })
    }
  }

  return (
    <div className="h-[37px] shrink-0 bg-[var(--bg-base)] border-b border-[#242425] flex items-center px-6 gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-sm text-[#757575]">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="text-xs text-[#757575] hover:text-[var(--text-primary)] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}
