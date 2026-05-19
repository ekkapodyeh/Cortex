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
