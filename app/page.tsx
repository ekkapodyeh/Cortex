import { db } from '@/lib/db'
import Link from 'next/link'
import { ProjectCard } from '@/components/ProjectCard'

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { jobs: true } } },
  })

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Cortex</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">ระบบบริหารความรู้จากโค้ด</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + เพิ่มโปรเจกต์
        </Link>
      </header>

      <div className="px-8 py-6">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)] text-lg">ยังไม่มีโปรเจกต์</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">เริ่มต้นโดยการเพิ่มโปรเจกต์ใหม่</p>
            <Link
              href="/projects/new"
              className="inline-block mt-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + เพิ่มโปรเจกต์แรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
