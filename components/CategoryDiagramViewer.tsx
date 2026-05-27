'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MinusIcon, PlusIcon, ArrowsOutIcon } from '@phosphor-icons/react'
import { MermaidDiagram } from './MermaidDiagram'

interface Props {
  projectId: string
  category: string
  initialDiagram: string | null
}

const STEP = 0.25
const MIN = 0.25
const MAX = 3

export function CategoryDiagramViewer({ projectId, category, initialDiagram }: Props) {
  const [diagram, setDiagram] = useState<string | null>(initialDiagram)
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const generate = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (res.ok) {
        const { diagram } = await res.json()
        setDiagram(diagram)
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, category])

  const zoomIn = () => setScale(s => Math.min(+(s + STEP).toFixed(2), MAX))
  const zoomOut = () => setScale(s => Math.max(+(s - STEP).toFixed(2), MIN))

  const openFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen?.()
  }, [])

  // ── Drag to pan ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      setTranslate(t => ({ x: t.x + dx, y: t.y + dy }))
    }
    const onMouseUp = () => { isDragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Reset pan when diagram changes
  useEffect(() => { setTranslate({ x: 0, y: 0 }); setScale(1) }, [diagram])

  return (
    <div
      ref={containerRef}
      className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      <div
        className="w-full h-full flex items-center justify-center select-none"
        style={{ cursor: isDragging.current ? 'grabbing' : diagram ? 'grab' : 'default' }}
        onMouseDown={onMouseDown}
      >
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--text-muted)] rounded-full animate-spin" />
            <p className="text-xs text-[var(--text-muted)]">กำลังสร้าง diagram…</p>
          </div>
        )}
        {!loading && !diagram && (
          <div className="text-center px-6">
            <p className="text-sm text-[var(--text-muted)] mb-4">ยังไม่มี System Flow Diagram</p>
            <button
              onClick={generate}
              className="text-xs px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              สร้าง Diagram อัตโนมัติ
            </button>
          </div>
        )}
        {!loading && diagram && (
          <div
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: isDragging.current ? 'none' : 'transform 0.15s ease',
            }}
          >
            <MermaidDiagram code={diagram} />
          </div>
        )}
      </div>

      {diagram && !loading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-base)]">
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
      )}
    </div>
  )
}
