export interface Feature {
  id: string
  title: string
  description: string
  category?: string
  subcategory?: string
}

export interface FeatureChange {
  old: Feature
  new: Feature
}

export interface DiffResult {
  added: Feature[]
  removed: Feature[]
  modified: FeatureChange[]
}

export interface ValidationIssue {
  requirement: Feature
  actual: Feature
  reason: string
}

export interface ValidationResult {
  passed: boolean
  missing: Feature[]
  extra: Feature[]
  mismatched: ValidationIssue[]
}

export interface AnalysisJobPayload {
  jobId: string
  projectId: string
  repoUrl: string
  commitSha: string
  platform: 'GITHUB' | 'GITLAB' | 'BITBUCKET'
}
