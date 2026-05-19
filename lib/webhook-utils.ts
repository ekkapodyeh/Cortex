import type { Platform } from '@prisma/client'

export async function verifyGithubSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import('crypto')
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export function parseWebhookPayload(
  payload: Record<string, unknown>,
  platform: Platform
): { commitSha: string; commitMsg: string; author: string } {
  if (platform === 'GITHUB') {
    const commit = payload.head_commit as Record<string, unknown>
    return {
      commitSha: payload.after as string,
      commitMsg: commit.message as string,
      author: (commit.author as Record<string, string>).name,
    }
  }
  if (platform === 'GITLAB') {
    const commits = payload.commits as Array<Record<string, unknown>>
    const last = commits[0]
    return {
      commitSha: last.id as string,
      commitMsg: last.message as string,
      author: (last.author as Record<string, string>).name,
    }
  }
  return { commitSha: '', commitMsg: '', author: 'unknown' }
}
