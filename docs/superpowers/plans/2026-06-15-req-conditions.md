# Req Conditions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เมื่อ PM upload Req file ระบบให้ AI แตก conditions ย่อยออกมาต่อแต่ละ story แล้วเปรียบเทียบกับโค้ดที่เดฟ push มาเพื่อแสดงสถานะระดับ condition ใน card

**Architecture:** เพิ่ม `conditions` array ใน `SprintReqItem` ที่ AI สร้างตอน upload → ตอน render detail page เปรียบเทียบ conditions กับ feature description จาก KnowledgeDoc โดยใช้ AI → แสดงผลใน ItemCard แต่ละ condition

**Tech Stack:** Anthropic SDK (claude-sonnet-4-6), Prisma (PostgreSQL JSON), Next.js App Router, TypeScript

---

## File Map

| File | Action | หน้าที่ |
|---|---|---|
| `lib/types.ts` | Modify | เพิ่ม `Condition` type และ `conditions` ใน `SprintReqItem` |
| `lib/llm/claude.ts` | Modify | เพิ่ม `extractConditions()` method |
| `lib/llm/index.ts` | Modify | เพิ่ม interface method |
| `lib/extract-conditions.ts` | Create | function รับ req items แล้วเรียก AI แตก conditions |
| `app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts` | Modify | เรียก AI แตก conditions ก่อน save |
| `app/projects/[id]/sprint-review/detail/page.tsx` | Modify | เรียก AI เปรียบเทียบ conditions vs feature description |
| `app/projects/[id]/sprint-review/detail/SubcategoryList.tsx` | Modify | แสดง conditions ใน ItemCard |

---

### Task 1: เพิ่ม Condition type ใน lib/types.ts

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: เพิ่ม type**

เปิด `lib/types.ts` เพิ่มต่อท้าย:

```ts
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
```

และแก้ `SprintReqItem` (ถ้ามีใน types.ts) หรือใน `SprintReviewRightPanel.tsx` เพิ่ม field:

```ts
export interface SprintReqItem {
  featureId: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  changeType: 'add' | 'modify' | 'remove'
  category?: string
  subcategory?: string
  conditions?: Condition[]   // เพิ่มบรรทัดนี้
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Condition and ConditionResult types"
```

---

### Task 2: เพิ่ม extractConditions ใน LLM layer

**Files:**
- Modify: `lib/llm/index.ts`
- Modify: `lib/llm/claude.ts`

- [ ] **Step 1: เพิ่ม interface ใน `lib/llm/index.ts`**

```ts
import type { Feature, Condition } from '@/lib/types'

export interface LLMProvider {
  extractFeatures(code: string): Promise<Feature[]>
  parseDocument(text: string): Promise<Feature[]>
  extractConditions(items: { featureId: string; title: string; description: string }[]): Promise<Record<string, Condition[]>>
}
```

- [ ] **Step 2: เพิ่ม method ใน `lib/llm/claude.ts`**

เพิ่ม prompt และ method:

```ts
const EXTRACT_CONDITIONS_PROMPT = `คุณได้รับรายการ user story แต่ละอัน จงแตก "เงื่อนไข" (acceptance conditions) ออกมาเป็น list ย่อย

กฎ:
- 1 condition = 1 เงื่อนไขที่ตรวจสอบได้อิสระ
- ถ้า description บอกว่า "username ต้องไม่ซ้ำ และ ไม่จำกัดความยาว" → แตกเป็น 2 conditions
- แต่ละ condition ต้องกระชับ ชัดเจน ตรวจสอบได้จากโค้ด
- ใช้ภาษาเดิมของ requirement (ไทยหรืออังกฤษ)

Return JSON object: { [featureId]: [{ id: "uuid", description: "..." }, ...] }
ตอบด้วย JSON เท่านั้น ไม่มี markdown`

async extractConditions(
  items: { featureId: string; title: string; description: string }[]
): Promise<Record<string, Condition[]>> {
  const response = await this.client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: EXTRACT_CONDITIONS_PROMPT,
    messages: [{
      role: 'user',
      content: JSON.stringify(items),
    }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(text)
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/llm/index.ts lib/llm/claude.ts
git commit -m "feat: add extractConditions to LLM provider"
```

---

### Task 3: สร้าง lib/extract-conditions.ts

**Files:**
- Create: `lib/extract-conditions.ts`

- [ ] **Step 1: สร้างไฟล์**

```ts
import { ClaudeLLMProvider } from './llm/claude'
import type { Condition } from './types'

export async function extractConditionsForItems(
  items: { featureId: string; title: string; description: string }[]
): Promise<Record<string, Condition[]>> {
  if (items.length === 0) return {}
  const llm = new ClaudeLLMProvider()
  return llm.extractConditions(items)
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/extract-conditions.ts
git commit -m "feat: add extractConditionsForItems helper"
```

---

### Task 4: เรียก AI แตก conditions ตอน upload requirement

**Files:**
- Modify: `app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts`

- [ ] **Step 1: แก้ route ให้เรียก extractConditionsForItems ก่อน save**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractConditionsForItems } from '@/lib/extract-conditions'

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

  // แตก conditions ด้วย AI
  const conditionsMap = await extractConditionsForItems(
    items.map((r: any) => ({ featureId: r.featureId, title: r.title, description: r.description }))
  )

  // inject conditions กลับเข้า items
  const itemsWithConditions = items.map((r: any) => ({
    ...r,
    conditions: conditionsMap[r.featureId] ?? [],
  }))

  const requirement = await db.sprintRequirement.create({
    data: {
      sprintId,
      projectId: id,
      items: itemsWithConditions,
      fileName: fileName ?? null,
      createdBy: createdBy ?? 'BA',
    },
  })
  return NextResponse.json(requirement)
}
```

- [ ] **Step 2: ทดสอบด้วย mock data**

เปิด `/projects/<id>/sprint-review` → สร้าง Bolt ใหม่ → ทดลองด้วย Mock Data → ดู DB ว่า items มี conditions แล้ว

```bash
# ดู DB
npx prisma studio
```

- [ ] **Step 3: Commit**

```bash
git add "app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts"
git commit -m "feat: extract conditions via AI on requirement upload"
```

---

### Task 5: เปรียบเทียบ conditions vs feature ใน detail page

**Files:**
- Create: `lib/compare-conditions.ts`
- Modify: `app/projects/[id]/sprint-review/detail/page.tsx`

- [ ] **Step 1: สร้าง `lib/compare-conditions.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { Condition, ConditionResult } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT = `เปรียบเทียบ "conditions จาก Requirement" กับ "สิ่งที่โค้ดทำจริง" (feature description)

สำหรับแต่ละ condition ให้ตัดสินว่า:
- "match" = โค้ดทำตาม condition นี้ครบถ้วน
- "wrong" = โค้ดทำ แต่ไม่ตรงตาม condition (เช่น จำกัด 16 ตัวแทนที่ไม่จำกัด)
- "missing" = condition นี้ไม่มีในโค้ดเลย

นอกจากนี้ ถ้าโค้ดมีอะไรที่ Requirement ไม่ได้ระบุ ให้ส่งกลับเป็น extra conditions

Return JSON:
{
  "results": [
    { "id": "<condition id>", "description": "...", "status": "match|wrong|missing", "note": "อธิบายถ้า wrong" }
  ],
  "extra": [
    { "id": "extra-1", "description": "สิ่งที่โค้ดมีแต่ Req ไม่ได้ขอ", "status": "extra" }
  ]
}

ตอบด้วย JSON เท่านั้น`

export async function compareConditions(
  conditions: Condition[],
  featureDescription: string
): Promise<ConditionResult[]> {
  if (conditions.length === 0) return []

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: PROMPT,
    messages: [{
      role: 'user',
      content: JSON.stringify({ conditions, featureDescription }),
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = JSON.parse(text)
  return [...(parsed.results ?? []), ...(parsed.extra ?? [])]
}
```

- [ ] **Step 2: เรียก compareConditions ใน `detail/page.tsx`**

ใน section ที่ map items เป็น groups (ประมาณบรรทัด 148-200) ให้เพิ่มหลัง reqStatus คำนวณ:

```ts
// เพิ่ม import ข้างบน
import { compareConditions } from '@/lib/compare-conditions'
import type { ConditionResult } from '@/lib/types'

// ใน loop map items ที่ไม่ใช่ synthetic:
const conditions: ConditionResult[] = req?.conditions?.length
  ? await compareConditions(req.conditions, i.feature.description ?? '')
  : []

// แล้ว return ใน object:
return {
  ...existingFields,
  conditions,  // เพิ่ม field นี้
}
```

และเพิ่ม `conditions: ConditionResult[]` ใน type ของ items ใน `SubcategoryGroup`

- [ ] **Step 3: Commit**

```bash
git add lib/compare-conditions.ts "app/projects/[id]/sprint-review/detail/page.tsx"
git commit -m "feat: compare conditions vs feature description using AI"
```

---

### Task 6: แสดง conditions ใน ItemCard

**Files:**
- Modify: `app/projects/[id]/sprint-review/detail/SubcategoryList.tsx`

- [ ] **Step 1: เพิ่ม `conditions` ใน type ของ item**

```ts
import type { ConditionResult } from '@/lib/types'

// ใน SubcategoryGroup items array เพิ่ม:
conditions?: ConditionResult[]
```

- [ ] **Step 2: เพิ่ม ConditionRow component**

```tsx
function ConditionRow({ condition }: { condition: ConditionResult }) {
  const config = {
    match:   { icon: '✓', cls: 'text-[var(--status-green)]',  bg: 'bg-[rgba(13,84,43,0.1)]' },
    wrong:   { icon: '✗', cls: 'text-[var(--status-red)]',    bg: 'bg-[rgba(130,24,26,0.1)]' },
    missing: { icon: '−', cls: 'text-[var(--status-yellow)]', bg: 'bg-[rgba(115,62,10,0.1)]' },
    extra:   { icon: '+', cls: 'text-[var(--text-muted)]',    bg: 'bg-[var(--bg-hover)]' },
  }
  const { icon, cls, bg } = config[condition.status]

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${bg}`}>
      <span className={`text-[12px] font-bold shrink-0 mt-0.5 ${cls}`}>{icon}</span>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className={`text-[13px] ${cls}`}>{condition.description}</p>
        {condition.note && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{condition.note}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: ใส่ ConditionRow ใน ItemCard ใต้ส่วน "ของใหม่"**

```tsx
{/* Conditions */}
{item.conditions && item.conditions.length > 0 && (
  <div className="flex flex-col gap-2">
    <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Conditions</p>
    {item.conditions.map(c => (
      <ConditionRow key={c.id} condition={c} />
    ))}
  </div>
)}
```

- [ ] **Step 4: ทดสอบ UI**

เปิด `/projects/<id>/sprint-review/detail?cat=<category>` ดูว่า card แสดง conditions แต่ละอันพร้อมสถานะ

- [ ] **Step 5: Commit**

```bash
git add "app/projects/[id]/sprint-review/detail/SubcategoryList.tsx"
git commit -m "feat: show condition-level status in ItemCard"
```
