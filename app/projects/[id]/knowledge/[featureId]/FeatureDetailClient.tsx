'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BrowserIcon,
  CodeIcon,
  CaretRightIcon,
  CaretDownIcon,
  CopyIcon,
  CheckIcon,
} from '@phosphor-icons/react'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import type { Feature, TechnicalSpec, APIEndpoint } from '@/lib/types'

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-[rgba(76,175,80,0.15)] text-[#4caf50]',
  POST: 'bg-[rgba(255,152,0,0.15)] text-[#ff9800]',
  PUT: 'bg-[rgba(33,150,243,0.15)] text-[#2196f3]',
  PATCH: 'bg-[rgba(156,39,176,0.15)] text-[#9c27b0]',
  DELETE: 'bg-[rgba(244,67,54,0.15)] text-[#f44336]',
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{label}</p>
      )}
      <div className="relative bg-[var(--bg-base)] border border-[var(--border)] rounded-lg overflow-hidden">
        <button
          onClick={copy}
          className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
        >
          {copied ? <CheckIcon size={12} weight="bold" /> : <CopyIcon size={12} />}
          Copy code
        </button>
        <pre className="p-4 pr-24 text-xs text-[var(--text-secondary)] overflow-x-auto leading-relaxed whitespace-pre-wrap font-mono">
          {code}
        </pre>
      </div>
    </div>
  )
}

function APIEndpointItem({ endpoint }: { endpoint: APIEndpoint }) {
  const [open, setOpen] = useState(false)
  const methodStyle = METHOD_STYLES[endpoint.method] ?? 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
  const hasDetails =
    !!(endpoint.headers && Object.keys(endpoint.headers).length > 0) ||
    !!endpoint.requestBody ||
    !!endpoint.response

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => hasDetails && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 transition-colors ${
          hasDetails ? 'hover:bg-[var(--bg-hover)] cursor-pointer' : 'cursor-default'
        }`}
      >
        <span className={`text-xs font-bold px-2.5 py-1 rounded font-mono shrink-0 ${methodStyle}`}>
          {endpoint.method}
        </span>
        <span className="text-sm text-[var(--text-secondary)] font-mono flex-1 text-left">
          {endpoint.path}
        </span>
        {hasDetails && (
          open
            ? <CaretDownIcon size={14} className="text-[var(--text-muted)] shrink-0" />
            : <CaretRightIcon size={14} className="text-[var(--text-muted)] shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] px-5 py-4 space-y-4">
          {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Headers
              </p>
              <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-4 py-3">
                {Object.entries(endpoint.headers).map(([k, v]) => (
                  <p key={k} className="text-xs text-[var(--text-secondary)] font-mono">
                    {k}: {v}
                  </p>
                ))}
              </div>
            </div>
          )}
          {endpoint.requestBody && (
            <CodeBlock code={endpoint.requestBody} label="Request Body" />
          )}
          {endpoint.response && (
            <CodeBlock code={endpoint.response} label="Response" />
          )}
        </div>
      )}
    </div>
  )
}

function TechnicalContent({ spec }: { spec?: TechnicalSpec }) {
  if (!spec) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
          <CodeIcon size={18} className="text-[var(--text-muted)]" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          ยังไม่มีข้อมูล Technical Spec สำหรับ feature นี้
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 mt-8 pb-16">
      {spec.sequenceDiagram && (
        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Sequence Diagram
          </h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden p-6">
            <MermaidDiagram code={spec.sequenceDiagram} />
          </div>
        </section>
      )}

      {spec.apiEndpoints && spec.apiEndpoints.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">API Spec</h2>
          <div className="space-y-2">
            {spec.apiEndpoints.map((ep, i) => (
              <APIEndpointItem key={i} endpoint={ep} />
            ))}
          </div>
        </section>
      )}

      {spec.pages && spec.pages.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Pages (Frontend API Usage)
          </h2>
          <div className="space-y-3">
            {spec.pages.map((page, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                  {page.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {page.endpoints.map((ep, j) => {
                    const ms = METHOD_STYLES[ep.method] ?? 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                    return (
                      <span key={j} className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${ms}`}>
                        {ep.method}
                      </span>
                    )
                  })}
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {page.path}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  # {page.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {spec.databaseTables && spec.databaseTables.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Database Schema
          </h2>
          <div className="space-y-5">
            {spec.databaseTables.map((table, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1 font-mono">
                  {table.name}
                </p>
                {table.description && (
                  <p className="text-xs text-[var(--text-muted)] mb-3">{table.description}</p>
                )}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[140px_140px_1fr] border-b border-[var(--border)] bg-[var(--bg-hover)]">
                    <p className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Column
                    </p>
                    <p className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Type
                    </p>
                    <p className="px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Description
                    </p>
                  </div>
                  {table.columns.map((col, j) => (
                    <div
                      key={j}
                      className={`grid grid-cols-[140px_140px_1fr] ${
                        j < table.columns.length - 1 ? 'border-b border-[var(--border)]' : ''
                      }`}
                    >
                      <div className="px-4 py-3 flex items-center gap-1.5">
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                          {col.name}
                        </span>
                        {col.primaryKey && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,152,0,0.15)] text-[#ff9800] font-medium leading-none">
                            PK
                          </span>
                        )}
                      </div>
                      <div className="px-4 py-3">
                        <span className="text-xs font-mono text-[var(--text-muted)]">{col.type}</span>
                      </div>
                      <div className="px-4 py-3">
                        <span className="text-xs text-[var(--text-secondary)]">{col.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function BusinessContent({
  projectId,
  feature,
  relatedFeatures,
  userCases,
}: {
  projectId: string
  feature: Feature
  relatedFeatures: Feature[]
  userCases: { label: string; steps: string[] }[]
}) {
  return (
    <div>
      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Item details</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[180px_1fr] border-b border-[var(--border)] bg-[var(--bg-hover)]">
            <p className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Field name
            </p>
            <p className="px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Validations
            </p>
          </div>
          <div className="grid grid-cols-[180px_1fr]">
            <div className="px-5 py-4 border-r border-[var(--border)]">
              <span className="inline-block text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)] px-2.5 py-1 rounded font-mono">
                {feature.id}
              </span>
            </div>
            <div className="px-5 py-4 space-y-1.5">
              <p className="text-sm text-[var(--text-secondary)] flex gap-2">
                <span className="shrink-0">•</span> {feature.description}
              </p>
              <p className="text-sm text-[var(--text-muted)] flex gap-2">
                <span className="shrink-0">•</span> จำเป็นต้องระบุ (Required)
              </p>
              <p className="text-sm text-[var(--text-muted)] flex gap-2">
                <span className="shrink-0">•</span> ความยาวไม่เกิน 255 ตัวอักษร
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Feature Conditions</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{feature.title}</p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">เงื่อนไขเพิ่มเติม</p>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 space-y-1.5">
              <p className="text-sm text-[var(--text-secondary)]">• ผู้ใช้ต้องล็อกอินก่อนเข้าถึง feature นี้</p>
              <p className="text-sm text-[var(--text-secondary)]">• ระบบต้องรองรับ session ที่ยังไม่หมดอายุ</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Roles & Action</h2>
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">1. ผู้ใช้งานทั่วไป</p>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 space-y-1.5">
            <p className="text-sm text-[var(--text-secondary)] flex gap-2">
              <span className="shrink-0">•</span>
              เข้าถึงและใช้งาน {feature.title}
            </p>
            <p className="text-sm text-[var(--text-secondary)] flex gap-2">
              <span className="shrink-0">•</span>
              {feature.description}
            </p>
            <p className="text-sm text-[var(--text-secondary)] flex gap-2">
              <span className="shrink-0">•</span>
              แก้ไขข้อมูลส่วนตัวที่เกี่ยวข้องกับ feature นี้ได้
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">User Case</h2>
        <div className="space-y-3">
          {userCases.map(({ label, steps }) => (
            <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4">
              <p className="text-sm text-[var(--text-secondary)] mb-3">{label}</p>
              <div className="flex flex-wrap gap-2">
                {steps.map((step, i) => (
                  <span
                    key={i}
                    className="text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border)] px-3 py-1.5 rounded-full"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {relatedFeatures.length > 0 && (
        <section className="mt-8 pb-16">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Connections to Other Related Features
          </h2>
          <div className="space-y-2">
            {relatedFeatures.map((f) => (
              <p key={f.id} className="text-sm text-[var(--text-secondary)] flex gap-2">
                <span className="shrink-0">•</span>
                <span>
                  <Link
                    href={`/projects/${projectId}/knowledge/${f.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {f.title}
                  </Link>
                  {' — '}
                  {f.description}
                </span>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface Props {
  projectId: string
  feature: Feature
  relatedFeatures: Feature[]
  userCases: { label: string; steps: string[] }[]
}

export function FeatureDetailClient({ projectId, feature, relatedFeatures, userCases }: Props) {
  const [tab, setTab] = useState<'business' | 'technical'>('business')
  const spec = feature.technicalSpec

  return (
    <div className="max-w-3xl mx-auto px-10 py-10">
      <p className="text-xs text-[var(--text-muted)] mb-5 flex items-center gap-1.5">
        <Link
          href={`/projects/${projectId}/knowledge`}
          className="hover:text-[var(--text-primary)] transition-colors"
        >
          Business Overview
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">{feature.category}</span>
        <span>/</span>
        <span className="text-[var(--text-primary)]">{feature.title}</span>
      </p>

      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{feature.title}</h1>

      <div className="flex gap-0 mt-5 border-b border-[var(--border)]">
        <button
          onClick={() => setTab('business')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'business'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <BrowserIcon size={14} className="shrink-0" />
          Business
        </button>
        <button
          onClick={() => setTab('technical')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'technical'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <CodeIcon size={14} className="shrink-0" />
          Technical
        </button>
      </div>

      {tab === 'business' ? (
        <BusinessContent
          projectId={projectId}
          feature={feature}
          relatedFeatures={relatedFeatures}
          userCases={userCases}
        />
      ) : (
        <TechnicalContent spec={spec} />
      )}
    </div>
  )
}
