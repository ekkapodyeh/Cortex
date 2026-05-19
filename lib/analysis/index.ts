import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { createLLMProvider } from '@/lib/llm'
import { cloneAtCommit, collectCodeFiles, cleanup } from './clone'
import { diffFeatures } from './diff'
import { validateFeatures } from './validate'
import type { AnalysisJobPayload, Feature } from '@/lib/types'

export async function runAnalysis(payload: AnalysisJobPayload): Promise<void> {
  const { jobId, projectId, repoUrl, commitSha } = payload
  const llm = createLLMProvider()

  await db.analysisJob.update({ where: { id: jobId }, data: { status: 'RUNNING' } })

  let dir: string | null = null
  try {
    dir = cloneAtCommit(repoUrl, commitSha)
    const code = collectCodeFiles(dir)

    const newFeatures: Feature[] = await llm.extractFeatures(code)

    const lastDoc = await db.knowledgeDoc.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    })
    const oldFeatures: Feature[] = lastDoc ? (lastDoc.features as unknown as Feature[]) : []

    const diff = diffFeatures(oldFeatures, newFeatures)

    const latestReq = await db.documentRequirement.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    })
    const requirements: Feature[] = latestReq ? (latestReq.features as unknown as Feature[]) : []

    const validation = validateFeatures(requirements, newFeatures)

    await db.projectUpdateDoc.create({
      data: {
        jobId,
        projectId,
        featuresNew: newFeatures as unknown as Prisma.InputJsonValue,
        diff: diff as unknown as Prisma.InputJsonValue,
        validation: validation as unknown as Prisma.InputJsonValue,
        status: 'PENDING',
      },
    })

    await db.analysisJob.update({ where: { id: jobId }, data: { status: 'DONE' } })
  } catch (err) {
    await db.analysisJob.update({ where: { id: jobId }, data: { status: 'FAILED' } })
    throw err
  } finally {
    if (dir) cleanup(dir)
  }
}
