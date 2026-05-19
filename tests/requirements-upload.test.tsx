// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { RequirementsUpload } from '@/components/RequirementsUpload'

test('renders upload area', () => {
  render(<RequirementsUpload projectId="proj-1" onSuccess={vi.fn()} />)
  expect(screen.getByText(/อัปโหลดไฟล์/i)).toBeInTheDocument()
})

test('shows supported file types', () => {
  render(<RequirementsUpload projectId="proj-1" onSuccess={vi.fn()} />)
  expect(screen.getByText(/xlsx/i)).toBeInTheDocument()
})
