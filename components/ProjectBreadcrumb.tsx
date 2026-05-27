'use client'

import { usePathname } from 'next/navigation'

const PAGE_LABELS: Record<string, string> = {
  'sprint-review': 'Sprint Review',
  'knowledge': 'Knowledge Doc',
  'monitor': 'ประวัติการอัปเดต',
  'requirements': 'Document Requirement',
}

export function ProjectBreadcrumb({ projectName }: { projectName: string }) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const section = segments.find(s => PAGE_LABELS[s])
  const pageLabel = section ? PAGE_LABELS[section] : null

  return (
    <div className="h-[37px] shrink-0 bg-[var(--bg-base)] border-b border-[#242425] flex items-center px-6 gap-1.5">
      <span className="font-['Poppins',_sans-serif] text-xs text-[#757575]">All Project</span>
      <span className="font-['Poppins',_sans-serif] text-sm text-[#757575]">/</span>
      <span className="font-['Poppins',_sans-serif] text-xs text-[#757575]">{projectName}</span>
      {pageLabel && (
        <>
          <span className="font-['Poppins',_sans-serif] text-sm text-[#757575]">/</span>
          <span className="font-['Poppins',_sans-serif] text-xs text-[#757575]">{pageLabel}</span>
        </>
      )}
    </div>
  )
}
