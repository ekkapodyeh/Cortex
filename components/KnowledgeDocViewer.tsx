'use client'

import { useState } from 'react'
import { FeatureRow } from './FeatureRow'
import type { Feature } from '@/lib/types'

interface KnowledgeDocVersion {
  id: string
  version: number
  features: Feature[]
  createdAt: Date
  approvedBy: string | null
}

interface KnowledgeDocViewerProps {
  versions: KnowledgeDocVersion[]
}

function groupByCategory(features: Feature[]): Record<string, Feature[]> {
  return features.reduce<Record<string, Feature[]>>((acc, f) => {
    const cat = f.category ?? 'ทั่วไป'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})
}

export function KnowledgeDocViewer({ versions }: KnowledgeDocViewerProps) {
  const [activeVersion, setActiveVersion] = useState(versions[0]?.version ?? 1)

  const current = versions.find(v => v.version === activeVersion)
  const grouped = current ? groupByCategory(current.features) : {}

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVersion(v.version)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeVersion === v.version
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]'
            }`}
          >
            V.{v.version}
          </button>
        ))}
      </div>

      {current && (
        <div className="mb-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>{current.features.length} features</span>
          <span>•</span>
          <span>สร้าง {new Date(current.createdAt).toLocaleDateString('th-TH')}</span>
          {current.approvedBy && <><span>•</span><span>Approved โดย {current.approvedBy}</span></>}
        </div>
      )}

      {Object.entries(grouped).map(([category, features]) => (
        <div key={category} className="mb-6">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">{category}</h3>
          <div className="space-y-2">
            {features.map((f) => (
              <FeatureRow key={f.id} id={f.id} title={f.title} description={f.description} />
            ))}
          </div>
        </div>
      ))}

      {current?.features.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">ยังไม่มี feature ใน version นี้</p>
        </div>
      )}
    </div>
  )
}
