# Story Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ระบบ split requirement story อัตโนมัติเมื่อ AI วิเคราะห์ไฟล์ และให้ user แก้ไข/split story ใน UI ได้

**Architecture:** 3 ส่วนอิสระ — (1) ปรับ AI prompt ให้ split story อัตโนมัติ, (2) เพิ่ม PATCH API สำหรับแก้ไข items ใน SprintRequirement, (3) เพิ่ม UI edit/split บน story ใน RightPanel

**Tech Stack:** Next.js App Router, Prisma, Anthropic SDK, React (client component)

---

## Files

| Action | File |
|--------|------|
| Modify | `lib/llm/claude.ts` — ปรับ PARSE_PROMPT และ EXTRACT_PROMPT |
| Modify | `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts` — เพิ่ม PATCH |
| Modify | `app/projects/[id]/sprint-review/SprintReviewRightPanel.tsx` — UI edit/split |
| Modify | `app/projects/[id]/sprint-review-v1/SprintReviewRightPanel.tsx` — UI edit/split (mirror) |

---

## Task 1: ปรับ AI Prompt ให้ split story อัตโนมัติ

**Files:**
- Modify: `lib/llm/claude.ts`

กฎที่ต้องเพิ่ม: 1 feature = 1 atomic user action (Subject + Verb + Object เดียว) — ถ้าประโยคมีหลาย action เชื่อมด้วย "พร้อม / และ / หรือ / also / and / or" ให้ split เป็นหลาย feature

- [ ] **Step 1: แก้ PARSE_PROMPT และ EXTRACT_PROMPT**

แก้ไฟล์ `lib/llm/claude.ts`:

```typescript
const EXTRACT_PROMPT = `Analyze the following codebase and extract a list of user-facing features.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title (short Thai/English), description (1-2 sentences Thai), category (optional grouping), subcategory (optional sub-grouping).

CRITICAL RULES for splitting features:
- 1 feature = 1 atomic user action (one Subject + one Verb + one Object)
- If a sentence contains multiple actions joined by "พร้อม", "และ", "หรือ", "and", "or", "also", "as well as" — split into SEPARATE features
- BAD: "ผู้ใช้เข้าสู่ระบบด้วย Username/Password พร้อม Remember Me ได้"
- GOOD: ["ผู้ใช้เข้าสู่ระบบด้วย Username/Password ได้", "ผู้ใช้ใช้ Remember Me ได้"]
- Each feature title must start with "ผู้ใช้" or a clear actor, and describe ONE action

Example: [{"id":"uuid","title":"ผู้ใช้เข้าสู่ระบบด้วย Username/Password ได้","description":"ผู้ใช้สามารถเข้าสู่ระบบด้วย username และ password","category":"การเข้าสู่ระบบ"}]
Respond with ONLY the JSON array, no markdown, no explanation.`

const PARSE_PROMPT = `Extract a feature list from the following document content.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title, description, category (optional), subcategory (optional).

CRITICAL RULES for splitting features:
- 1 feature = 1 atomic user action (one Subject + one Verb + one Object)
- If a line or sentence contains multiple actions joined by "พร้อม", "และ", "หรือ", "and", "or", "also", "as well as" — split into SEPARATE features
- BAD: "ผู้ใช้เข้าสู่ระบบด้วย Username/Password พร้อม Remember Me ได้"
- GOOD: ["ผู้ใช้เข้าสู่ระบบด้วย Username/Password ได้", "ผู้ใช้ใช้ Remember Me ได้"]
- Each feature title must describe ONE user action only

Respond with ONLY the JSON array, no markdown, no explanation.`
```

- [ ] **Step 2: Commit**

```bash
git add lib/llm/claude.ts
git commit -m "feat: improve AI prompt to split compound stories into atomic features"
```

---

## Task 2: เพิ่ม PATCH API สำหรับแก้ items

**Files:**
- Modify: `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts`

PATCH รับ `{ items: SprintReqItem[] }` แล้ว update ทับ items เดิมใน DB

- [ ] **Step 1: เพิ่ม PATCH handler**

แก้ไฟล์ `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts`:

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string; reqId: string }> }
) {
  const { id, reqId } = await params
  const { items } = await req.json()

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const existing = await db.sprintRequirement.findUnique({ where: { id: reqId } })
  if (!existing || existing.projectId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await db.sprintRequirement.update({
    where: { id: reqId },
    data: { items },
  })
  return NextResponse.json(updated)
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts"
git commit -m "feat: add PATCH endpoint for updating sprint requirement items"
```

---

## Task 3: UI Edit/Split story ใน RightPanel (sprint-review)

**Files:**
- Modify: `app/projects/[id]/sprint-review/SprintReviewRightPanel.tsx`

เพิ่ม inline edit บน `DocCard` — คลิกที่ doc card จะขยายแสดง list ของ items แต่ละ item มีปุ่ม edit (แก้ title) และปุ่ม split (แยก story เป็น 2)

**โครงสร้าง UI ที่เพิ่ม:**
```
DocCard (คลิกได้)
  └── [ขยาย] ItemList
        ├── item: "ผู้ใช้เข้าสู่ระบบด้วย Username/Password พร้อม Remember Me ได้"
        │     ├── [✏️ edit] → inline input แก้ title
        │     └── [⚡ split] → แยกเป็น 2 input แล้ว save
        └── ...
```

- [ ] **Step 1: เพิ่ม state และ helper functions ใน DocCard**

แทนที่ `DocCard` component ทั้งหมด (`function DocCard` ถึงก่อน `interface Props`):

```typescript
function DocCard({
  doc,
  projectId,
  sprintId,
  readOnly,
}: {
  doc: SprintRequirementDoc
  projectId: string
  sprintId: string
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<SprintReqItem[]>(doc.items)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [splitIdx, setSplitIdx] = useState<number | null>(null)
  const [splitTitles, setSplitTitles] = useState<[string, string]>(['', ''])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function saveItems(newItems: SprintReqItem[]) {
    setSaving(true)
    await fetch(`/api/projects/${projectId}/sprints/${sprintId}/requirements/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems }),
    })
    setItems(newItems)
    setSaving(false)
    router.refresh()
  }

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setEditTitle(items[idx].title)
    setSplitIdx(null)
  }

  async function commitEdit(idx: number) {
    if (!editTitle.trim()) return
    const newItems = items.map((item, i) =>
      i === idx ? { ...item, title: editTitle.trim() } : item
    )
    setEditingIdx(null)
    await saveItems(newItems)
  }

  function startSplit(idx: number) {
    setSplitIdx(idx)
    setSplitTitles([items[idx].title, ''])
    setEditingIdx(null)
  }

  async function commitSplit(idx: number) {
    const [t1, t2] = splitTitles
    if (!t1.trim() || !t2.trim()) return
    const original = items[idx]
    const newItem: SprintReqItem = { ...original, featureId: crypto.randomUUID(), title: t2.trim() }
    const newItems = [
      ...items.slice(0, idx),
      { ...original, title: t1.trim() },
      newItem,
      ...items.slice(idx + 1),
    ]
    setSplitIdx(null)
    await saveItems(newItems)
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-[var(--bg-hover)] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <FileIcon size={16} className="text-[var(--text-muted)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate">
            {doc.fileName ?? 'requirement.pdf'}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            โดย {doc.createdBy} · {doc.items.length} story
          </p>
        </div>
        <span className="text-[var(--text-muted)] text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
          {items.map((item, idx) => (
            <div key={item.featureId} className="px-4 py-3 flex flex-col gap-2">
              {editingIdx === idx ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    className="w-full text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-green)]"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(idx)
                      if (e.key === 'Escape') setEditingIdx(null)
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => commitEdit(idx)}
                      disabled={saving}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-[rgba(13,84,43,0.2)] text-[var(--status-green)] hover:bg-[rgba(13,84,43,0.35)] transition-colors disabled:opacity-40"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="text-[10px] px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : splitIdx === idx ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-[var(--text-muted)]">แยกเป็น 2 story</p>
                  <input
                    autoFocus
                    placeholder="Story 1"
                    className="w-full text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-green)]"
                    value={splitTitles[0]}
                    onChange={e => setSplitTitles([e.target.value, splitTitles[1]])}
                  />
                  <input
                    placeholder="Story 2"
                    className="w-full text-xs bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-green)]"
                    value={splitTitles[1]}
                    onChange={e => setSplitTitles([splitTitles[0], e.target.value])}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitSplit(idx)
                      if (e.key === 'Escape') setSplitIdx(null)
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => commitSplit(idx)}
                      disabled={saving || !splitTitles[0].trim() || !splitTitles[1].trim()}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-[rgba(13,84,43,0.2)] text-[var(--status-green)] hover:bg-[rgba(13,84,43,0.35)] transition-colors disabled:opacity-40"
                    >
                      แยก Story
                    </button>
                    <button
                      onClick={() => setSplitIdx(null)}
                      className="text-[10px] px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs text-[var(--text-primary)] leading-relaxed">{item.title}</p>
                  {!readOnly && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(idx)}
                        title="แก้ไข"
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => startSplit(idx)}
                        title="แยก Story"
                        className="text-[var(--text-muted)] hover:text-[var(--status-green)] transition-colors p-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: แก้ type ของ `doc` prop ใน DocCard call site**

ใน `SprintReviewRightPanel.tsx` หา `sprintDocs.map(doc => (` แล้วตรวจว่า `sprintDocs` มี type `SprintRequirementDoc[]` — ซึ่งมี `items` field อยู่แล้ว ไม่ต้องแก้

- [ ] **Step 3: Commit**

```bash
git add "app/projects/[id]/sprint-review/SprintReviewRightPanel.tsx"
git commit -m "feat: add inline edit and split story UI in sprint review right panel"
```

---

## Task 4: Mirror UI ไปที่ sprint-review-v1

**Files:**
- Modify: `app/projects/[id]/sprint-review-v1/SprintReviewRightPanel.tsx`

ทำเหมือน Task 3 ทุกอย่าง แต่ในไฟล์ v1

- [ ] **Step 1: อ่านไฟล์ v1 เพื่อหา DocCard component และ interface ที่ใช้**

อ่าน `app/projects/[id]/sprint-review-v1/SprintReviewRightPanel.tsx` — ค้นหา `function DocCard` และ interface ของ `doc` prop

- [ ] **Step 2: แทนที่ DocCard component ด้วย version ที่มี edit/split เหมือน Task 3**

ใช้ code เดียวกันกับ Task 3 Step 1 ทุกบรรทัด (import `useState`, `useRouter` ที่ top ของไฟล์ถ้ายังไม่มี)

- [ ] **Step 3: Commit**

```bash
git add "app/projects/[id]/sprint-review-v1/SprintReviewRightPanel.tsx"
git commit -m "feat: mirror edit/split story UI to sprint-review-v1"
```

---

## Task 5: Deploy

- [ ] **Step 1: Build check**

```bash
npm run build
```

Expected: build สำเร็จ ไม่มี TypeScript error

- [ ] **Step 2: Deploy**

```bash
vercel --prod
```
