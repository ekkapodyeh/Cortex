type JobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED'

interface JobStatusBadgeProps {
  status: JobStatus
}

const config: Record<JobStatus, { label: string; color: string }> = {
  QUEUED:  { label: 'รอคิว',          color: 'text-[var(--text-muted)] bg-[var(--bg-hover)]' },
  RUNNING: { label: 'กำลังวิเคราะห์', color: 'text-[var(--status-yellow)] bg-yellow-900/20' },
  DONE:    { label: 'เสร็จแล้ว',      color: 'text-[var(--status-green)] bg-green-900/20' },
  FAILED:  { label: 'ล้มเหลว',        color: 'text-[var(--status-red)] bg-red-900/20' },
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const { label, color } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
