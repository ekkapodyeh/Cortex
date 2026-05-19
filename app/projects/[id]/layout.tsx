import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

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
    <div className="flex min-h-screen">
      <Sidebar projectId={id} projectName={project.name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
