import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAnalysisQueue } from '@/lib/queue'
import { verifyGithubSignature, parseWebhookPayload } from '@/lib/webhook-utils'
import type { Platform } from '@prisma/client'

export { verifyGithubSignature, parseWebhookPayload }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const platformHeader = req.headers.get('x-cortex-platform') ?? 'GITHUB'
  const platform = platformHeader as Platform
  const projectId = req.headers.get('x-cortex-project-id')
  const signature =
    req.headers.get('x-hub-signature-256') ??
    req.headers.get('x-gitlab-token') ?? ''

  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 })
  }

  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const valid = await verifyGithubSignature(body, signature, project.webhookSecret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const { commitSha, commitMsg, author } = parseWebhookPayload(payload, platform)

  const job = await db.analysisJob.create({
    data: { projectId, commitSha, commitMsg, author, status: 'QUEUED' },
  })

  await getAnalysisQueue().add('analyze', {
    jobId: job.id,
    projectId,
    repoUrl: project.repoUrl,
    commitSha,
    platform,
  })

  return NextResponse.json({ jobId: job.id }, { status: 202 })
}
