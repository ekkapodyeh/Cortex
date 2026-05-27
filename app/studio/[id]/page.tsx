export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import {
  BrowserIcon,
  TableIcon,
  NewspaperIcon,
  ListNumbersIcon,
} from '@phosphor-icons/react/dist/ssr'

const TOOLS = [
  {
    id: 'database-schemas',
    title: 'Database Schemas',
    description: 'Describes data elements and their attributes.',
    icon: BrowserIcon,
    badge: '34 are ready',
    active: true,
  },
  {
    id: 'master-data',
    title: 'Master Data',
    description: 'A stored set of precomputed values for quick lookups.',
    icon: TableIcon,
    badge: null,
    active: false,
  },
  {
    id: 'api-spec',
    title: 'API Spec',
    description: 'Defines how an API works.',
    icon: NewspaperIcon,
    badge: null,
    active: false,
  },
  {
    id: 'functional-list',
    title: 'Functional List',
    description: 'Describes data elements and their attributes.',
    icon: ListNumbersIcon,
    badge: null,
    active: false,
  },
]

export default async function WorkspaceStudioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  return (
    <div className="min-h-full flex items-start justify-center px-6 pt-16 pb-24">
      <div className="w-full max-w-[860px]">
      {/* Welcome */}
      <h1 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)] mb-10">
        Welcome to {project.name}
      </h1>

      {/* Cortex SA Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 mb-10 flex items-start justify-between gap-8">
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-2xl text-[var(--text-primary)]">
              Cortex SA
            </h2>
            <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-[520px]">
              The system auto-generates Data Tables, API URLs with logic, and test cases with Sequence diagrams from requirements to speed up development.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="bg-[var(--accent)] text-white text-sm font-medium px-5 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Start with Requirement
            </button>
            <button className="border border-[var(--border)] text-[var(--text-secondary)] text-sm px-5 py-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              Archive
            </button>
          </div>
        </div>
        <div className="text-[var(--text-muted)] opacity-30 shrink-0">
          <BrowserIcon size={80} />
        </div>
      </div>

      {/* Tools */}
      <div>
        <h2 className="font-semibold text-xl text-[var(--text-primary)] mb-5">
          Define your data tables.
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.id}
                className={`border rounded-2xl p-6 flex flex-col gap-6 cursor-pointer hover:border-[var(--accent)]/50 transition-colors ${
                  tool.active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'border-[var(--border)] bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <Icon
                    size={24}
                    className={tool.active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}
                  />
                  {tool.badge && (
                    <span className="text-[11px] bg-[var(--bg-hover)] text-[var(--text-muted)] px-2 py-0.5 rounded">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className={`font-semibold text-base ${tool.active ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                    {tool.title}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right panel placeholder info */}
      <div className="mt-10 border-t border-[var(--border)] pt-8 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Figma link</p>
          <p className="text-sm text-[var(--text-secondary)]">ยังไม่ได้เชื่อมต่อ Figma</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Contributors</p>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-semibold">
              {project.name.charAt(0)}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">You</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
