import type { Feature, DiffResult } from '@/lib/types'

export function diffFeatures(oldFeatures: Feature[], newFeatures: Feature[]): DiffResult {
  const oldMap = new Map(oldFeatures.map(f => [f.id, f]))
  const newMap = new Map(newFeatures.map(f => [f.id, f]))

  const added: Feature[] = []
  const removed: Feature[] = []
  const modified: DiffResult['modified'] = []

  for (const [id, newFeat] of newMap) {
    if (!oldMap.has(id)) {
      added.push(newFeat)
    } else {
      const oldFeat = oldMap.get(id)!
      if (oldFeat.title !== newFeat.title || oldFeat.description !== newFeat.description) {
        modified.push({ old: oldFeat, new: newFeat })
      }
    }
  }

  for (const [id, oldFeat] of oldMap) {
    if (!newMap.has(id)) removed.push(oldFeat)
  }

  return { added, removed, modified }
}
