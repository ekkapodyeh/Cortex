export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { Feature, DiffResult } from '@/lib/types'
import { HistoryItem } from './HistoryItem'

type SprintReqItem = { featureId: string; changeType: 'add' | 'modify' | 'remove' }

export default async function SprintHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project) notFound()

  const history = await db.knowledgeDoc.findMany({
    where: { projectId: id },
    orderBy: { version: 'desc' },
    include: {
      sourceJob: {
        select: {
          commitSha: true,
          commitMsg: true,
          author: true,
          triggeredAt: true,
          updateDoc: { select: { diff: true } },
          sprintRequirements: { select: { items: true } },
        },
      },
    },
  })

  return (
    <div className="pt-[48px] px-[32px] pb-24">
      <div className="max-w-[808px] mx-auto flex flex-col gap-[48px]">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/projects/${id}/sprint-review`}
            className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <CaretLeftIcon size={12} />
            Sprint Review
          </Link>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-[30px] leading-[45px] text-[var(--text-primary)]">ประวัติการอัปเดต Knowledge</h2>
            <p className="text-sm text-[var(--text-muted)]">รายการที่เปลี่ยนแปลงในแต่ละ version</p>
          </div>
        </div>

        {/* Content */}
        {history.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">ยังไม่มีประวัติ</p>
            <p className="text-xs text-[var(--text-muted)]">อัปเดต Knowledge Doc ครั้งแรกเพื่อเริ่มบันทึกประวัติ</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map(doc => {
              const diff = doc.sourceJob?.updateDoc?.diff as unknown as DiffResult | null
              const features = (doc.features as unknown as Feature[]) ?? []

              const allReqItems = doc.sourceJob?.sprintRequirements?.flatMap(r => r.items as unknown as SprintReqItem[]) ?? []
              let doneCount = 0
              for (const req of allReqItems) {
                const match =
                  (req.changeType === 'add'    && (diff?.added    ?? []).some((f: any) => f.id === req.featureId)) ||
                  (req.changeType === 'modify' && (diff?.modified ?? []).some((c: any) => c.new.id === req.featureId)) ||
                  (req.changeType === 'remove' && (diff?.removed  ?? []).some((f: any) => f.id === req.featureId))
                if (match) doneCount++
              }
              const totalReq = allReqItems.length

              return (
                <HistoryItem
                  key={doc.id}
                  version={doc.version}
                  approvedBy={doc.approvedBy}
                  createdAt={doc.createdAt.toISOString()}
                  featureCount={features.length}
                  commitSha={doc.sourceJob?.commitSha ?? null}
                  commitMsg={doc.sourceJob?.commitMsg ?? null}
                  author={doc.sourceJob?.author ?? null}
                  diff={diff}
                  knowledgeHref={`/projects/${id}/knowledge`}
                  doneCount={totalReq > 0 ? doneCount : null}
                  totalReq={totalReq > 0 ? totalReq : null}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
