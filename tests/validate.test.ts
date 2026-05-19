import { describe, it, expect } from 'vitest'
import { validateFeatures } from '@/lib/analysis/validate'
import type { Feature } from '@/lib/types'

const f = (id: string, title: string): Feature => ({ id, title, description: `desc ${title}` })

describe('validateFeatures', () => {
  it('passes when all requirements are met', () => {
    const requirements = [f('1', 'Login'), f('2', 'Profile')]
    const actual = [f('1', 'Login'), f('2', 'Profile')]
    const result = validateFeatures(requirements, actual)
    expect(result.passed).toBe(true)
    expect(result.missing).toHaveLength(0)
    expect(result.extra).toHaveLength(0)
  })

  it('detects missing features (in req but not in actual)', () => {
    const requirements = [f('1', 'Login'), f('2', 'Google Login')]
    const actual = [f('1', 'Login')]
    const result = validateFeatures(requirements, actual)
    expect(result.passed).toBe(false)
    expect(result.missing).toHaveLength(1)
    expect(result.missing[0].id).toBe('2')
  })

  it('detects extra features (in actual but not in req)', () => {
    const requirements = [f('1', 'Login')]
    const actual = [f('1', 'Login'), f('2', 'Export PDF')]
    const result = validateFeatures(requirements, actual)
    expect(result.passed).toBe(false)
    expect(result.extra).toHaveLength(1)
    expect(result.extra[0].id).toBe('2')
  })

  it('passes when no requirements exist', () => {
    const result = validateFeatures([], [f('1', 'Login')])
    expect(result.passed).toBe(true)
    expect(result.extra).toHaveLength(0)
  })
})
