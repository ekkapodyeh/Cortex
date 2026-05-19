# Cortex Backend Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้าง backend ของระบบ Cortex ที่รับ git webhook → queue job → analyze โค้ดด้วย LLM → สร้าง diff + validation → expose API ให้ frontend ใช้

**Architecture:** Next.js App Router (full-stack) — webhook receiver เป็น API route, BullMQ + Redis เป็น job queue, separate worker process รัน analysis, Prisma + PostgreSQL เก็บข้อมูล

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, BullMQ, ioredis, Anthropic SDK, vitest, pdf-parse, mammoth (docx), xlsx

---

## File Structure

```
cortex/
├── app/
│   └── api/
│       ├── webhook/route.ts          # รับ git webhook (GitHub/GitLab/Bitbucket)
│       ├── projects/
│       │   ├── route.ts              # GET list, POST create project
│       │   └── [id]/
│       │       ├── route.ts          # GET, PATCH, DELETE project
│       │       ├── jobs/route.ts     # GET analysis jobs for project
│       │       └── knowledge/route.ts # GET knowledge docs, POST approve
│       ├── jobs/
│       │   └── [id]/route.ts        # GET job + update doc status
│       └── requirements/
│           ├── route.ts             # GET requirements for project
│           └── upload/route.ts      # POST upload file → parse features
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── queue.ts                     # BullMQ queue + worker setup
│   ├── llm/
│   │   ├── index.ts                 # LLM abstract interface
│   │   └── claude.ts                # Claude implementation
│   ├── analysis/
│   │   ├── index.ts                 # Main analysis orchestrator
│   │   ├── clone.ts                 # Clone/fetch repo at commit SHA
│   │   ├── extract.ts               # LLM: code → feature list
│   │   ├── diff.ts                  # Compare old vs new features
│   │   └── validate.ts              # Check features vs requirements
│   └── file-parser/
│       ├── index.ts                 # Parse uploaded file → text
│       ├── pdf.ts                   # PDF parser
│       ├── docx.ts                  # DOCX parser
│       └── xlsx.ts                  # XLSX parser
├── workers/
│   └── analysis.ts                  # BullMQ worker (standalone process)
├── prisma/
│   └── schema.prisma
└── tests/
    ├── webhook.test.ts
    ├── diff.test.ts
    ├── validate.test.ts
    ├── file-parser.test.ts
    └── analysis-api.test.ts
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/ekkapodwongthep/Documents/cortex
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: Install backend dependencies**

```bash
npm install @prisma/client @anthropic-ai/sdk bullmq ioredis \
  pdf-parse mammoth xlsx \
  @types/pdf-parse @types/node
npm install -D prisma vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 3: Create `.env.example`**

```bash
# .env.example
DATABASE_URL="postgresql://postgres:password@localhost:5432/cortex"
REDIS_URL="redis://localhost:6379"
ANTHROPIC_API_KEY="sk-ant-..."
WEBHOOK_SECRET="your-webhook-secret"
```

```bash
cp .env.example .env.local
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 5: Add test script to `package.json`**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initial Next.js project setup with dependencies"
```

---

## Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id            String   @id @default(cuid())
  name          String
  repoUrl       String
  platform      Platform
  webhookSecret String
  createdAt     DateTime @default(now())

  requirements  DocumentRequirement[]
  knowledgeDocs KnowledgeDoc[]
  jobs          AnalysisJob[]
}

enum Platform {
  GITHUB
  GITLAB
  BITBUCKET
}

model DocumentRequirement {
  id        String   @id @default(cuid())
  projectId String
  version   Int
  features  Json
  createdBy String
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model KnowledgeDoc {
  id          String   @id @default(cuid())
  projectId   String
  version     Int
  features    Json
  approvedBy  String
  sourceJobId String
  createdAt   DateTime @default(now())

  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceJob AnalysisJob @relation(fields: [sourceJobId], references: [id])
}

model AnalysisJob {
  id          String    @id @default(cuid())
  projectId   String
  commitSha   String
  commitMsg   String
  author      String
  status      JobStatus @default(QUEUED)
  triggeredAt DateTime  @default(now())

  project       Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  updateDoc     ProjectUpdateDoc?
  knowledgeDocs KnowledgeDoc[]
}

enum JobStatus {
  QUEUED
  RUNNING
  DONE
  FAILED
}

model ProjectUpdateDoc {
  id          String    @id @default(cuid())
  jobId       String    @unique
  projectId   String
  featuresNew Json
  diff        Json
  validation  Json
  status      DocStatus @default(PENDING)
  createdAt   DateTime  @default(now())

  job AnalysisJob @relation(fields: [jobId], references: [id])
}

enum DocStatus {
  PENDING
  APPROVED
  REJECTED
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Create Prisma client singleton**

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 5: Commit**

```bash
git add prisma/ lib/db.ts
git commit -m "feat: prisma schema with all core models"
```

---

## Task 3: Shared Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Define shared types**

```typescript
// lib/types.ts
export interface Feature {
  id: string
  title: string
  description: string
  category?: string
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: shared TypeScript types"
```

---

## Task 4: LLM Abstraction Layer

**Files:**
- Create: `lib/llm/index.ts`
- Create: `lib/llm/claude.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/llm.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createLLMProvider } from '@/lib/llm'

describe('LLM provider', () => {
  it('creates a provider instance', () => {
    const provider = createLLMProvider()
    expect(provider).toBeDefined()
    expect(typeof provider.extractFeatures).toBe('function')
    expect(typeof provider.parseDocument).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/llm.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/llm'`

- [ ] **Step 3: Create LLM interface and Claude implementation**

```typescript
// lib/llm/index.ts
import { ClaudeLLMProvider } from './claude'

export interface LLMProvider {
  extractFeatures(code: string): Promise<import('@/lib/types').Feature[]>
  parseDocument(text: string): Promise<import('@/lib/types').Feature[]>
}

export function createLLMProvider(): LLMProvider {
  return new ClaudeLLMProvider()
}
```

```typescript
// lib/llm/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider } from './index'
import type { Feature } from '@/lib/types'

const EXTRACT_PROMPT = `Analyze the following codebase and extract a list of user-facing features.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title (short Thai/English), description (1-2 sentences Thai), category (optional grouping).
Example: [{"id":"uuid","title":"เข้าสู่ระบบด้วย Username/Password","description":"ผู้ใช้สามารถเข้าสู่ระบบด้วย username และ password","category":"การเข้าสู่ระบบ"}]
Respond with ONLY the JSON array, no markdown, no explanation.`

const PARSE_PROMPT = `Extract a feature list from the following document content.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title, description, category (optional).
Respond with ONLY the JSON array, no markdown, no explanation.`

export class ClaudeLLMProvider implements LLMProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async extractFeatures(code: string): Promise<Feature[]> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: EXTRACT_PROMPT,
      messages: [{ role: 'user', content: code.slice(0, 100000) }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return JSON.parse(text)
  }

  async parseDocument(text: string): Promise<Feature[]> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: PARSE_PROMPT,
      messages: [{ role: 'user', content: text.slice(0, 50000) }],
    })
    const out = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return JSON.parse(out)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/llm.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/llm/ tests/llm.test.ts
git commit -m "feat: LLM abstraction layer with Claude implementation"
```

---

## Task 5: Diff Engine

**Files:**
- Create: `lib/analysis/diff.ts`
- Test: `tests/diff.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/diff.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/diff.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/analysis/diff'`

- [ ] **Step 3: Implement diff engine**

```typescript
// lib/analysis/diff.ts
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/diff.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/analysis/diff.ts tests/diff.test.ts
git commit -m "feat: diff engine for comparing feature lists"
```

---

## Task 6: Validation Engine

**Files:**
- Create: `lib/analysis/validate.ts`
- Test: `tests/validate.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/validate.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/validate.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement validation engine**

```typescript
// lib/analysis/validate.ts
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/validate.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/analysis/validate.ts tests/validate.test.ts
git commit -m "feat: validation engine — check features vs requirements"
```

---

## Task 7: File Parser (Document Requirement Upload)

**Files:**
- Create: `lib/file-parser/index.ts`
- Create: `lib/file-parser/pdf.ts`
- Create: `lib/file-parser/docx.ts`
- Create: `lib/file-parser/xlsx.ts`
- Test: `tests/file-parser.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/file-parser.test.ts
import { describe, it, expect } from 'vitest'
import { extractTextFromBuffer } from '@/lib/file-parser'

describe('extractTextFromBuffer', () => {
  it('throws on unsupported file type', async () => {
    const buf = Buffer.from('hello')
    await expect(extractTextFromBuffer(buf, 'image.png')).rejects.toThrow('Unsupported file type')
  })

  it('accepts supported file types without throwing type error', async () => {
    const types = ['test.pdf', 'test.docx', 'test.xlsx', 'test.csv']
    for (const filename of types) {
      const buf = Buffer.from('')
      // empty buffer will fail parsing but not on unsupported type
      await expect(
        extractTextFromBuffer(buf, filename)
      ).rejects.not.toThrow('Unsupported file type')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/file-parser.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement parsers**

```typescript
// lib/file-parser/pdf.ts
import pdfParse from 'pdf-parse'

export async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}
```

```typescript
// lib/file-parser/docx.ts
import mammoth from 'mammoth'

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
```

```typescript
// lib/file-parser/xlsx.ts
import * as XLSX from 'xlsx'

export function parseXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    lines.push(XLSX.utils.sheet_to_csv(sheet))
  }
  return lines.join('\n')
}
```

```typescript
// lib/file-parser/index.ts
import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseXlsx } from './xlsx'

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') return parsePdf(buffer)
  if (ext === 'docx') return parseDocx(buffer)
  if (ext === 'xlsx' || ext === 'xls') return parseXlsx(buffer)
  if (ext === 'csv') return buffer.toString('utf-8')

  throw new Error(`Unsupported file type: .${ext}`)
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/file-parser.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/file-parser/ tests/file-parser.test.ts
git commit -m "feat: file parser supporting PDF, DOCX, XLSX, CSV"
```

---

## Task 8: BullMQ Queue Setup

**Files:**
- Create: `lib/queue.ts`

- [ ] **Step 1: Write queue setup**

```typescript
// lib/queue.ts
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { AnalysisJobPayload } from '@/lib/types'

export const ANALYSIS_QUEUE = 'analysis'

let connection: Redis | null = null

export function getRedis(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  }
  return connection
}

let queue: Queue<AnalysisJobPayload> | null = null

export function getAnalysisQueue(): Queue<AnalysisJobPayload> {
  if (!queue) {
    queue = new Queue<AnalysisJobPayload>(ANALYSIS_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    })
  }
  return queue
}
```

- [ ] **Step 2: Start Redis locally to verify connection**

```bash
# ต้องมี Docker
docker run -d --name cortex-redis -p 6379:6379 redis:7-alpine
```

- [ ] **Step 3: Commit**

```bash
git add lib/queue.ts
git commit -m "feat: BullMQ queue setup with Redis connection"
```

---

## Task 9: Git Webhook API Route

**Files:**
- Create: `app/api/webhook/route.ts`
- Test: `tests/webhook.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/webhook.test.ts
import { describe, it, expect, vi } from 'vitest'
import { verifyGithubSignature, parseWebhookPayload } from '@/app/api/webhook/route'

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
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/webhook.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement webhook route**

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAnalysisQueue } from '@/lib/queue'
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/webhook.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/webhook/ tests/webhook.test.ts
git commit -m "feat: git webhook receiver with HMAC signature verification"
```

---

## Task 10: Analysis Worker

**Files:**
- Create: `workers/analysis.ts`
- Create: `lib/analysis/clone.ts`
- Create: `lib/analysis/extract.ts`
- Create: `lib/analysis/index.ts`

- [ ] **Step 1: Create repo cloner**

```typescript
// lib/analysis/clone.ts
import { execSync } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export function cloneAtCommit(repoUrl: string, commitSha: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'cortex-'))
  execSync(`git clone --depth 50 ${repoUrl} ${dir}`, { stdio: 'pipe' })
  execSync(`git -C ${dir} checkout ${commitSha}`, { stdio: 'pipe' })
  return dir
}

export function collectCodeFiles(dir: string, maxChars = 100000): string {
  const { execSync } = require('child_process')
  const files: string = execSync(
    `find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.java" -o -name "*.js" \\) | grep -v node_modules | grep -v .git | head -100`,
    { encoding: 'utf-8' }
  )
  let result = ''
  for (const file of files.trim().split('\n').filter(Boolean)) {
    try {
      const content = require('fs').readFileSync(file, 'utf-8')
      result += `\n\n// FILE: ${file.replace(dir, '')}\n${content}`
      if (result.length > maxChars) break
    } catch {}
  }
  return result.slice(0, maxChars)
}

export function cleanup(dir: string) {
  rmSync(dir, { recursive: true, force: true })
}
```

- [ ] **Step 2: Create analysis orchestrator**

```typescript
// lib/analysis/index.ts
import { db } from '@/lib/db'
import { createLLMProvider } from '@/lib/llm'
import { cloneAtCommit, collectCodeFiles, cleanup } from './clone'
import { diffFeatures } from './diff'
import { validateFeatures } from './validate'
import type { AnalysisJobPayload, Feature } from '@/lib/types'

export async function runAnalysis(payload: AnalysisJobPayload): Promise<void> {
  const { jobId, projectId, repoUrl, commitSha } = payload
  const llm = createLLMProvider()

  await db.analysisJob.update({ where: { id: jobId }, data: { status: 'RUNNING' } })

  let dir: string | null = null
  try {
    dir = cloneAtCommit(repoUrl, commitSha)
    const code = collectCodeFiles(dir)

    const newFeatures: Feature[] = await llm.extractFeatures(code)

    const lastDoc = await db.knowledgeDoc.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    })
    const oldFeatures: Feature[] = lastDoc ? (lastDoc.features as Feature[]) : []

    const diff = diffFeatures(oldFeatures, newFeatures)

    const latestReq = await db.documentRequirement.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    })
    const requirements: Feature[] = latestReq ? (latestReq.features as Feature[]) : []

    const validation = validateFeatures(requirements, newFeatures)

    await db.projectUpdateDoc.create({
      data: {
        jobId,
        projectId,
        featuresNew: newFeatures,
        diff,
        validation,
        status: 'PENDING',
      },
    })

    await db.analysisJob.update({ where: { id: jobId }, data: { status: 'DONE' } })
  } catch (err) {
    await db.analysisJob.update({ where: { id: jobId }, data: { status: 'FAILED' } })
    throw err
  } finally {
    if (dir) cleanup(dir)
  }
}
```

- [ ] **Step 3: Create worker process**

```typescript
// workers/analysis.ts
import { Worker } from 'bullmq'
import { getRedis, ANALYSIS_QUEUE } from '@/lib/queue'
import { runAnalysis } from '@/lib/analysis'
import type { AnalysisJobPayload } from '@/lib/types'

const worker = new Worker<AnalysisJobPayload>(
  ANALYSIS_QUEUE,
  async (job) => {
    console.log(`[worker] processing job ${job.id} — commit ${job.data.commitSha}`)
    await runAnalysis(job.data)
    console.log(`[worker] done job ${job.id}`)
  },
  { connection: getRedis(), concurrency: 2 }
)

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message)
})

console.log('[worker] analysis worker started')
```

- [ ] **Step 4: Add worker script to `package.json`**

```json
{
  "scripts": {
    "worker": "tsx workers/analysis.ts"
  }
}
```

```bash
npm install -D tsx
```

- [ ] **Step 5: Commit**

```bash
git add lib/analysis/ workers/ 
git commit -m "feat: analysis worker — clone repo, LLM extract, diff, validate"
```

---

## Task 11: Projects API

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[id]/route.ts`
- Create: `app/api/projects/[id]/jobs/route.ts`
- Create: `app/api/projects/[id]/knowledge/route.ts`

- [ ] **Step 1: Project CRUD routes**

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function GET() {
  const projects = await db.project.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const { name, repoUrl, platform } = await req.json()
  const webhookSecret = randomBytes(32).toString('hex')
  const project = await db.project.create({
    data: { name, repoUrl, platform, webhookSecret },
  })
  return NextResponse.json(project, { status: 201 })
}
```

```typescript
// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const project = await db.project.findUnique({ where: { id: params.id } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}
```

- [ ] **Step 2: Jobs list route**

```typescript
// app/api/projects/[id]/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const jobs = await db.analysisJob.findMany({
    where: { projectId: params.id },
    include: { updateDoc: true },
    orderBy: { triggeredAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(jobs)
}
```

- [ ] **Step 3: Knowledge doc routes (approve)**

```typescript
// app/api/projects/[id]/knowledge/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Feature } from '@/lib/types'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const docs = await db.knowledgeDoc.findMany({
    where: { projectId: params.id },
    orderBy: { version: 'desc' },
  })
  return NextResponse.json(docs)
}

// POST: approve a ProjectUpdateDoc → create KnowledgeDoc
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { jobId, approvedBy } = await req.json()

  const updateDoc = await db.projectUpdateDoc.findUnique({ where: { jobId } })
  if (!updateDoc) return NextResponse.json({ error: 'Update doc not found' }, { status: 404 })

  const last = await db.knowledgeDoc.findFirst({
    where: { projectId: params.id },
    orderBy: { version: 'desc' },
  })
  const version = (last?.version ?? 0) + 1

  const [knowledgeDoc] = await db.$transaction([
    db.knowledgeDoc.create({
      data: {
        projectId: params.id,
        version,
        features: updateDoc.featuresNew,
        approvedBy,
        sourceJobId: jobId,
      },
    }),
    db.projectUpdateDoc.update({
      where: { jobId },
      data: { status: 'APPROVED' },
    }),
  ])

  return NextResponse.json(knowledgeDoc, { status: 201 })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/projects/ app/api/jobs/
git commit -m "feat: projects, jobs, and knowledge doc API routes"
```

---

## Task 12: Document Requirement Upload API

**Files:**
- Create: `app/api/requirements/upload/route.ts`
- Create: `app/api/requirements/route.ts`

- [ ] **Step 1: Upload and parse route**

```typescript
// app/api/requirements/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractTextFromBuffer } from '@/lib/file-parser'
import { createLLMProvider } from '@/lib/llm'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const projectId = formData.get('projectId') as string
  const uploadedBy = formData.get('uploadedBy') as string ?? 'PM'

  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and projectId required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const text = await extractTextFromBuffer(buffer, file.name)

  const llm = createLLMProvider()
  const features = await llm.parseDocument(text)

  const last = await db.documentRequirement.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  const version = (last?.version ?? 0) + 1

  const requirement = await db.documentRequirement.create({
    data: { projectId, version, features, createdBy: uploadedBy },
  })

  return NextResponse.json(requirement, { status: 201 })
}
```

```typescript
// app/api/requirements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const requirements = await db.documentRequirement.findMany({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  return NextResponse.json(requirements)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/requirements/
git commit -m "feat: document requirement upload API — parse file with LLM"
```

---

## Task 13: Job Status API + Reject endpoint

**Files:**
- Create: `app/api/jobs/[id]/route.ts`

- [ ] **Step 1: Job status and reject**

```typescript
// app/api/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const job = await db.analysisJob.findUnique({
    where: { id: params.id },
    include: { updateDoc: true },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

// PATCH: reject update doc (PM/BA sends back to dev)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status, comment } = await req.json() // status: 'REJECTED'

  const job = await db.analysisJob.findUnique({
    where: { id: params.id },
    include: { updateDoc: true },
  })
  if (!job?.updateDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.projectUpdateDoc.update({
    where: { jobId: params.id },
    data: { status },
  })

  // TODO Task 14: trigger notification to dev here

  return NextResponse.json({ ok: true, comment })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/jobs/
git commit -m "feat: job status API with reject endpoint"
```

---

## Task 14: Integration Test — Full Pipeline

- [ ] **Step 1: Write integration test**

```typescript
// tests/pipeline.integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All PASS

- [ ] **Step 3: Final commit**

```bash
git add tests/pipeline.integration.test.ts
git commit -m "test: integration test for full diff + validate pipeline"
```

---

## Self-Review Checklist

- [x] Spec § Architecture → Task 8 (Queue), Task 9 (Webhook), Task 10 (Worker)
- [x] Spec § Document Requirement upload → Task 7 (parser), Task 12 (API)
- [x] Spec § Diff Engine → Task 5
- [x] Spec § Validation Engine → Task 6
- [x] Spec § Knowledge Doc approve → Task 11
- [x] Spec § Reject + notify dev → Task 13 (PATCH endpoint, notification stubbed)
- [x] Spec § LLM abstraction → Task 4
- [ ] Notification system → **ยังไม่มี task** (out of scope Plan 1 — ใส่ใน Plan 2 Frontend)

Types used consistently: `Feature`, `DiffResult`, `ValidationResult`, `AnalysisJobPayload` — defined in Task 3 และใช้ตลอดทุก task
