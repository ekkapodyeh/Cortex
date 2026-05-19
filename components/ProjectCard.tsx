import Link from 'next/link'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    repoUrl: string
    platform: 'GITHUB' | 'GITLAB' | 'BITBUCKET'
    createdAt: Date
    _count: { jobs: number }
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
          <span>{project._count.jobs} งานวิเคราะห์</span>
          <span>•</span>
          <span>สร้าง {new Date(project.createdAt).toLocaleDateString('th-TH')}</span>
        </div>
      </div>
    </Link>
  )
}
