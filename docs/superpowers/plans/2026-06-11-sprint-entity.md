# Sprint Entity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยน Sprint Review ให้ใช้ Sprint เป็น entity ของตัวเอง แทนการผูก requirement กับ AnalysisJob — รองรับเฉพาะ requirement ประเภท "add" ในรอบนี้

**Architecture:** สร้าง `Sprint` model ใหม่ใน Prisma ที่ผูกกับ Project โดยตรง, `SprintRequirement` เปลี่ยน relation จาก `jobId` → `sprintId`, UI แสดง 3 states (ไม่มี Sprint / OPEN / CLOSED) พร้อม modal สร้าง Sprint

**Tech Stack:** Next.js App Router, Prisma ORM, TypeScript, React, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | เพิ่ม Sprint model, แก้ SprintRequirement relation |
| Create | `app/api/projects/[id]/sprints/route.ts` | GET list + POST create sprint |
| Create | `app/api/projects/[id]/sprints/[sprintId]/route.ts` | PATCH close sprint |
| Create | `app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts` | POST upload requirement |
| Create | `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts` | DELETE requirement |
| Modify | `app/projects/[id]/sprint-review/page.tsx` | ดึง Sprint แทน SprintRequirement |
| Modify | `app/projects/[id]/sprint-review/SprintReviewRightPanel.tsx` | UI 3 states + modal |
| Modify | `app/projects/[id]/sprint-review/SprintReviewClient.tsx` | รับ sprint props ใหม่ |

---

### Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: เพิ่ม Sprint model และแก้ SprintRequirement**

เปิด `prisma/schema.prisma` แล้วทำ 3 อย่าง:

**1a. เพิ่ม enum SprintStatus** (ใส่ต่อจาก enum JobStatus):
```prisma
enum SprintStatus {
  OPEN
  CLOSED
}
```

**1b. เพิ่ม model Sprint** (ใส่ก่อน model SprintRequirement):
```prisma
model Sprint {
  id           String             @id @default(cuid())
  projectId    String
  name         String
  status       SprintStatus       @default(OPEN)
  createdAt    DateTime           @default(now())

  project      Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  requirements SprintRequirement[]
}
```

**1c. แก้ model SprintRequirement** — เปลี่ยน `jobId` เป็น `sprintId`:
```prisma
model SprintRequirement {
  id        String   @id @default(cuid())
  sprintId  String
  projectId String
  items     Json
  fileName  String?
  createdBy String
  createdAt DateTime @default(now())

  sprint    Sprint   @relation(fields: [sprintId], references: [id], onDelete: Cascade)
}
```

**1d. เพิ่ม sprints relation ใน model Project** — หาบรรทัดที่มี `sprintRequirements` แล้วแทนที่ด้วย:
```prisma
  sprints       Sprint[]
```
(ลบบรรทัด `sprintRequirements SprintRequirement[]` ออก)

**1e. ลบ `sprintRequirements SprintRequirement[]` ออกจาก model AnalysisJob**

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-sprint-entity
```

Expected: migration สำเร็จ ไม่มี error

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate
```

Expected: Generated Prisma Client

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add Sprint model and update SprintRequirement relation"
```

---

### Task 2: Sprint API Routes

**Files:**
- Create: `app/api/projects/[id]/sprints/route.ts`
- Create: `app/api/projects/[id]/sprints/[sprintId]/route.ts`

- [ ] **Step 1: สร้าง `app/api/projects/[id]/sprints/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(sprints)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name } = await req.json()

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // ต้องไม่มี OPEN sprint อยู่ก่อน
  const openSprint = await db.sprint.findFirst({ where: { projectId: id, status: 'OPEN' } })
  if (openSprint) return NextResponse.json({ error: 'ปิด Sprint ปัจจุบันก่อน' }, { status: 409 })

  const sprint = await db.sprint.create({
    data: { projectId: id, name },
    include: { requirements: true },
  })
  return NextResponse.json(sprint)
}
```

- [ ] **Step 2: สร้าง `app/api/projects/[id]/sprints/[sprintId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { id, sprintId } = await params
  const { status } = await req.json()

  if (status !== 'CLOSED') return NextResponse.json({ error: 'invalid status' }, { status: 400 })

  const sprint = await db.sprint.findUnique({ where: { id: sprintId } })
  if (!sprint || sprint.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.sprint.update({
    where: { id: sprintId },
    data: { status: 'CLOSED' },
    include: { requirements: true },
  })
  return NextResponse.json(updated)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/projects/
git commit -m "feat: add sprint GET/POST/PATCH API routes"
```

---

### Task 3: SprintRequirement API Routes (ใหม่ ผูกกับ Sprint)

**Files:**
- Create: `app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts`
- Create: `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts`

- [ ] **Step 1: สร้าง `app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { id, sprintId } = await params
  const { items, fileName, createdBy } = await req.json()

  if (!items) return NextResponse.json({ error: 'items required' }, { status: 400 })

  const sprint = await db.sprint.findUnique({ where: { id: sprintId } })
  if (!sprint || sprint.projectId !== id) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
  }

  const req_ = await db.sprintRequirement.create({
    data: {
      sprintId,
      projectId: id,
      items,
      fileName: fileName ?? null,
      createdBy: createdBy ?? 'BA',
    },
  })
  return NextResponse.json(req_)
}
```

- [ ] **Step 2: สร้าง `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string; reqId: string }> }
) {
  const { id, reqId } = await params

  const req = await db.sprintRequirement.findUnique({ where: { id: reqId } })
  if (!req || req.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.sprintRequirement.delete({ where: { id: reqId } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/projects/
git commit -m "feat: add sprint requirement POST/DELETE routes"
```

---

### Task 4: อัปเดต page.tsx

**Files:**
- Modify: `app/projects/[id]/sprint-review/page.tsx`

- [ ] **Step 1: แทนที่ทั้งไฟล์ด้วย content ใหม่**

```typescript
export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { SprintReviewClient } from './SprintReviewClient'
import { MockJobButton } from '@/components/MockJobButton'
import { ResetJobsButton } from '@/components/ResetJobsButton'
import type { DiffResult, Feature } from '@/lib/types'
import { getProjectMock } from '@/lib/sprint-mocks'

export default async function SprintReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const projectMock = getProjectMock(project.name)
  const mockRequirements = projectMock?.requirements ?? []

  const latestJob = await db.analysisJob.findFirst({
    where: { projectId: id, status: 'DONE' },
    orderBy: { triggeredAt: 'desc' },
    include: { updateDoc: true },
  })

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  const allFeatures = (latestDoc?.features as unknown as Feature[]) ?? []

  // ดึง sprints ทั้งหมดของ project
  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'asc' },
  })

  const activeSprint = sprints.find(s => s.status === 'OPEN') ?? null

  const hasPendingDiff = !!latestJob?.updateDoc && latestJob.updateDoc.status === 'PENDING'
  const diffResult: DiffResult = hasPendingDiff
    ? latestJob!.updateDoc!.diff as unknown as DiffResult
    : { added: [], modified: [], removed: [] }

  return (
    <SprintReviewClient
      projectId={id}
      jobId={latestJob?.id ?? ''}
      activeSprint={activeSprint ? {
        id: activeSprint.id,
        name: activeSprint.name,
        status: activeSprint.status,
        requirements: activeSprint.requirements.map(r => ({
          id: r.id,
          fileName: r.fileName ?? null,
          createdBy: r.createdBy,
          items: r.items as unknown as any[],
        })),
      } : null}
      diffResult={diffResult}
      commitSha={latestJob?.commitSha ?? ''}
      commitMsg={latestJob?.commitMsg ?? ''}
      author={latestJob?.author ?? ''}
      triggeredAt={(latestJob?.triggeredAt ?? new Date()).toISOString()}
      mockButton={<MockJobButton projectId={id} />}
      resetButton={<ResetJobsButton projectId={id} />}
      historyHref={`/projects/${id}/sprint-review/history`}
      mockRequirements={mockRequirements}
      allFeatures={allFeatures}
      noDiff={!hasPendingDiff}
    />
  )
}
```

- [ ] **Step 2: ตรวจว่า TypeScript ไม่มี error**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/projects/
git commit -m "feat: update sprint-review page to fetch Sprint entity"
```

---

### Task 5: อัปเดต SprintReviewClient

**Files:**
- Modify: `app/projects/[id]/sprint-review/SprintReviewClient.tsx`

- [ ] **Step 1: อัปเดต types และ Props ใน SprintReviewClient.tsx**

เปลี่ยน interface Props — แทน `sprintDocs: SprintDoc[]` ด้วย `activeSprint`:

```typescript
export interface SprintReqItem {
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add'
  category?: string
  subcategory?: string
}

export interface SprintRequirementDoc {
  id: string
  fileName: string | null
  createdBy: string
  items: SprintReqItem[]
}

export interface ActiveSprint {
  id: string
  name: string
  status: 'OPEN' | 'CLOSED'
  requirements: SprintRequirementDoc[]
}
```

- [ ] **Step 2: แก้ Props interface และ function signature**

แทนที่ `sprintDocs: SprintDoc[]` ด้วย `activeSprint: ActiveSprint | null` ใน Props:

```typescript
interface Props {
  projectId: string
  jobId: string
  diffResult: DiffResult
  activeSprint: ActiveSprint | null
  allFeatures?: Feature[]
  commitSha: string
  commitMsg: string
  author: string
  triggeredAt: string
  mockButton?: React.ReactNode
  resetButton?: React.ReactNode
  historyHref?: string
  noDiff?: boolean
  mockRequirements: SprintReqMockItem[]
}
```

- [ ] **Step 3: แก้ logic ใน function body**

แทนที่ `sprintDocs` ทั้งหมดด้วย `activeSprint`:

```typescript
export function SprintReviewClient({ projectId, jobId, diffResult, activeSprint, allFeatures = [], commitSha, commitMsg, author, triggeredAt, mockButton, resetButton, noDiff, mockRequirements }: Props) {
  const sprintDocs = activeSprint?.requirements ?? []
  const allReqItems = sprintDocs.flatMap(d => d.items)
  const reqMap: Map<string, string> | null = sprintDocs.length > 0
    ? new Map(allReqItems.map((r) => [r.featureId, r.changeType]))
    : null

  // ... ส่วนที่เหลือเหมือนเดิม (items, categoryMap, groups, featureById, diffFeatureIds, pendingByCategory)
```

- [ ] **Step 4: แก้ SprintReviewRightPanel call ใน return**

```typescript
<SprintReviewRightPanel
  projectId={projectId}
  jobId={jobId}
  commitSha={commitSha}
  commitMsg={commitMsg}
  author={author}
  triggeredAt={triggeredAt}
  diffResult={diffResult}
  activeSprint={activeSprint}
  noDiff={noDiff ?? false}
  mockRequirements={mockRequirements}
/>
```

- [ ] **Step 5: ตรวจ TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add app/projects/
git commit -m "feat: update SprintReviewClient to use ActiveSprint type"
```

---

### Task 6: อัปเดต SprintReviewRightPanel — UI 3 States + Modal

**Files:**
- Modify: `app/projects/[id]/sprint-review/SprintReviewRightPanel.tsx`

- [ ] **Step 1: แทนที่ทั้งไฟล์ด้วย content ใหม่**

```typescript
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { DiffResult } from '@/lib/types'
import type { ActiveSprint, SprintReqItem } from './SprintReviewClient'
import { FileIcon, PlayIcon, PresentationChartIcon, XIcon, PlusIcon, LockSimpleIcon } from '@phosphor-icons/react'

// ────────────────────────────────────────────────────────────
// Modal: สร้าง Sprint ใหม่
// ────────────────────────────────────────────────────────────
function CreateSprintModal({
  projectId,
  sprintNumber,
  mockRequirements,
  onClose,
}: {
  projectId: string
  sprintNumber: number
  mockRequirements: SprintReqItem[]
  onClose: () => void
}) {
  const [name, setName] = useState(`Sprint ${sprintNumber}`)
  const [fileName, setFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    setFileName(file.name)
    setProcessing(true)
    // สร้าง sprint ก่อน
    const sprintRes = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!sprintRes.ok) {
      setProcessing(false)
      return
    }
    const sprint = await sprintRes.json()
    // อัปโหลด requirement
    await fetch(`/api/projects/${projectId}/sprints/${sprint.id}/requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: mockRequirements, fileName: file.name, createdBy: 'BA' }),
    })
    router.refresh()
    onClose()
  }

  async function handleTrial() {
    const mockFile = new File(['mock'], 'mock-sprint-requirement.txt', { type: 'text/plain' })
    await handleFile(mockFile)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl p-6 w-[400px] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-[var(--text-primary)]">สร้าง Sprint ใหม่</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors">
            <XIcon size={14} />
          </button>
        </div>

        {/* ชื่อ Sprint */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--text-muted)]">ชื่อ Sprint</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={processing}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          />
        </div>

        {/* Upload zone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--text-muted)]">Requirement File</label>
          {processing ? (
            <div className="border-2 border-dashed border-[var(--border)] rounded-xl px-4 py-5 text-center">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">{fileName} — กำลังประมวลผล...</p>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/40 rounded-xl px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition-colors"
            >
              <FileIcon size={24} className="text-[var(--text-muted)]" />
              <div className="text-center">
                <p className="text-xs font-medium text-[var(--text-primary)]">วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">.pdf, .docx, .txt</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleTrial() }}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <PlayIcon size={11} weight="fill" />
                ทดลองด้วย Mock Data
              </button>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// DocCard: แสดง requirement file
// ────────────────────────────────────────────────────────────
function DocCard({ doc, projectId, sprintId }: { doc: { id: string; fileName: string | null; createdBy: string }; projectId: string; sprintId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/projects/${projectId}/sprints/${sprintId}/requirements/${doc.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-start gap-2">
      <FileIcon size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{doc.fileName ?? 'requirement.pdf'}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">โดย {doc.createdBy}</p>
      </div>
      <button onClick={handleDelete} disabled={deleting} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--status-red)] hover:bg-red-900/10 transition-colors disabled:opacity-40">
        {deleting ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" /> : <XIcon size={12} />}
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main Panel
// ────────────────────────────────────────────────────────────
interface Props {
  projectId: string
  jobId: string
  commitSha: string
  commitMsg: string
  author: string
  triggeredAt: string
  diffResult: DiffResult
  activeSprint: ActiveSprint | null
  noDiff: boolean
  mockRequirements: SprintReqItem[]
}

export function SprintReviewRightPanel({ projectId, jobId, commitSha, commitMsg, author, triggeredAt, diffResult, activeSprint, noDiff, mockRequirements }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [closing, setClosing] = useState(false)
  const router = useRouter()

  const sprintDocs = activeSprint?.requirements ?? []
  const allReqItems = sprintDocs.flatMap(d => d.items)
  const reqMap = new Map(allReqItems.map(r => [r.featureId, r]))
  const hasReq = sprintDocs.length > 0

  const diffFeatureIds = new Set([
    ...(diffResult.added ?? []).map(f => f.id),
    ...(diffResult.modified ?? []).map(c => c.new.id),
    ...(diffResult.removed ?? []).map(f => f.id),
  ])

  type ChangeType = 'added' | 'modified' | 'removed'
  const items = [
    ...(diffResult.added ?? []).map(f => ({ id: f.id, changeType: 'added' as ChangeType, req: reqMap.get(f.id) ?? null })),
    ...(diffResult.modified ?? []).map(c => ({ id: c.new.id, changeType: 'modified' as ChangeType, req: reqMap.get(c.new.id) ?? null })),
    ...(diffResult.removed ?? []).map(f => ({ id: f.id, changeType: 'removed' as ChangeType, req: reqMap.get(f.id) ?? null })),
  ]

  const doneCount = items.filter(i => i.req && i.req.changeType === 'add' && i.changeType === 'added').length
  const partialCount = items.filter(i => i.req && !(i.req.changeType === 'add' && i.changeType === 'added')).length
  const seen = new Set<string>()
  const notDoneCount = allReqItems.filter(r => {
    if (diffFeatureIds.has(r.featureId) || seen.has(r.featureId)) return false
    seen.add(r.featureId)
    return true
  }).length

  const total = doneCount + partialCount + notDoneCount
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const donePct = total > 0 ? (doneCount / total) * 100 : 0
  const partialPct = total > 0 ? (partialCount / total) * 100 : 0

  async function handleCloseSprint() {
    if (!activeSprint) return
    setClosing(true)
    await fetch(`/api/projects/${projectId}/sprints/${activeSprint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    })
    router.refresh()
    setClosing(false)
  }

  // sprintNumber = เพื่อ default ชื่อ modal (ไม่รู้ total จาก panel นี้ → ใช้ activeSprint หรือ 1)
  const nextSprintNumber = activeSprint ? parseInt(activeSprint.name.replace(/\D/g, '') || '1') + 1 : 1

  return (
    <>
      {showModal && (
        <CreateSprintModal
          projectId={projectId}
          sprintNumber={nextSprintNumber}
          mockRequirements={mockRequirements}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="fixed top-[85px] right-0 h-[calc(100vh-85px)] w-[288px] overflow-y-auto pt-6 px-6 pb-8 bg-[var(--bg-sidebar)] border-l border-[var(--border)] z-10 flex flex-col gap-8">

        {/* ── State: ไม่มี Sprint ── */}
        {!activeSprint && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">Sprint</p>
              <p className="text-sm text-[var(--text-muted)]">ยังไม่มี Sprint — สร้างเพื่อเริ่มติดตาม requirement</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <PlusIcon size={16} />
              สร้าง Sprint
            </button>
          </div>
        )}

        {/* ── State: มี Sprint (OPEN หรือ CLOSED) ── */}
        {activeSprint && (
          <div className="flex flex-col gap-6">

            {/* Sprint header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{activeSprint.name}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    activeSprint.status === 'OPEN'
                      ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
                      : 'text-[var(--text-muted)] bg-[var(--bg-hover)]'
                  }`}>
                    {activeSprint.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                {activeSprint.status === 'OPEN' && (
                  <button
                    onClick={handleCloseSprint}
                    disabled={closing}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--status-red)] transition-colors disabled:opacity-40"
                  >
                    <LockSimpleIcon size={12} />
                    {closing ? 'กำลังปิด...' : 'ปิด Sprint'}
                  </button>
                )}
              </div>

              {/* Commit card (ถ้ามี diff) */}
              {!noDiff && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 flex flex-col gap-1.5">
                  <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded self-start">{commitSha.slice(0, 7)}</code>
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">{commitMsg || 'ไม่มี commit message'}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{author} · {new Date(triggeredAt).toLocaleString('th-TH')}</p>
                </div>
              )}
            </div>

            {/* Requirement docs */}
            <div className="flex flex-col gap-2">
              {sprintDocs.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">ยังไม่มี requirement file</p>
              ) : (
                sprintDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} projectId={projectId} sprintId={activeSprint.id} />
                ))
              )}
            </div>

            {/* Progress */}
            {hasReq && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-end justify-between mb-2">
                    <p className="text-xs text-[var(--text-muted)]">ความคืบหน้า</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{pct}<span className="text-xs font-normal text-[var(--text-muted)] ml-0.5">%</span></p>
                  </div>
                  <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[var(--status-green)] transition-all duration-500" style={{ width: `${donePct}%` }} />
                    <div className="h-full bg-[var(--status-yellow)] transition-all duration-500" style={{ width: `${partialPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)]">
                  <div className="py-3 text-center">
                    <p className="text-lg font-bold text-[var(--status-green)]">{doneCount}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">เสร็จแล้ว</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-lg font-bold text-[var(--status-yellow)]">{partialCount}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">ไม่ถูกต้อง</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-lg font-bold text-[var(--status-red)]">{notDoneCount}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">ยังไม่ครบ</p>
                  </div>
                </div>
              </div>
            )}

            {/* ปุ่มสร้าง Sprint ใหม่ (ถ้า CLOSED) */}
            {activeSprint.status === 'CLOSED' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <PlusIcon size={16} />
                สร้าง Sprint ใหม่
              </button>
            )}
          </div>
        )}

        {/* Bottom: สรุปการแก้ไข */}
        {activeSprint?.status === 'OPEN' && (
          noDiff ? (
            <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] text-sm font-medium text-[var(--text-muted)] cursor-not-allowed select-none mt-auto">
              <PresentationChartIcon size={16} />
              สรุปการแก้ไข
            </div>
          ) : (
            <a
              href={`/projects/${projectId}/sprint-review/summary`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity mt-auto"
            >
              <PresentationChartIcon size={16} />
              สรุปการแก้ไข
            </a>
          )
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: ตรวจ TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add app/projects/
git commit -m "feat: update SprintReviewRightPanel with 3-state sprint UI and create modal"
```

---

### Task 7: ทดสอบ Manual และ Cleanup

- [ ] **Step 1: รัน dev server**

```bash
npm run dev
```

- [ ] **Step 2: ทดสอบ State 1 (ไม่มี Sprint)**
  - เปิด `/projects/[id]/sprint-review`
  - ตรวจว่า right panel แสดงปุ่ม "สร้าง Sprint"
  - main content แสดง empty state

- [ ] **Step 3: ทดสอบสร้าง Sprint**
  - กด "สร้าง Sprint" → modal เปิด
  - กด "ทดลองด้วย Mock Data"
  - ตรวจว่า modal ปิด, หน้า refresh, right panel แสดง Sprint name + chip OPEN

- [ ] **Step 4: ทดสอบปิด Sprint**
  - กด "ปิด Sprint"
  - ตรวจว่า chip เปลี่ยนเป็น CLOSED
  - ปุ่ม "สร้าง Sprint ใหม่" โผล่

- [ ] **Step 5: ลบ API route เก่าที่ไม่ใช้แล้ว**

```bash
rm app/api/projects/\[id\]/sprint-requirements/route.ts
rm app/api/projects/\[id\]/sprint-requirements/\[reqId\]/route.ts
```

ตรวจว่าไม่มีที่ไหน import route เก่าอีก:
```bash
grep -r "sprint-requirements" app/ --include="*.ts" --include="*.tsx"
```

Expected: ไม่มี result

- [ ] **Step 6: Final TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: ไม่มี error

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated sprint-requirements API routes"
```
