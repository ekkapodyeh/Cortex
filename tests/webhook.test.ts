import { describe, it, expect } from 'vitest'
import { verifyGithubSignature, parseWebhookPayload } from '@/lib/webhook-utils'

describe('verifyGithubSignature', () => {
  it('returns true for valid signature', async () => {
    const secret = 'mysecret'
    const body = JSON.stringify({ ref: 'refs/heads/main' })
    const crypto = await import('crypto')
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
    expect(await verifyGithubSignature(body, sig, secret)).toBe(true)
  })

  it('returns false for invalid signature', async () => {
    expect(await verifyGithubSignature('body', 'sha256=invalid', 'secret')).toBe(false)
  })

  it('returns false for empty signature', async () => {
    expect(await verifyGithubSignature('body', '', 'secret')).toBe(false)
  })
})

describe('parseWebhookPayload', () => {
  it('extracts commit info from GitHub push payload', () => {
    const payload = {
      after: 'abc123',
      head_commit: { message: 'feat: add login', author: { name: 'Alice' } },
    }
    const result = parseWebhookPayload(payload, 'GITHUB')
    expect(result.commitSha).toBe('abc123')
    expect(result.commitMsg).toBe('feat: add login')
    expect(result.author).toBe('Alice')
  })

  it('extracts commit info from GitLab push payload', () => {
    const payload = {
      commits: [
        {
          id: 'def456',
          message: 'fix: resolve bug',
          author: { name: 'Bob' },
        },
      ],
    }
    const result = parseWebhookPayload(payload, 'GITLAB')
    expect(result.commitSha).toBe('def456')
    expect(result.commitMsg).toBe('fix: resolve bug')
    expect(result.author).toBe('Bob')
  })

  it('returns default values for unknown platform', () => {
    const payload = { after: 'xyz789' }
    const result = parseWebhookPayload(payload, 'BITBUCKET')
    expect(result.commitSha).toBe('')
    expect(result.commitMsg).toBe('')
    expect(result.author).toBe('unknown')
  })
})
