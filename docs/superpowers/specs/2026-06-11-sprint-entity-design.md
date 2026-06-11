# Sprint Entity Design

**Date:** 2026-06-11  
**Scope:** Sprint Review — เพิ่ม Sprint เป็น entity ของตัวเอง (รอบนี้รองรับเฉพาะ requirement ประเภท "add" เท่านั้น)

---

## Goal

ระบบปัจจุบัน Sprint Review ไม่มี cut-off ชัดเจนว่าอะไรคือ "เสร็จ" เพราะ requirement ผูกกับ AnalysisJob ไม่ใช่ Sprint  
แก้โดยสร้าง `Sprint` เป็น entity ใหม่ — มีชื่อ + requirement file + status (OPEN/CLOSED) — และย้ายจุดอัปโหลด requirement มาอยู่ตอนสร้าง Sprint

---

## Data Model

### Sprint (ใหม่)

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

enum SprintStatus {
  OPEN
  CLOSED
}
```

### SprintRequirement (แก้ relation)

```prisma
model SprintRequirement {
  id        String   @id @default(cuid())
  sprintId  String                         // เปลี่ยนจาก jobId → sprintId
  projectId String
  items     Json                           // changeType: "add" เท่านั้นในรอบนี้
  fileName  String?
  createdBy String
  createdAt DateTime @default(now())

  sprint    Sprint   @relation(fields: [sprintId], references: [id], onDelete: Cascade)
}
```

**หมายเหตุ:** ตัด relation กับ `AnalysisJob` ออก — Sprint และ Job เป็นคนละ concept

---

## API

### Sprint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/[id]/sprints` | ดึง sprint ทั้งหมดของ project |
| POST | `/api/projects/[id]/sprints` | สร้าง sprint ใหม่ (body: `{ name }`) |
| PATCH | `/api/projects/[id]/sprints/[sprintId]` | อัปเดต status เป็น CLOSED |

### SprintRequirement

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/[id]/sprints/[sprintId]/requirements` | อัปโหลด requirement file ให้ sprint |
| DELETE | `/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]` | ลบ requirement |

---

## UI

### Business Rules

- Project มี Sprint ได้หลายอัน แต่ **OPEN ได้ทีละ 1 เท่านั้น**
- ต้องปิด Sprint ปัจจุบันก่อนจึงจะสร้าง Sprint ใหม่ได้
- requirement items รอบนี้มีเฉพาะ `changeType: "add"` — feature ที่ต้องเพิ่มใหม่

### States

#### State 1: ไม่มี Sprint

- หน้าหลักแสดง empty state
- Right panel แสดงปุ่ม **"+ สร้าง Sprint"**

#### State 2: มี Sprint (OPEN)

- Header แสดง: `Sprint 1` + chip `[OPEN]` + ปุ่ม **"ปิด Sprint"**
- Right panel แสดง: requirement file card + progress bar
- Main content แบ่งเป็น 2 กลุ่มเหมือนเดิม: **ยังไม่สำเร็จ** / **สำเร็จแล้ว**
- การเช็ก: feature ที่ถูก `added` ใน diff → ตรงกับ requirement `add` → นับเป็นสำเร็จ

#### State 3: มี Sprint (CLOSED)

- Header แสดง: `Sprint 1` + chip `[CLOSED]` — ไม่มีปุ่มปิด
- Right panel แสดงปุ่ม **"+ สร้าง Sprint ใหม่"**

### Modal: สร้าง Sprint ใหม่

Fields:
1. **ชื่อ Sprint** — text input (default: "Sprint N" โดย N = จำนวน sprint ทั้งหมด + 1)
2. **Requirement File** — upload zone (.pdf, .docx, .txt)

Flow: กรอกชื่อ → อัปโหลดไฟล์ → กด "สร้าง Sprint" → modal ปิด → หน้า refresh

### Presentation รูปแบบ

คงรูปแบบเดิม: CategoryCard แสดง **ของเดิม vs ของใหม่** (old feature vs new feature)  
รอบนี้ focus ที่ added features — card แสดง progress `X/Y สำเร็จ` ต่อ category

---

## Out of Scope (รอบนี้)

- requirement `changeType: "modify"` และ `"remove"`
- Sprint history / timeline
- การดู sprint ที่ปิดแล้ว
- การแก้ชื่อ Sprint หลังสร้าง

---

## Files ที่ต้องแก้

| File | การเปลี่ยนแปลง |
|------|---------------|
| `prisma/schema.prisma` | เพิ่ม Sprint model, แก้ SprintRequirement |
| `app/api/projects/[id]/sprints/route.ts` | GET, POST sprint |
| `app/api/projects/[id]/sprints/[sprintId]/route.ts` | PATCH status |
| `app/api/projects/[id]/sprints/[sprintId]/requirements/route.ts` | POST requirement |
| `app/api/projects/[id]/sprints/[sprintId]/requirements/[reqId]/route.ts` | DELETE requirement |
| `app/projects/[id]/sprint-review/page.tsx` | ดึง sprint แทน sprintRequirement |
| `app/projects/[id]/sprint-review/SprintReviewClient.tsx` | รับ sprint props ใหม่ |
| `app/projects/[id]/sprint-review/SprintReviewRightPanel.tsx` | UI sprint states + modal |
| `app/api/projects/[id]/sprint-requirements/route.ts` | ลบหรือ deprecate |
