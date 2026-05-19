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
