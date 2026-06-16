export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  headers?: Record<string, string>
  requestBody?: string
  response?: string
}

export interface DatabaseColumn {
  name: string
  type: string
  description: string
  primaryKey?: boolean
}

export interface DatabaseTable {
  name: string
  description?: string
  columns: DatabaseColumn[]
}

export interface PageSpec {
  name: string
  path: string
  endpoints: Array<{ method: string; path: string }>
  description: string
}

export interface TechnicalSpec {
  sequenceDiagram?: string
  apiEndpoints?: APIEndpoint[]
  databaseTables?: DatabaseTable[]
  pages?: PageSpec[]
}

export interface Feature {
  id: string
  title: string
  description: string
  category?: string
  subcategory?: string
  flowDiagram?: string
  technicalSpec?: TechnicalSpec
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

export interface Condition {
  id: string
  description: string
}

export type ConditionStatus = 'match' | 'wrong' | 'missing' | 'extra'

export interface ConditionResult {
  id: string
  description: string
  status: ConditionStatus
  note?: string
}

export interface AnalysisJobPayload {
  jobId: string
  projectId: string
  repoUrl: string
  commitSha: string
  platform: 'GITHUB' | 'GITLAB' | 'BITBUCKET'
}
