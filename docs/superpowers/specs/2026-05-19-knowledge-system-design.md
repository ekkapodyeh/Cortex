# Cortex — Knowledge Management System Design Spec

**Date:** 2026-05-19  
**Status:** Approved  
**Scope:** Internal Tool (single company, expandable to multi-tenant later)

---

## 1. Problem Statement

ความรู้ขององค์กรติดอยู่กับตัวบุคคล เมื่อพนักงานลาออก ความรู้นั้นหายไปด้วย ทีมใหม่ต้องเสียเวลา Onboarding เพื่อทำความเข้าใจระบบ Cortex แก้ปัญหานี้โดยดึงความรู้จากโค้ดออกมาเป็นเอกสารที่เป็นปัจจุบันตลอดเวลา

---

## 2. Core Concepts

| ชื่อ | คำอธิบาย |
|------|-----------|
| **Knowledge Doc** | เอกสารความรู้ official ของโปรเจกต์ มี version (V.1, V.2, …) สร้างโดย PM/BA เมื่อ approve แล้ว |
| **Project Update Doc** | draft ที่ระบบสร้างอัตโนมัติทุกครั้งที่มี push — แสดง diff จาก Knowledge Doc เดิม + ผล validation |
| **Document Requirement** | Feature list ที่เป็น source of truth ของโปรเจกต์ — บอกว่าระบบนี้ "ควรทำอะไรได้บ้าง" ดูแลโดย PM/BA |

---

## 3. Architecture — Event-driven Pipeline

```
Dev push/commit
    ↓
Git Webhook (GitHub / GitLab / Bitbucket)
    ↓
Webhook Receiver API
    ↓
Job Queue (BullMQ + Redis)
    ↓
Code Analysis Worker
    ├── 1. Clone repo at commit SHA
    ├── 2. ส่งโค้ดให้ LLM → สรุป feature list
    ├── 3. Save เป็น Project Update Doc (draft)
    ├── 4. Diff Engine — เปรียบเทียบ new vs old Knowledge Doc
    └── 5. Validation Engine — ตรวจกับ Document Requirement
    ↓
┌─────────────────────┬────────────────────────┐
│ Validation PASS/FAIL│     Review UI          │
│ → Notify reviewer   │ PM/BA ดู diff + issues │
└─────────────────────┴────────────────────────┘
    ↓ (approve)
Knowledge Doc V.N (official)
```

### ทำไมถึงเลือก Event-driven Pipeline

- Code analysis ใช้เวลา → ต้องทำ async ไม่ block UI
- รองรับ codebase ขนาดใหญ่ได้
- Retry อัตโนมัติเมื่อ LLM call fail
- Scale ได้ง่ายในอนาคต

---

## 4. User Roles

| Role | หน้าที่ |
|------|---------|
| **Dev** | push โค้ดตามปกติ รับ notification เมื่อต้องแก้ |
| **PM / BA** | ดูแล Document Requirement, Review Project Update Doc, Approve → Knowledge Doc |
| **พนักงานใหม่ / ทีมอื่น** | อ่าน Knowledge Doc ล่าสุดเพื่อทำความเข้าใจระบบ |

---

## 5. Key Flows

### Flow A — Code Update (Happy Path)

1. Dev push code → webhook trigger
2. ระบบ analyze → สร้าง Project Update Doc พร้อม diff
3. Validation Engine ตรวจกับ Document Requirement → pass
4. PM/BA รับ notification → เข้า Review UI
5. PM/BA เห็น diff ว่าเปลี่ยนอะไร + ทุก feature มีสถานะ Requirement inline
6. PM/BA กด Approve → ระบบสร้าง Knowledge Doc V.N

### Flow B — Validation Fail

1-3. เหมือน Flow A แต่ validation fail
4. ระบบ notify PM/BA ว่ามีปัญหา
5. PM/BA ดู issue → กด "แจ้ง Dev ให้แก้ไข" พร้อม comment
6. Dev ได้รับ notification → แก้โค้ด → push ใหม่ → กลับ Flow A

---

## 6. Review Screen — หัวใจของระบบ

หน้านี้คือจุดที่ PM/BA ใช้งานหลัก แสดง 2 คอลัมน์:

- **ซ้าย:** Knowledge Doc เดิม (official)
- **ขวา:** Project Update Doc ใหม่ + สถานะ Requirement inline ทุก feature

สีสถานะ:
- 🟢 **ตรง Req** — feature ตรงกับ Document Requirement
- 🟡 **ไม่อยู่ใน Req** — dev ทำไปแล้วแต่ PM ยังไม่ได้กำหนด
- 🔴 **ขาดหายไป** — อยู่ใน Req แต่โค้ดยังไม่มี
- ⚫ **ไม่เกี่ยวกับ Req** — feature ถูกลบออก

---

## 7. Knowledge Doc Page

หลัง approve จะสร้าง Knowledge Doc version ใหม่ ประกอบด้วย:

- Version bar (สลับดู V.1, V.2, … ได้)
- สรุปการเปลี่ยนแปลง: +N เพิ่ม · N แก้ไข · N ลบ
- Feature list แบ่งหมวดหมู่ แต่ละ feature มีป้าย "ใหม่ใน V.N" / "อัปเดตใน V.N" / "ลบออกใน V.N"
- ปุ่ม Share ให้ทีม

---

## 8. Data Model (ภาพรวม)

```
Project
├── DocumentRequirement (source of truth — feature list)
├── KnowledgeDoc[] (official versions: V.1, V.2, …)
└── AnalysisJob[]
        └── ProjectUpdateDoc (draft + diff + validation result)
```

### ValidationResult (ผลการตรวจ)
```
{
  passed: boolean
  missing: Feature[]      // อยู่ใน Req แต่ไม่มีในโค้ด
  extra: Feature[]        // มีในโค้ดแต่ไม่อยู่ใน Req
  mismatched: Issue[]     // ชื่อคล้ายแต่ content ต่าง
}
```

---

## 9. UI / Design

- **Theme:** Dark (อ้างอิง Figma: Cortex Good Boy UI Design)
- **Figma reference:** `node-id=2401-46081` — Business Overview page
- **Stack:** TBD (Next.js recommended)
- **Language:** ไทย

---

## 10. LLM / AI

- Provider: Abstract/swappable (default Claude API)
- Input: โค้ดทั้ง repo หรือ diff จาก commit
- Output: Feature list structured JSON
- Note: ต้องรองรับหลาย tech stack เพราะแต่ละ project ใช้ภาษาต่างกัน

---

## 11. Git Integration

- รองรับ: GitHub, GitLab, Bitbucket (webhook-based)
- Trigger: push / commit event
- ข้อมูลที่ต้องการ: commit SHA, author, message, repo URL

---

## 12. Document Requirement Management

PM/BA จัดการ Document Requirement ด้วยการ **upload ไฟล์** — ไม่ต้องกรอกเอง:
- รองรับไฟล์: `.xlsx`, `.docx`, `.pdf`, `.csv`
- ระบบใช้ LLM parse ไฟล์ → แปลงเป็น feature list อัตโนมัติ
- PM/BA ตรวจสอบผลลัพธ์ก่อน confirm
- เมื่อ confirm แล้ว feature list นั้นจะกลายเป็น Document Requirement version ใหม่
- ประวัติการ upload ทุกครั้งจะถูกบันทึกไว้ (versioned)

---

## 13. Notification

- PM/BA: แจ้งเมื่อมี Project Update Doc พร้อม review
- Dev: แจ้งเมื่อ PM/BA ส่ง comment กลับมาให้แก้ไข
- Channel: TBD (email / Slack / in-app)

---

## 14. Out of Scope (MVP)

- Multi-tenant / SaaS
- Login with Google (Phase 2)
- Mobile app
- Real-time collaboration บน Review screen
- Auto-merge Document Requirement เมื่อ PM approve feature ใหม่
