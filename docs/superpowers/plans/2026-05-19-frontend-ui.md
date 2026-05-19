# Cortex Frontend UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้าง Frontend UI ของระบบ Cortex ด้วย dark theme ตาม Figma design — ครอบคลุม Project list, Review Screen (Knowledge Doc vs Project Update Doc + inline Requirement status), Knowledge Doc viewer, และ Document Requirement upload

**Architecture:** Next.js App Router (full-stack) — Server Components สำหรับ data fetching, Client Components สำหรับ interactive UI, Tailwind CSS v4 สำหรับ styling, dark theme ถาวร (ไม่มี toggle)

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Geist font (preinstalled)

---

## Design Reference

- **Figma:** `node-id=2401-46081` — Business Overview page (dark background ~`#0D0F10`, sidebar ซ้าย, content area, AI panel ขวา)
- **Theme:** Dark only — `#0D0F10` background, `#1A1D1E` cards/panels, `#2A2D2E` borders, `#F5F5F5` text
- **Status badges:** 🟢 `#22C55E` ตรง Req | 🟡 `#EAB308` ไม่อยู่ใน Req | 🔴 `#EF4444` ขาดหายไป | ⚫ `#6B7280` ลบแล้ว

---

## File Structure

```
app/
├── globals.css                          # Dark theme CSS variables + Tailwind config
├── layout.tsx                           # Root layout — Geist font, dark background
├── page.tsx                             # "/" — Project list page
├── projects/
│   ├── new/page.tsx                     # "/projects/new" — Create project form
│   └── [id]/
│       ├── layout.tsx                   # Project layout — sidebar + content
│       ├── page.tsx                     # "/projects/[id]" — Job history list
│       ├── jobs/
│       │   └── [jobId]/page.tsx         # "/projects/[id]/jobs/[jobId]" — Review screen
│       ├── knowledge/page.tsx           # "/projects/[id]/knowledge" — Knowledge Doc viewer
│       └── requirements/page.tsx        # "/projects/[id]/requirements" — Requirements upload
components/
├── Sidebar.tsx                          # Left navigation sidebar
├── ProjectCard.tsx                      # Project list item card
├── JobStatusBadge.tsx                   # QUEUED/RUNNING/DONE/FAILED badge
├── FeatureStatusBadge.tsx               # ตรง Req / ไม่อยู่ใน Req / ขาดหายไป / ลบแล้ว
├── ReviewPanel.tsx                      # Side-by-side review (Knowledge Doc vs Update Doc)
├── FeatureRow.tsx                       # Single feature row with inline status badge
├── KnowledgeDocViewer.tsx               # Versioned Knowledge Doc display
├── RequirementsUpload.tsx               # File drag-drop upload component
└── ApproveRejectBar.tsx                 # Bottom action bar on review screen
```

---

### Task 1: Dark Theme Foundation

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update globals.css with dark theme variables**

Replace the entire `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --bg-base: #0D0F10;
  --bg-card: #1A1D1E;
  --bg-hover: #222527;
  --border: #2A2D2E;
  --text-primary: #F5F5F5;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --accent: #6366F1;
  --accent-hover: #818CF8;
  --status-green: #22C55E;
  --status-yellow: #EAB308;
  --status-red: #EF4444;
  --status-gray: #6B7280;
}

@theme inline {
  --color-bg-base: var(--bg-base);
  --color-bg-card: var(--bg-card);
  --color-bg-hover: var(--bg-hover);
  --color-border: var(--border);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-status-green: var(--status-green);
  --color-status-yellow: var(--status-yellow);
  --color-status-red: var(--status-red);
  --color-status-gray: var(--status-gray);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-geist-sans, Arial, sans-serif);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
```

- [ ] **Step 2: Update root layout.tsx**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cortex — Knowledge Management",
  description: "ระบบบริหารความรู้จากโค้ด",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: dark theme CSS variables and root layout"
```

---

### Task 2: Sidebar + Project Layout Components

**Files:**
- Create: `components/Sidebar.tsx`
- Create: `app/projects/[id]/layout.tsx`

- [ ] **Step 1: Write failing test for Sidebar rendering**

Create `tests/sidebar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/Sidebar'

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: () => '/projects/test-id',
}))

test('renders Cortex logo', () => {
  render(<Sidebar projectId="test-id" projectName="My Project" />)
  expect(screen.getByText('Cortex')).toBeInTheDocument()
})

test('shows project name', () => {
  render(<Sidebar projectId="test-id" projectName="My Project" />)
  expect(screen.getByText('My Project')).toBeInTheDocument()
})
```

- [ ] **Step 2: Install testing dependencies**

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Update vitest.config.ts for jsdom**

Read current `vitest.config.ts`, then update to add jsdom environment for component tests:

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/*.test.tsx', 'jsdom'],
      ['tests/components/**', 'jsdom'],
    ],
    setupFiles: ['./tests/setup.ts'],
  },
})
```

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/sidebar.test.tsx`
Expected: FAIL — "Cannot find module '@/components/Sidebar'"

- [ ] **Step 5: Create Sidebar component**

Create `components/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  projectId: string
  projectName: string
}

interface NavItem {
  label: string
  href: string
  icon: string
}

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: 'งานวิเคราะห์', href: `/projects/${projectId}`, icon: '⚡' },
    { label: 'Knowledge Doc', href: `/projects/${projectId}/knowledge`, icon: '📚' },
    { label: 'Document Requirement', href: `/projects/${projectId}/requirements`, icon: '📋' },
  ]

  const isActive = (href: string) => {
    if (href === `/projects/${projectId}`) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 min-h-screen bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <Link href="/" className="text-[var(--text-primary)] font-semibold text-lg tracking-tight hover:text-[var(--accent)] transition-colors">
          Cortex
        </Link>
      </div>

      {/* Project name */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">โปรเจกต์</p>
        <p className="text-sm text-[var(--text-primary)] font-medium truncate">{projectName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Back to projects */}
      <div className="px-3 py-4 border-t border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <span>←</span> โปรเจกต์ทั้งหมด
        </Link>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/sidebar.test.tsx`
Expected: PASS

- [ ] **Step 7: Create project layout**

Create `app/projects/[id]/layout.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  return (
    <div className="flex min-h-screen">
      <Sidebar projectId={id} projectName={project.name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add components/Sidebar.tsx app/projects/[id]/layout.tsx tests/sidebar.test.tsx tests/setup.ts vitest.config.ts
git commit -m "feat: sidebar navigation and project layout"
```

---

### Task 3: Project List Page + Create Project Form

**Files:**
- Modify: `app/page.tsx`
- Create: `components/ProjectCard.tsx`
- Create: `app/projects/new/page.tsx`

- [ ] **Step 1: Write failing test for ProjectCard**

Create `tests/project-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '@/components/ProjectCard'

const mockProject = {
  id: 'proj-1',
  name: 'My API',
  repoUrl: 'https://github.com/org/api',
  platform: 'GITHUB' as const,
  createdAt: new Date('2026-05-19'),
  _count: { analysisJobs: 5 },
}

test('renders project name', () => {
  render(<ProjectCard project={mockProject} />)
  expect(screen.getByText('My API')).toBeInTheDocument()
})

test('renders repo URL', () => {
  render(<ProjectCard project={mockProject} />)
  expect(screen.getByText('https://github.com/org/api')).toBeInTheDocument()
})

test('renders job count', () => {
  render(<ProjectCard project={mockProject} />)
  expect(screen.getByText('5 งานวิเคราะห์')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/project-card.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create ProjectCard component**

Create `components/ProjectCard.tsx`:

```tsx
import Link from 'next/link'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    repoUrl: string
    platform: 'GITHUB' | 'GITLAB' | 'BITBUCKET'
    createdAt: Date
    _count: { analysisJobs: number }
  }
}

const platformLabel: Record<string, string> = {
  GITHUB: 'GitHub',
  GITLAB: 'GitLab',
  BITBUCKET: 'Bitbucket',
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)] transition-colors group">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[var(--text-primary)] font-semibold text-base truncate group-hover:text-[var(--accent)] transition-colors">
              {project.name}
            </h3>
            <p className="text-[var(--text-muted)] text-sm mt-1 truncate">{project.repoUrl}</p>
          </div>
          <span className="shrink-0 text-xs bg-[var(--bg-hover)] text-[var(--text-muted)] px-2 py-1 rounded-md">
            {platformLabel[project.platform]}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>{project._count.analysisJobs} งานวิเคราะห์</span>
          <span>•</span>
          <span>สร้าง {new Date(project.createdAt).toLocaleDateString('th-TH')}</span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/project-card.test.tsx`
Expected: PASS

- [ ] **Step 5: Update Project list page (Server Component)**

Replace `app/page.tsx`:

```tsx
import { db } from '@/lib/db'
import Link from 'next/link'
import { ProjectCard } from '@/components/ProjectCard'

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { analysisJobs: true } } },
  })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Cortex</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">ระบบบริหารความรู้จากโค้ด</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + เพิ่มโปรเจกต์
        </Link>
      </header>

      {/* Content */}
      <div className="px-8 py-6">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)] text-lg">ยังไม่มีโปรเจกต์</p>
            <p className="text-[var(--text-muted)] text-sm mt-2">เริ่มต้นโดยการเพิ่มโปรเจกต์ใหม่</p>
            <Link
              href="/projects/new"
              className="inline-block mt-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + เพิ่มโปรเจกต์แรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create project creation form page**

Create `app/projects/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      repoUrl: (form.elements.namedItem('repoUrl') as HTMLInputElement).value,
      platform: (form.elements.namedItem('platform') as HTMLSelectElement).value,
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const project = await res.json()
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)] transition-colors">
            ← กลับ
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mt-4">เพิ่มโปรเจกต์ใหม่</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">ชื่อโปรเจกต์</label>
            <input
              name="name"
              required
              placeholder="เช่น Payment Service"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Repository URL</label>
            <input
              name="repoUrl"
              required
              type="url"
              placeholder="https://github.com/org/repo"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Platform</label>
            <select
              name="platform"
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="GITHUB">GitHub</option>
              <option value="GITLAB">GitLab</option>
              <option value="BITBUCKET">Bitbucket</option>
            </select>
          </div>

          {error && (
            <p className="text-[var(--status-red)] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: all tests pass (19+ tests)

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx app/projects/new/page.tsx components/ProjectCard.tsx tests/project-card.test.tsx
git commit -m "feat: project list page and create project form"
```

---

### Task 4: Job History Page + Status Badge Component

**Files:**
- Create: `components/JobStatusBadge.tsx`
- Create: `app/projects/[id]/page.tsx`

- [ ] **Step 1: Write failing test for JobStatusBadge**

Create `tests/job-status-badge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { JobStatusBadge } from '@/components/JobStatusBadge'

test('shows QUEUED badge', () => {
  render(<JobStatusBadge status="QUEUED" />)
  expect(screen.getByText('รอคิว')).toBeInTheDocument()
})

test('shows RUNNING badge', () => {
  render(<JobStatusBadge status="RUNNING" />)
  expect(screen.getByText('กำลังวิเคราะห์')).toBeInTheDocument()
})

test('shows DONE badge', () => {
  render(<JobStatusBadge status="DONE" />)
  expect(screen.getByText('เสร็จแล้ว')).toBeInTheDocument()
})

test('shows FAILED badge', () => {
  render(<JobStatusBadge status="FAILED" />)
  expect(screen.getByText('ล้มเหลว')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/job-status-badge.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create JobStatusBadge component**

Create `components/JobStatusBadge.tsx`:

```tsx
type JobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED'

interface JobStatusBadgeProps {
  status: JobStatus
}

const config: Record<JobStatus, { label: string; color: string }> = {
  QUEUED:  { label: 'รอคิว',       color: 'text-[var(--text-muted)] bg-[var(--bg-hover)]' },
  RUNNING: { label: 'กำลังวิเคราะห์', color: 'text-[var(--status-yellow)] bg-yellow-900/20' },
  DONE:    { label: 'เสร็จแล้ว',   color: 'text-[var(--status-green)] bg-green-900/20' },
  FAILED:  { label: 'ล้มเหลว',     color: 'text-[var(--status-red)] bg-red-900/20' },
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const { label, color } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/job-status-badge.test.tsx`
Expected: PASS

- [ ] **Step 5: Create Job History page**

Create `app/projects/[id]/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { JobStatusBadge } from '@/components/JobStatusBadge'

export default async function ProjectJobsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const jobs = await db.analysisJob.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { updateDoc: { select: { status: true } } },
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">งานวิเคราะห์ล่าสุด</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">ประวัติการ push โค้ดและผลการวิเคราะห์</p>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)]">ยังไม่มีงานวิเคราะห์</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">ระบบจะวิเคราะห์โค้ดอัตโนมัติเมื่อมีการ push</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)]/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded">
                      {job.commitSha.slice(0, 7)}
                    </code>
                    <JobStatusBadge status={job.status} />
                    {job.updateDoc && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        job.updateDoc.status === 'APPROVED'
                          ? 'text-[var(--status-green)] bg-green-900/20'
                          : job.updateDoc.status === 'REJECTED'
                          ? 'text-[var(--status-red)] bg-red-900/20'
                          : 'text-[var(--status-yellow)] bg-yellow-900/20'
                      }`}>
                        {job.updateDoc.status === 'APPROVED' ? 'Approved' : job.updateDoc.status === 'REJECTED' ? 'Rejected' : 'รอ Review'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] truncate">{job.commitMessage || 'ไม่มี commit message'}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(job.createdAt).toLocaleString('th-TH')}
                  </p>
                </div>
                {job.status === 'DONE' && job.updateDoc?.status === 'PENDING' && (
                  <Link
                    href={`/projects/${id}/jobs/${job.id}`}
                    className="shrink-0 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    Review →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/JobStatusBadge.tsx app/projects/[id]/page.tsx tests/job-status-badge.test.tsx
git commit -m "feat: job history page with status badge component"
```

---

### Task 5: Feature Status Badge + Feature Row Components

**Files:**
- Create: `components/FeatureStatusBadge.tsx`
- Create: `components/FeatureRow.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/feature-status-badge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { FeatureStatusBadge } from '@/components/FeatureStatusBadge'

test('shows green badge for MATCHED', () => {
  const { container } = render(<FeatureStatusBadge status="MATCHED" />)
  expect(screen.getByText('ตรง Req')).toBeInTheDocument()
  expect(container.firstChild).toHaveClass('text-[var(--status-green)]')
})

test('shows yellow badge for EXTRA', () => {
  render(<FeatureStatusBadge status="EXTRA" />)
  expect(screen.getByText('ไม่อยู่ใน Req')).toBeInTheDocument()
})

test('shows red badge for MISSING', () => {
  render(<FeatureStatusBadge status="MISSING" />)
  expect(screen.getByText('ขาดหายไป')).toBeInTheDocument()
})

test('shows gray badge for REMOVED', () => {
  render(<FeatureStatusBadge status="REMOVED" />)
  expect(screen.getByText('ลบแล้ว')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/feature-status-badge.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create FeatureStatusBadge component**

Create `components/FeatureStatusBadge.tsx`:

```tsx
type FeatureStatus = 'MATCHED' | 'EXTRA' | 'MISSING' | 'REMOVED'

interface FeatureStatusBadgeProps {
  status: FeatureStatus
}

const config: Record<FeatureStatus, { label: string; dot: string; textColor: string; bgColor: string }> = {
  MATCHED: { label: 'ตรง Req',       dot: '🟢', textColor: 'text-[var(--status-green)]', bgColor: 'bg-green-900/20' },
  EXTRA:   { label: 'ไม่อยู่ใน Req', dot: '🟡', textColor: 'text-[var(--status-yellow)]', bgColor: 'bg-yellow-900/20' },
  MISSING: { label: 'ขาดหายไป',     dot: '🔴', textColor: 'text-[var(--status-red)]',    bgColor: 'bg-red-900/20' },
  REMOVED: { label: 'ลบแล้ว',       dot: '⚫', textColor: 'text-[var(--text-muted)]',    bgColor: 'bg-[var(--bg-hover)]' },
}

export function FeatureStatusBadge({ status }: FeatureStatusBadgeProps) {
  const { label, dot, textColor, bgColor } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${textColor} ${bgColor}`}>
      <span>{dot}</span>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/feature-status-badge.test.tsx`
Expected: PASS

- [ ] **Step 5: Create FeatureRow component**

Create `components/FeatureRow.tsx`:

```tsx
import { FeatureStatusBadge } from './FeatureStatusBadge'

type FeatureStatus = 'MATCHED' | 'EXTRA' | 'MISSING' | 'REMOVED'

interface FeatureRowProps {
  id: string
  title: string
  description: string
  category?: string
  status?: FeatureStatus
  dimmed?: boolean
}

export function FeatureRow({ id, title, description, category, status, dimmed }: FeatureRowProps) {
  return (
    <div className={`py-3 px-4 rounded-lg border border-[var(--border)] transition-opacity ${dimmed ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {category && (
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{category}</p>
          )}
          <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{description}</p>
        </div>
        {status && (
          <div className="shrink-0 mt-0.5">
            <FeatureStatusBadge status={status} />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/FeatureStatusBadge.tsx components/FeatureRow.tsx tests/feature-status-badge.test.tsx
git commit -m "feat: feature status badge and feature row components"
```

---

### Task 6: Review Screen — Side-by-Side Diff + Approve/Reject

**Files:**
- Create: `app/projects/[id]/jobs/[jobId]/page.tsx`
- Create: `components/ApproveRejectBar.tsx`

The review screen shows:
- **Left column:** Knowledge Doc เดิม (official) — feature list ที่ approve แล้ว
- **Right column:** Project Update Doc ใหม่ — feature list ใหม่ + inline status badge ทุก feature

Feature status logic:
- MATCHED: feature id อยู่ใน requirements
- EXTRA: feature id ไม่อยู่ใน requirements (มีในโค้ดแต่ไม่ได้กำหนด)
- MISSING: feature id อยู่ใน requirements แต่ไม่มีในโค้ด (แสดงใน right column เป็น ghost row)
- REMOVED: feature เคยอยู่ใน Knowledge Doc เดิมแต่หายไปจาก Update Doc ใหม่

- [ ] **Step 1: Write failing test for ApproveRejectBar**

Create `tests/approve-reject-bar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApproveRejectBar } from '@/components/ApproveRejectBar'

test('calls onApprove when approve button clicked', async () => {
  const onApprove = vi.fn()
  const onReject = vi.fn()
  render(<ApproveRejectBar jobId="job-1" onApprove={onApprove} onReject={onReject} loading={false} />)
  await userEvent.click(screen.getByText('Approve → สร้าง Knowledge Doc'))
  expect(onApprove).toHaveBeenCalled()
})

test('disables buttons when loading', () => {
  render(<ApproveRejectBar jobId="job-1" onApprove={vi.fn()} onReject={vi.fn()} loading={true} />)
  expect(screen.getByText('กำลังดำเนินการ...')).toBeDisabled()
})
```

- [ ] **Step 2: Install userEvent**

```bash
npm install --save-dev @testing-library/user-event
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/approve-reject-bar.test.tsx`
Expected: FAIL

- [ ] **Step 4: Create ApproveRejectBar component**

Create `components/ApproveRejectBar.tsx`:

```tsx
'use client'

interface ApproveRejectBarProps {
  jobId: string
  onApprove: () => void
  onReject: () => void
  loading: boolean
}

export function ApproveRejectBar({ onApprove, onReject, loading }: ApproveRejectBarProps) {
  return (
    <div className="fixed bottom-0 right-0 left-60 bg-[var(--bg-card)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between z-10">
      <p className="text-sm text-[var(--text-muted)]">ตรวจสอบการเปลี่ยนแปลงแล้ว กด Approve เพื่อสร้าง Knowledge Doc version ใหม่</p>
      <div className="flex items-center gap-3">
        <button
          onClick={onReject}
          disabled={loading}
          className="bg-[var(--bg-hover)] hover:bg-[var(--border)] disabled:opacity-50 text-[var(--text-secondary)] text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ส่งกลับให้ Dev แก้ไข
        </button>
        <button
          onClick={onApprove}
          disabled={loading}
          className="bg-[var(--status-green)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? 'กำลังดำเนินการ...' : 'Approve → สร้าง Knowledge Doc'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/approve-reject-bar.test.tsx`
Expected: PASS

- [ ] **Step 6: Create Review Screen page**

Create `app/projects/[id]/jobs/[jobId]/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ReviewClient } from './ReviewClient'
import type { Feature, ValidationResult, DiffResult } from '@/lib/types'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string }>
}) {
  const { id, jobId } = await params

  const job = await db.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      updateDoc: true,
      project: {
        include: {
          knowledgeDocs: { orderBy: { version: 'desc' }, take: 1 },
          documentRequirements: { orderBy: { version: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!job || job.projectId !== id) notFound()
  if (!job.updateDoc) notFound()

  const latestKnowledgeDoc = job.project.knowledgeDocs[0]
  const requirements = job.project.documentRequirements[0]

  const oldFeatures = (latestKnowledgeDoc?.features as unknown as Feature[]) ?? []
  const newFeatures = (job.updateDoc.features as unknown as Feature[]) ?? []
  const validationResult = job.updateDoc.validationResult as unknown as ValidationResult | null
  const diffResult = job.updateDoc.diffResult as unknown as DiffResult | null
  const requirementFeatures = (requirements?.features as unknown as Feature[]) ?? []

  return (
    <ReviewClient
      jobId={jobId}
      projectId={id}
      oldFeatures={oldFeatures}
      newFeatures={newFeatures}
      requirementFeatures={requirementFeatures}
      validationResult={validationResult}
      diffResult={diffResult}
      updateDocStatus={job.updateDoc.status}
      commitSha={job.commitSha}
      commitMessage={job.commitMessage ?? ''}
    />
  )
}
```

- [ ] **Step 7: Create ReviewClient (Client Component)**

Create `app/projects/[id]/jobs/[jobId]/ReviewClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureRow } from '@/components/FeatureRow'
import { ApproveRejectBar } from '@/components/ApproveRejectBar'
import type { Feature, ValidationResult, DiffResult } from '@/lib/types'

type FeatureStatus = 'MATCHED' | 'EXTRA' | 'MISSING' | 'REMOVED'

interface ReviewClientProps {
  jobId: string
  projectId: string
  oldFeatures: Feature[]
  newFeatures: Feature[]
  requirementFeatures: Feature[]
  validationResult: ValidationResult | null
  diffResult: DiffResult | null
  updateDocStatus: string
  commitSha: string
  commitMessage: string
}

function getFeatureStatus(feature: Feature, requirementFeatures: Feature[]): FeatureStatus {
  if (requirementFeatures.length === 0) return 'EXTRA'
  const inReq = requirementFeatures.some(r => r.id === feature.id)
  return inReq ? 'MATCHED' : 'EXTRA'
}

export function ReviewClient({
  jobId,
  projectId,
  oldFeatures,
  newFeatures,
  requirementFeatures,
  validationResult,
  diffResult,
  updateDocStatus,
  commitSha,
  commitMessage,
}: ReviewClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const missingFeatures = validationResult?.missing ?? []

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateDocId: jobId }),
      })
      if (!res.ok) throw new Error('Approve failed')
      router.push(`/projects/${projectId}/knowledge`)
      router.refresh()
    } catch {
      setLoading(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function handleReject() {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', comment: rejectComment }),
      })
      if (!res.ok) throw new Error('Reject failed')
      setShowRejectModal(false)
      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch {
      setLoading(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  const isDone = updateDocStatus === 'APPROVED' || updateDocStatus === 'REJECTED'

  return (
    <div className="p-8 pb-28">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <code className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)]">
            {commitSha.slice(0, 7)}
          </code>
          {isDone && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              updateDocStatus === 'APPROVED'
                ? 'text-[var(--status-green)] bg-green-900/20'
                : 'text-[var(--status-red)] bg-red-900/20'
            }`}>
              {updateDocStatus === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
            </span>
          )}
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Review การเปลี่ยนแปลง</h2>
        {commitMessage && <p className="text-sm text-[var(--text-muted)] mt-1">{commitMessage}</p>}
      </div>

      {/* Stats bar */}
      {diffResult && (
        <div className="flex items-center gap-4 mb-6 text-sm">
          {diffResult.added.length > 0 && (
            <span className="text-[var(--status-green)]">+{diffResult.added.length} เพิ่ม</span>
          )}
          {diffResult.modified.length > 0 && (
            <span className="text-[var(--status-yellow)]">~{diffResult.modified.length} แก้ไข</span>
          )}
          {diffResult.removed.length > 0 && (
            <span className="text-[var(--status-red)]">-{diffResult.removed.length} ลบ</span>
          )}
          {missingFeatures.length > 0 && (
            <span className="text-[var(--status-red)]">⚠ {missingFeatures.length} ขาดจาก Requirement</span>
          )}
        </div>
      )}

      {/* Side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Knowledge Doc เดิม */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Knowledge Doc เดิม {oldFeatures.length > 0 && <span className="text-[var(--text-muted)]">({oldFeatures.length} features)</span>}
          </h3>
          {oldFeatures.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl">
              <p className="text-[var(--text-muted)] text-sm">ยังไม่มี Knowledge Doc</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">นี่คือ version แรก</p>
            </div>
          ) : (
            <div className="space-y-2">
              {oldFeatures.map((feature) => {
                const removedInNew = !newFeatures.some(f => f.id === feature.id)
                return (
                  <FeatureRow
                    key={feature.id}
                    id={feature.id}
                    title={feature.title}
                    description={feature.description}
                    category={feature.category}
                    dimmed={removedInNew}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Project Update Doc ใหม่ */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Project Update Doc ใหม่ <span className="text-[var(--text-muted)]">({newFeatures.length} features)</span>
          </h3>
          <div className="space-y-2">
            {newFeatures.map((feature) => {
              const status = getFeatureStatus(feature, requirementFeatures)
              return (
                <FeatureRow
                  key={feature.id}
                  id={feature.id}
                  title={feature.title}
                  description={feature.description}
                  category={feature.category}
                  status={status}
                />
              )
            })}
            {/* Missing features from requirements */}
            {missingFeatures.map((feature) => (
              <FeatureRow
                key={`missing-${feature.id}`}
                id={feature.id}
                title={feature.title}
                description={feature.description}
                category={feature.category}
                status="MISSING"
                dimmed={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Approve/Reject bar */}
      {!isDone && (
        <ApproveRejectBar
          jobId={jobId}
          onApprove={handleApprove}
          onReject={() => setShowRejectModal(true)}
          loading={loading}
        />
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">ส่งกลับให้ Dev แก้ไข</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">ระบุสิ่งที่ต้องการให้ Dev แก้ไข</p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="เช่น ขาด feature X ที่อยู่ใน requirement..."
              rows={4}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm py-2 rounded-lg hover:bg-[var(--border)] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 bg-[var(--status-red)] hover:opacity-90 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
              >
                {loading ? 'กำลังส่ง...' : 'ส่งกลับ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 9: Commit**

```bash
git add app/projects/[id]/jobs/ components/ApproveRejectBar.tsx tests/approve-reject-bar.test.tsx
git commit -m "feat: review screen with side-by-side diff and approve/reject flow"
```

---

### Task 7: Knowledge Doc Viewer (Versioned)

**Files:**
- Create: `components/KnowledgeDocViewer.tsx`
- Create: `app/projects/[id]/knowledge/page.tsx`

- [ ] **Step 1: Write failing test for KnowledgeDocViewer**

Create `tests/knowledge-doc-viewer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { KnowledgeDocViewer } from '@/components/KnowledgeDocViewer'
import type { Feature } from '@/lib/types'

const versions = [
  { id: 'doc-2', version: 2, features: [{ id: 'f1', title: 'Login', description: 'ล็อกอินด้วย email', category: 'Auth' }] as Feature[], createdAt: new Date('2026-05-19'), approvedBy: null },
  { id: 'doc-1', version: 1, features: [{ id: 'f1', title: 'Login v1', description: 'ล็อกอิน', category: 'Auth' }] as Feature[], createdAt: new Date('2026-05-18'), approvedBy: null },
]

test('renders version tabs', () => {
  render(<KnowledgeDocViewer versions={versions} />)
  expect(screen.getByText('V.2')).toBeInTheDocument()
  expect(screen.getByText('V.1')).toBeInTheDocument()
})

test('shows latest version features by default', () => {
  render(<KnowledgeDocViewer versions={versions} />)
  expect(screen.getByText('Login')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/knowledge-doc-viewer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create KnowledgeDocViewer component**

Create `components/KnowledgeDocViewer.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { FeatureRow } from './FeatureRow'
import type { Feature } from '@/lib/types'

interface KnowledgeDocVersion {
  id: string
  version: number
  features: Feature[]
  createdAt: Date
  approvedBy: string | null
}

interface KnowledgeDocViewerProps {
  versions: KnowledgeDocVersion[]
}

function groupByCategory(features: Feature[]): Record<string, Feature[]> {
  return features.reduce<Record<string, Feature[]>>((acc, f) => {
    const cat = f.category ?? 'ทั่วไป'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})
}

export function KnowledgeDocViewer({ versions }: KnowledgeDocViewerProps) {
  const [activeVersion, setActiveVersion] = useState(versions[0]?.version ?? 1)

  const current = versions.find(v => v.version === activeVersion)
  const grouped = current ? groupByCategory(current.features) : {}

  return (
    <div>
      {/* Version tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVersion(v.version)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeVersion === v.version
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            V.{v.version}
          </button>
        ))}
      </div>

      {/* Current version meta */}
      {current && (
        <div className="mb-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>{current.features.length} features</span>
          <span>•</span>
          <span>สร้าง {new Date(current.createdAt).toLocaleDateString('th-TH')}</span>
          {current.approvedBy && <span>• Approved โดย {current.approvedBy}</span>}
        </div>
      )}

      {/* Features grouped by category */}
      {Object.entries(grouped).map(([category, features]) => (
        <div key={category} className="mb-6">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">{category}</h3>
          <div className="space-y-2">
            {features.map((f) => (
              <FeatureRow key={f.id} id={f.id} title={f.title} description={f.description} />
            ))}
          </div>
        </div>
      ))}

      {current?.features.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">ยังไม่มี feature ใน version นี้</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/knowledge-doc-viewer.test.tsx`
Expected: PASS

- [ ] **Step 5: Create Knowledge Doc page**

Create `app/projects/[id]/knowledge/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { KnowledgeDocViewer } from '@/components/KnowledgeDocViewer'
import type { Feature } from '@/lib/types'

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const docs = await db.knowledgeDoc.findMany({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  const versions = docs.map((doc) => ({
    id: doc.id,
    version: doc.version,
    features: (doc.features as unknown as Feature[]) ?? [],
    createdAt: doc.createdAt,
    approvedBy: doc.approvedBy,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Knowledge Doc</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">เอกสารความรู้ official ของโปรเจกต์</p>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)] text-lg">ยังไม่มี Knowledge Doc</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">Knowledge Doc จะถูกสร้างเมื่อ PM/BA Approve Project Update Doc แรก</p>
        </div>
      ) : (
        <KnowledgeDocViewer versions={versions} />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/KnowledgeDocViewer.tsx app/projects/[id]/knowledge/page.tsx tests/knowledge-doc-viewer.test.tsx
git commit -m "feat: knowledge doc viewer with version tabs"
```

---

### Task 8: Document Requirement Upload Page

**Files:**
- Create: `components/RequirementsUpload.tsx`
- Create: `app/projects/[id]/requirements/page.tsx`

- [ ] **Step 1: Write failing test for RequirementsUpload**

Create `tests/requirements-upload.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { RequirementsUpload } from '@/components/RequirementsUpload'

test('renders upload area', () => {
  render(<RequirementsUpload projectId="proj-1" onSuccess={vi.fn()} />)
  expect(screen.getByText(/อัปโหลดไฟล์/i)).toBeInTheDocument()
})

test('shows supported file types', () => {
  render(<RequirementsUpload projectId="proj-1" onSuccess={vi.fn()} />)
  expect(screen.getByText(/xlsx.*docx.*pdf.*csv/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/requirements-upload.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create RequirementsUpload component**

Create `components/RequirementsUpload.tsx`:

```tsx
'use client'

import { useState, useRef, DragEvent } from 'react'

interface RequirementsUploadProps {
  projectId: string
  onSuccess: () => void
}

const SUPPORTED_TYPES = ['.xlsx', '.xls', '.docx', '.pdf', '.csv']
const SUPPORTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'text/csv',
]

export function RequirementsUpload({ projectId, onSuccess }: RequirementsUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ featureCount: number; version: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!SUPPORTED_MIME.includes(file.type) && !SUPPORTED_TYPES.some(ext => file.name.endsWith(ext))) {
      setError(`ไฟล์ประเภท ${file.name.split('.').pop()} ไม่รองรับ — รองรับ: xlsx, docx, pdf, csv`)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('projectId', projectId)
      const res = await fetch('/api/requirements/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult({ featureCount: data.features?.length ?? 0, version: data.version ?? 1 })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/5'
            : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
        />
        <div className="text-3xl mb-3">📂</div>
        <p className="text-[var(--text-primary)] font-medium">
          {loading ? 'กำลังวิเคราะห์ไฟล์...' : 'อัปโหลดไฟล์ Document Requirement'}
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          ลากไฟล์มาวางหรือคลิกเพื่อเลือก
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-2">รองรับ: xlsx, docx, pdf, csv</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-[var(--status-red)]/30 rounded-lg">
          <p className="text-[var(--status-red)] text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-900/20 border border-[var(--status-green)]/30 rounded-lg">
          <p className="text-[var(--status-green)] text-sm font-medium">
            ✓ อัปโหลดสำเร็จ — พบ {result.featureCount} features (Version {result.version})
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            ระบบจะใช้ feature list นี้เป็น Document Requirement version ใหม่
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/requirements-upload.test.tsx`
Expected: PASS

- [ ] **Step 5: Create Requirements page**

Create `app/projects/[id]/requirements/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { RequirementsPageClient } from './RequirementsPageClient'
import type { Feature } from '@/lib/types'

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const requirements = await db.documentRequirement.findMany({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })

  const current = requirements[0]
  const features = current ? (current.features as unknown as Feature[]) : []

  return (
    <RequirementsPageClient
      projectId={id}
      features={features}
      version={current?.version ?? 0}
      uploadedAt={current?.createdAt ?? null}
    />
  )
}
```

Create `app/projects/[id]/requirements/RequirementsPageClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequirementsUpload } from '@/components/RequirementsUpload'
import { FeatureRow } from '@/components/FeatureRow'
import type { Feature } from '@/lib/types'

interface RequirementsPageClientProps {
  projectId: string
  features: Feature[]
  version: number
  uploadedAt: Date | null
}

export function RequirementsPageClient({ projectId, features, version, uploadedAt }: RequirementsPageClientProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(features.length === 0)

  function handleUploadSuccess() {
    router.refresh()
    setShowUpload(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Document Requirement</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Feature list ที่เป็น source of truth ของโปรเจกต์</p>
          {version > 0 && uploadedAt && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Version {version} • อัปโหลด {new Date(uploadedAt).toLocaleDateString('th-TH')}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showUpload ? 'ยกเลิก' : 'อัปโหลด version ใหม่'}
        </button>
      </div>

      {showUpload && (
        <div className="mb-8">
          <RequirementsUpload projectId={projectId} onSuccess={handleUploadSuccess} />
        </div>
      )}

      {features.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)]">ยังไม่มี Document Requirement</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">อัปโหลดไฟล์เพื่อกำหนด feature list ของโปรเจกต์</p>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map((f) => (
            <FeatureRow key={f.id} id={f.id} title={f.title} description={f.description} category={f.category} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/RequirementsUpload.tsx app/projects/[id]/requirements/ tests/requirements-upload.test.tsx
git commit -m "feat: document requirement upload page with drag-and-drop"
```

---

### Task 9: TypeScript Check + Final Polish

**Files:**
- Various

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Fix any errors found. Common issues:
- Async params in Next.js 15: always use `const { id } = await params`
- Prisma JSON fields: cast with `as unknown as Feature[]`
- Missing `'use client'` on components that use hooks

- [ ] **Step 2: Run all tests one final time**

Run: `npx vitest run`
Expected: all tests pass (25+ tests)

- [ ] **Step 3: Check build compiles**

Run: `npx next build 2>&1 | tail -20`
Note: Build may warn about missing DATABASE_URL — this is expected in dev. Fix any actual errors.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: TypeScript and build issues in frontend UI"
```

---
