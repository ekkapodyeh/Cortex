// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/projects/test-id',
}))

test('renders Cortex logo', () => {
  render(<Sidebar projectId="test-id" projectName="My Project" />)
  expect(screen.getByText('Cortex')).toBeInTheDocument()
})

test('shows project name', () => {
  render(<Sidebar projectId="test-id" projectName="My Project" />)
  expect(screen.getByText('My Project')).toBeInTheDocument()
})
