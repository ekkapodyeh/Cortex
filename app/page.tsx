export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import Link from 'next/link'
import { SeedButton } from '@/components/SeedButton'

const PROJECT_ICONS = [
  '/project-icons/Group 1000004413.svg',
  '/project-icons/Group 1000004414.svg',
  '/project-icons/Group 1000004415.svg',
  '/project-icons/Group 1000004418.svg',
  '/project-icons/Group 1000004419.svg',
  '/project-icons/Group 1000004420.svg',
  '/project-icons/Group 1000004422.svg',
  '/project-icons/Group 1000004423.svg',
]

function getProjectIcon(index: number) {
  return PROJECT_ICONS[index % PROJECT_ICONS.length]
}

export default async function RootPage() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true },
  })

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      <header className="h-12 shrink-0 bg-[var(--bg-base)] border-b border-[#242425] flex items-center justify-between px-6">
        <a href="/">
          <img src="/logo.svg" alt="Cortex" className="h-6"  />
        </a>
        <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">C</div>
      </header>

      <div className="pt-16 pb-24 px-6 flex justify-center">
        <div className="w-full max-w-[928px]">
          <div className="flex flex-col gap-8">
            <h1 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">
              All Projects
            </h1>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <p className="text-sm text-[var(--text-muted)]">ยังไม่มีโปรเจกต์ในระบบ</p>
                <SeedButton />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/knowledge`}
                    className="bg-[#1b1b1b] border border-[#343232] rounded-xl p-5 hover:border-[var(--accent)]/50 transition-colors"
                  >
                    <div className="flex flex-col gap-4">
                      <img
                        src={getProjectIcon(index)}
                        alt={project.name}
                        className="w-10 h-10 rounded-lg object-contain shrink-0"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-base text-[var(--text-primary)]">
                          {project.name}
                        </span>
                        <span className="text-xs text-[#757575]">
                          Created {new Date(project.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
