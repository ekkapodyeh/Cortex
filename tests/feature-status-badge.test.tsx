// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { FeatureStatusBadge } from '@/components/FeatureStatusBadge'

test('shows green badge for MATCHED', () => {
  render(<FeatureStatusBadge status="MATCHED" />)
  expect(screen.getByText('ตรง Req')).toBeInTheDocument()
})

test('shows yellow badge for EXTRA', () => {
  render(<FeatureStatusBadge status="EXTRA" />)
  expect(screen.getByText('ไม่อยู่ใน Req')).toBeInTheDocument()
})

test('shows red badge for MISSING', () => {
  render(<FeatureStatusBadge status="MISSING" />)
  expect(screen.getByText('ขาดหายไป')).toBeInTheDocument()
})

test('shows gray badge for REMOVED', () => {
  render(<FeatureStatusBadge status="REMOVED" />)
  expect(screen.getByText('ลบแล้ว')).toBeInTheDocument()
})
