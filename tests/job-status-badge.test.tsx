// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { JobStatusBadge } from '@/components/JobStatusBadge'

test('shows QUEUED badge', () => {
  render(<JobStatusBadge status="QUEUED" />)
  expect(screen.getByText('รอคิว')).toBeInTheDocument()
})

test('shows RUNNING badge', () => {
  render(<JobStatusBadge status="RUNNING" />)
  expect(screen.getByText('กำลังวิเคราะห์')).toBeInTheDocument()
})

test('shows DONE badge', () => {
  render(<JobStatusBadge status="DONE" />)
  expect(screen.getByText('เสร็จแล้ว')).toBeInTheDocument()
})

test('shows FAILED badge', () => {
  render(<JobStatusBadge status="FAILED" />)
  expect(screen.getByText('ล้มเหลว')).toBeInTheDocument()
})
