// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApproveRejectBar } from '@/components/ApproveRejectBar'

test('calls onApprove when approve button clicked', async () => {
  const onApprove = vi.fn()
  const onReject = vi.fn()
  render(<ApproveRejectBar jobId="job-1" onApprove={onApprove} onReject={onReject} loading={false} />)
  await userEvent.click(screen.getByText('Approve → สร้าง Knowledge Doc'))
  expect(onApprove).toHaveBeenCalled()
})

test('disables buttons when loading', () => {
  render(<ApproveRejectBar jobId="job-1" onApprove={vi.fn()} onReject={vi.fn()} loading={true} />)
  expect(screen.getByText('กำลังดำเนินการ...')).toBeDisabled()
})
