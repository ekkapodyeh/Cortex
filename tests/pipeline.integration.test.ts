import { describe, it, expect } from 'vitest'
import { diffFeatures } from '@/lib/analysis/diff'
import { validateFeatures } from '@/lib/analysis/validate'
import type { Feature } from '@/lib/types'

describe('Pipeline integration — diff + validate', () => {
  const f = (id: string, title: string): Feature => ({ id, title, description: title })

  it('full pipeline: new feature added that is not in requirements', () => {
    const oldFeatures = [f('1', 'Login')]
    const newFeatures = [f('1', 'Login'), f('2', 'Export PDF')]
    const requirements = [f('1', 'Login')]

    const diff = diffFeatures(oldFeatures, newFeatures)
    const validation = validateFeatures(requirements, newFeatures)

    expect(diff.added).toHaveLength(1)
    expect(diff.added[0].title).toBe('Export PDF')
    expect(validation.passed).toBe(false)
    expect(validation.extra[0].title).toBe('Export PDF')
  })

  it('full pipeline: requirement not implemented', () => {
    const oldFeatures = [f('1', 'Login')]
    const newFeatures = [f('1', 'Login')]
    const requirements = [f('1', 'Login'), f('2', 'Google Login')]

    const diff = diffFeatures(oldFeatures, newFeatures)
    const validation = validateFeatures(requirements, newFeatures)

    expect(diff.added).toHaveLength(0)
    expect(validation.passed).toBe(false)
    expect(validation.missing[0].title).toBe('Google Login')
  })
})
