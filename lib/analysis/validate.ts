import type { Feature, ValidationResult } from '@/lib/types'

export function validateFeatures(
  requirements: Feature[],
  actual: Feature[]
): ValidationResult {
  if (requirements.length === 0) {
    return { passed: true, missing: [], extra: [], mismatched: [] }
  }

  const reqMap = new Map(requirements.map(f => [f.id, f]))
  const actualMap = new Map(actual.map(f => [f.id, f]))

  const missing = requirements.filter(r => !actualMap.has(r.id))
  const extra = actual.filter(a => !reqMap.has(a.id))

  return {
    passed: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    mismatched: [],
  }
}
