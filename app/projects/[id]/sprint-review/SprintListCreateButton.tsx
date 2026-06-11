'use client'

import { useState } from 'react'
import { PlusIcon } from '@phosphor-icons/react'
import type { SprintReqItem } from './SprintReviewRightPanel'
import { CreateSprintModal } from './CreateSprintModal'

export function SprintListCreateButton({ projectId, mockRequirements }: {
  projectId: string
  mockRequirements: SprintReqItem[]
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && (
        <CreateSprintModal
          projectId={projectId}
          sprintNumber={1}
          mockRequirements={mockRequirements}
          onClose={() => setShowModal(false)}
        />
      )}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <PlusIcon size={16} />
        สร้าง Bolt
      </button>
    </>
  )
}
