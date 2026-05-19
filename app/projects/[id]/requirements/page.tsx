import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { RequirementsPageClient } from './RequirementsPageClient'
import type { Feature } from '@/lib/types'

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const requirements = await db.documentRequirement.findMany({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  const current = requirements[0]
  // Schema field is 'features' (Json) and timestamp is 'createdAt'
  const features = current ? (current.features as unknown as Feature[]) : []

  return (
    <RequirementsPageClient
      projectId={id}
      features={features}
      version={current?.version ?? 0}
      uploadedAt={current?.createdAt ?? null}
    />
  )
}
