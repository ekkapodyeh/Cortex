import { describe, it, expect } from 'vitest'
import { diffFeatures } from '@/lib/analysis/diff'
import type { Feature } from '@/lib/types'

const f = (id: string, title: string): Feature => ({
  id, title, description: `desc ${title}`
})

describe('diffFeatures', () => {
  it('detects added features', () => {
    const result = diffFeatures([f('1', 'Login')], [f('1', 'Login'), f('2', 'Export PDF')])
    expect(result.added).toHaveLength(1)
    expect(result.added[0].id).toBe('2')
    expect(result.removed).toHaveLength(0)
    expect(result.modified).toHaveLength(0)
  })

  it('detects removed features', () => {
    const result = diffFeatures([f('1', 'Login'), f('2', 'SMS')], [f('1', 'Login')])
    expect(result.removed).toHaveLength(1)
    expect(result.removed[0].id).toBe('2')
  })

  it('detects modified features (same id, different content)', () => {
    const old = [{ id: '1', title: 'Login', description: 'basic login' }] as Feature[]
    const next = [{ id: '1', title: 'Login', description: 'login with OTP support' }] as Feature[]
    const result = diffFeatures(old, next)
    expect(result.modified).toHaveLength(1)
    expect(result.modified[0].old.description).toBe('basic login')
  })

  it('returns empty diff for identical lists', () => {
    const features = [f('1', 'Login'), f('2', 'Profile')]
    const result = diffFeatures(features, features)
    expect(result.added).toHaveLength(0)
    expect(result.removed).toHaveLength(0)
    expect(result.modified).toHaveLength(0)
  })
})
