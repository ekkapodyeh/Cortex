'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequirementsUpload } from '@/components/RequirementsUpload'
import { FeatureRow } from '@/components/FeatureRow'
import type { Feature } from '@/lib/types'

interface RequirementsPageClientProps {
  projectId: string
  features: Feature[]
  version: number
  uploadedAt: Date | null
}

export function RequirementsPageClient({ projectId, features, version, uploadedAt }: RequirementsPageClientProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(features.length === 0)

  function handleUploadSuccess() {
    router.refresh()
    setShowUpload(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Document Requirement</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Feature list ที่เป็น source of truth ของโปรเจกต์</p>
          {version > 0 && uploadedAt && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Version {version} • อัปโหลด {new Date(uploadedAt).toLocaleDateString('th-TH')}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showUpload ? 'ยกเลิก' : 'อัปโหลด version ใหม่'}
        </button>
      </div>

      {showUpload && (
        <div className="mb-8">
          <RequirementsUpload projectId={projectId} onSuccess={handleUploadSuccess} />
        </div>
      )}

      {features.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)]">ยังไม่มี Document Requirement</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">อัปโหลดไฟล์เพื่อกำหนด feature list ของโปรเจกต์</p>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map((f) => (
            <FeatureRow key={f.id} id={f.id} title={f.title} description={f.description} category={f.category} />
          ))}
        </div>
      )}
    </div>
  )
}
