export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ReviewClient } from './ReviewClient'
import type { Feature, ValidationResult, DiffResult } from '@/lib/types'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string }>
}) {
  const { id, jobId } = await params

  const job = await db.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      updateDoc: true,
      project: {
        include: {
          knowledgeDocs: { orderBy: { version: 'desc' }, take: 1 },
          requirements: { orderBy: { version: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!job || job.projectId !== id) notFound()
  if (!job.updateDoc) notFound()

  const latestKnowledgeDoc = job.project.knowledgeDocs[0]
  const requirements = job.project.requirements[0]

  const oldFeatures = (latestKnowledgeDoc?.features as unknown as Feature[]) ?? []
  const newFeatures = (job.updateDoc.featuresNew as unknown as Feature[]) ?? []
  const validationResult = job.updateDoc.validation as unknown as ValidationResult | null
  const diffResult = job.updateDoc.diff as unknown as DiffResult | null
  const requirementFeatures = (requirements?.features as unknown as Feature[]) ?? []

  return (
    <ReviewClient
      jobId={jobId}
      projectId={id}
      oldFeatures={oldFeatures}
      newFeatures={newFeatures}
      requirementFeatures={requirementFeatures}
      validationResult={validationResult}
      diffResult={diffResult}
      updateDocStatus={job.updateDoc.status as string}
      commitSha={job.commitSha}
      commitMsg={job.commitMsg ?? ''}
    />
  )
}
