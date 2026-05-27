import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { StudioSidebar } from '@/components/StudioSidebar'

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

function getProjectIcon(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PROJECT_ICONS[hash % PROJECT_ICONS.length]
}

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      <StudioSidebar projectId={id} projectName={project.name} iconUrl={getProjectIcon(id)} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
