'use client'

import { useState, useRef, useCallback } from 'react'
import { MinusIcon, PlusIcon, ArrowsOutIcon } from '@phosphor-icons/react'

interface Props {
  src: string
  alt?: string
}

const STEP = 0.25
const MIN = 0.25
const MAX = 3

export function DiagramViewer({ src, alt = 'Flow diagram' }: Props) {
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const zoomIn = () => setScale(s => Math.min(+(s + STEP).toFixed(2), MAX))
  const zoomOut = () => setScale(s => Math.max(+(s - STEP).toFixed(2), MIN))

  const openFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen?.()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      {/* diagram area */}
      <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.15s ease' }}
          className="max-w-none"
          draggable={false}
        />
      </div>

      {/* zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-base)]">
        <button
          onClick={zoomOut}
          disabled={scale <= MIN}
          className="px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <MinusIcon size={14} weight="bold" />
        </button>
        <span className="px-3 py-2 text-xs text-[var(--text-secondary)] border-x border-[var(--border)] min-w-[52px] text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= MAX}
          className="px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <PlusIcon size={14} weight="bold" />
        </button>
        <button
          onClick={openFullscreen}
          className="px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors border-l border-[var(--border)]"
        >
          <ArrowsOutIcon size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}
