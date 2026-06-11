export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectMock } from '@/lib/sprint-mocks'
import type { SprintReqItem } from './SprintReviewRightPanel'
import { SprintListCreateButton } from './SprintListCreateButton'

export default async function SprintReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const projectMock = getProjectMock(project.name)
  const mockRequirements = (projectMock?.requirements ?? []) as SprintReqItem[]

  const sprints = await db.sprint.findMany({
    where: { projectId: id },
    include: { requirements: true },
    orderBy: { createdAt: 'desc' },
  })

  const openSprint = sprints.find(s => s.status === 'OPEN') ?? null
  const closedSprints = sprints.filter(s => s.status === 'CLOSED')

  return (
    <div className="pt-[48px] px-[32px] pb-24 max-w-[896px] mx-auto flex flex-col gap-[48px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">Sprint Review</h2>
          <p className="text-sm text-[var(--text-muted)]">ติดตาม requirement แต่ละ Sprint</p>
        </div>
        {!openSprint && (
          <SprintListCreateButton projectId={id} mockRequirements={mockRequirements} />
        )}
      </div>

      {/* Empty state */}
      {sprints.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-base font-medium text-[var(--text-primary)]">ยังไม่มี Sprint</p>
          <p className="text-sm text-[var(--text-muted)]">สร้าง Sprint แรกเพื่อเริ่มติดตาม requirement</p>
        </div>
      )}

      {/* Open Sprint */}
      {openSprint && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">กำลังดำเนินการ</p>
          <SprintCard sprint={openSprint} projectId={id} mockRequirements={mockRequirements} />
        </div>
      )}

      {/* Closed Sprints */}
      {closedSprints.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">ประวัติ Sprint</p>
          {closedSprints.map(sprint => (
            <SprintCard key={sprint.id} sprint={sprint} projectId={id} mockRequirements={mockRequirements} />
          ))}
        </div>
      )}
    </div>
  )
}

function SprintCard({ sprint, projectId, mockRequirements }: {
  sprint: any
  projectId: string
  mockRequirements: SprintReqItem[]
}) {
  const reqCount = sprint.requirements.reduce((acc: number, r: any) => acc + (r.items as any[]).length, 0)

  return (
    <Link
      href={`/projects/${projectId}/sprint-review/${sprint.id}`}
      className="bg-[#222] rounded-xl p-5 flex items-center gap-4 hover:brightness-105 transition-all"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-base text-[var(--text-primary)]">{sprint.name}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            sprint.status === 'OPEN'
              ? 'text-[var(--status-green)] bg-[rgba(13,84,43,0.15)]'
              : 'text-[var(--text-muted)] bg-[var(--bg-hover)]'
          }`}>
            {sprint.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {reqCount > 0 ? `${reqCount} requirement` : 'ยังไม่มี requirement'} · {new Date(sprint.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
        </p>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--text-muted)] shrink-0">
        <path d="M5.25 2.917L9.333 7 5.25 11.083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  )
}
