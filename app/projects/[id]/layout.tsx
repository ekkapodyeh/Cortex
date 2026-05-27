import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { ProjectBreadcrumb } from '@/components/ProjectBreadcrumb'

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-12 shrink-0 bg-[var(--bg-base)] border-b border-[#242425] flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)] text-lg font-bold leading-none">◎</span>
          <span className="font-['Poppins',_sans-serif] font-semibold text-sm text-[var(--text-primary)] tracking-tight">Cortex</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">C</div>
      </header>
      <ProjectBreadcrumb projectName={project.name} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar projectId={id} projectName={project.name} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
