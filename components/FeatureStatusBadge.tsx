type FeatureStatus = 'MATCHED' | 'EXTRA' | 'MISSING' | 'REMOVED' | 'ADDED'

export type { FeatureStatus }

interface FeatureStatusBadgeProps {
  status: FeatureStatus
}

const config: Record<FeatureStatus, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  MATCHED: { label: 'ตรง Req',        dotColor: 'bg-[var(--status-green)]',   textColor: 'text-[var(--status-green)]',  bgColor: 'bg-green-900/20' },
  ADDED:   { label: 'เพิ่มใหม่',      dotColor: 'bg-[var(--status-green)]',   textColor: 'text-[var(--status-green)]',  bgColor: 'bg-green-900/20' },
  EXTRA:   { label: 'ไม่อยู่ใน Req',  dotColor: 'bg-[var(--status-yellow)]',  textColor: 'text-[var(--status-yellow)]', bgColor: 'bg-yellow-900/20' },
  MISSING: { label: 'ขาดหายไป',       dotColor: 'bg-[var(--status-red)]',     textColor: 'text-[var(--status-red)]',    bgColor: 'bg-red-900/20' },
  REMOVED: { label: 'ลบแล้ว',         dotColor: 'bg-[var(--text-muted)]',     textColor: 'text-[var(--text-muted)]',    bgColor: 'bg-[var(--bg-hover)]' },
}

export function FeatureStatusBadge({ status }: FeatureStatusBadgeProps) {
  const { label, dotColor, textColor, bgColor } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${textColor} ${bgColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      {label}
    </span>
  )
}
