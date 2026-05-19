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
    orderBy: { triggeredAt: 'desc' },
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
                  <p className="text-sm text-[var(--text-secondary)] truncate">{job.commitMsg || 'ไม่มี commit message'}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(job.triggeredAt).toLocaleString('th-TH')}
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
