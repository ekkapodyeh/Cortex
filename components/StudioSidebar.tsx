'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HouseIcon,
  BrowserIcon,
  CodeIcon,
  TableIcon,
  NewspaperIcon,
  ListNumbersIcon,
  DatabaseIcon,
  BellIcon,
  UserIcon,
  CaretRightIcon,
} from '@phosphor-icons/react'

interface StudioSidebarProps {
  projectId: string
  projectName: string
  iconUrl?: string
}

const STUDIO_NAV = [
  { id: 'home',        label: 'Home',             icon: HouseIcon,       href: (id: string) => `/studio/${id}` },
  { id: 'cortex-sa',  label: 'Cortex SA',         icon: BrowserIcon,     href: (id: string) => `/studio/${id}/cortex-sa`,  badge: 'BETA' },
  { id: 'ai-code',    label: 'AI Code',            icon: CodeIcon,        href: (id: string) => `/studio/${id}/ai-code` },
]

const STUDIO_TOOLS = [
  { id: 'db-schemas',    label: 'Database Schemas', icon: DatabaseIcon },
  { id: 'api-spec',      label: 'API Spec',          icon: NewspaperIcon },
  { id: 'functional',    label: 'Functional List',   icon: ListNumbersIcon },
  { id: 'master-data',   label: 'Master Data',       icon: TableIcon },
]

export function StudioSidebar({ projectId, projectName, iconUrl }: StudioSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || (href !== `/studio/${projectId}` && pathname.startsWith(href))

  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--border)] flex flex-col h-full bg-[var(--bg-sidebar)]">
      {/* Project header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0 overflow-hidden">
          {iconUrl
            ? <img src={iconUrl} alt={projectName} className="w-6 h-6 object-contain" />
            : <span className="text-white text-sm font-semibold">{projectName.charAt(0).toUpperCase()}</span>
          }
        </div>
        <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
          {projectName}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {STUDIO_NAV.map(({ id, label, icon: Icon, href, badge }) => {
          const active = isActive(href(projectId))
          return (
            <Link
              key={id}
              href={href(projectId)}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-semibold text-white bg-[var(--accent)] px-1.5 py-0.5 rounded-full leading-none">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Tools section */}
        <div className="mt-3 mb-1 px-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Tools</p>
        </div>
        {STUDIO_TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] w-full text-left"
          >
            <Icon size={18} className="shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] px-2 py-2 flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors w-full">
          <BellIcon size={18} className="shrink-0" />
          <span className="flex-1 text-left">Inbox</span>
          <span className="text-[10px] font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded-full leading-none">2</span>
        </button>
        <button className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors w-full">
          <UserIcon size={18} className="shrink-0" />
          <span className="flex-1 text-left truncate text-xs">claude@quackbase.co</span>
          <CaretRightIcon size={14} className="shrink-0" />
        </button>
      </div>
    </aside>
  )
}
