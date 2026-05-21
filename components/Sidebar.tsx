'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SquaresFourIcon, LightningIcon, MagnifyingGlassIcon, BookOpenIcon, ClipboardTextIcon } from '@phosphor-icons/react'

interface SidebarProps {
  projectId: string
  projectName: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: 'Dashboard',            href: `/projects/${projectId}`,               icon: <SquaresFourIcon size={18} /> },
    { label: 'งานวิเคราะห์',         href: `/projects/${projectId}/monitor`,        icon: <LightningIcon size={18} /> },
    { label: 'Sprint Review',        href: `/projects/${projectId}/sprint-review`,  icon: <MagnifyingGlassIcon size={18} /> },
    { label: 'Knowledge Doc',        href: `/projects/${projectId}/knowledge`,      icon: <BookOpenIcon size={18} /> },
    { label: 'Document Requirement', href: `/projects/${projectId}/requirements`,   icon: <ClipboardTextIcon size={18} /> },
  ]

  const isActive = (href: string) => {
    if (href === `/projects/${projectId}`) return pathname === `/projects/${projectId}`
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 h-screen sticky top-0 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col shrink-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <Link href="/" className="text-[var(--text-primary)] font-semibold text-lg tracking-tight hover:text-[var(--accent)] transition-colors">
          Cortex
        </Link>
      </div>

      <div className="px-5 py-4 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">โปรเจกต์</p>
        <p className="text-sm text-[var(--text-primary)] font-medium truncate">{projectName}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

    </aside>
  )
}
