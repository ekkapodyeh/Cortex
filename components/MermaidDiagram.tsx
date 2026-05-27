'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  code: string
}

let mermaidId = 0

export function MermaidDiagram({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const idRef = useRef(`mermaid-${++mermaidId}`)

  useEffect(() => {
    let cancelled = false
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          background: 'transparent',
          primaryColor: '#1e1e20',
          primaryTextColor: '#e4e4e7',
          primaryBorderColor: '#3f3f46',
          lineColor: '#71717a',
          secondaryColor: '#27272a',
          tertiaryColor: '#18181b',
          edgeLabelBackground: '#18181b',
          clusterBkg: '#1c1c1e',
          clusterBorder: '#3f3f46',
          titleColor: '#e4e4e7',
          nodeTextColor: '#e4e4e7',
        },
      })
      mermaid.render(idRef.current, code).then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered)
      }).catch(() => {
        if (!cancelled) setSvg('')
      })
    })
    return () => { cancelled = true }
  }, [code])

  if (!svg) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--text-muted)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{ transformOrigin: 'center' }}
      dangerouslySetInnerHTML={{ __html: svg }}
      className="max-w-none [&_svg]:max-w-none [&_svg]:h-auto"
    />
  )
}
