'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MagnifyingGlassIcon, BookOpenIcon, ClockCounterClockwiseIcon } from '@phosphor-icons/react'

interface SidebarProps {
  projectId: string
  projectName?: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

export function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname()

  const sprintBase = `/projects/${projectId}/sprint-review`

  const navItems: NavItem[] = [
    { label: 'Sprint Review',        href: sprintBase,                                icon: MagnifyingGlassIcon },
    { label: 'Knowledge Doc',        href: `/projects/${projectId}/knowledge`,         icon: BookOpenIcon },
    { label: 'ประวัติการอัปเดต',     href: `${sprintBase}/history`,                   icon: ClockCounterClockwiseIcon },
  ]

  const isActive = (href: string) => {
    if (href === sprintBase) {
      return pathname.startsWith(href) && !pathname.startsWith(`${sprintBase}/history`)
    }
    if (href === `/projects/${projectId}`) return pathname === `/projects/${projectId}`
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-[280px] h-full sticky top-0 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col shrink-0 overflow-y-auto">
      <nav className="flex-1 px-4 pt-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-[10px] rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[var(--bg-base)] text-[var(--brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
