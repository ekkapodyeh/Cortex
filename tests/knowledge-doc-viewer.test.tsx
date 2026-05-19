// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeDocViewer } from '@/components/KnowledgeDocViewer'
import type { Feature } from '@/lib/types'

const versions = [
  {
    id: 'doc-2',
    version: 2,
    features: [{ id: 'f1', title: 'Login', description: 'ล็อกอินด้วย email', category: 'Auth' }] as Feature[],
    createdAt: new Date('2026-05-19'),
    approvedBy: null,
  },
  {
    id: 'doc-1',
    version: 1,
    features: [{ id: 'f1', title: 'Login v1', description: 'ล็อกอิน', category: 'Auth' }] as Feature[],
    createdAt: new Date('2026-05-18'),
    approvedBy: null,
  },
]

test('renders version tabs', () => {
  render(<KnowledgeDocViewer versions={versions} />)
  expect(screen.getByText('V.2')).toBeInTheDocument()
  expect(screen.getByText('V.1')).toBeInTheDocument()
})

test('shows latest version features by default', () => {
  render(<KnowledgeDocViewer versions={versions} />)
  expect(screen.getByText('Login')).toBeInTheDocument()
})

test('switches to older version on click', async () => {
  render(<KnowledgeDocViewer versions={versions} />)
  await userEvent.click(screen.getByText('V.1'))
  expect(screen.getByText('Login v1')).toBeInTheDocument()
})
