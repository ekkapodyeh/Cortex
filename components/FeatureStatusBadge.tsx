type FeatureStatus = 'MATCHED' | 'EXTRA' | 'MISSING' | 'REMOVED'

interface FeatureStatusBadgeProps {
  status: FeatureStatus
}

const config: Record<FeatureStatus, { label: string; dot: string; textColor: string; bgColor: string }> = {
  MATCHED: { label: 'ตรง Req',        dot: '🟢', textColor: 'text-[var(--status-green)]',  bgColor: 'bg-green-900/20' },
  EXTRA:   { label: 'ไม่อยู่ใน Req',  dot: '🟡', textColor: 'text-[var(--status-yellow)]', bgColor: 'bg-yellow-900/20' },
  MISSING: { label: 'ขาดหายไป',       dot: '🔴', textColor: 'text-[var(--status-red)]',    bgColor: 'bg-red-900/20' },
  REMOVED: { label: 'ลบแล้ว',         dot: '⚫', textColor: 'text-[var(--text-muted)]',    bgColor: 'bg-[var(--bg-hover)]' },
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
