// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '@/components/ProjectCard'

const mockProject = {
  id: 'proj-1',
  name: 'My API',
  repoUrl: 'https://github.com/org/api',
  platform: 'GITHUB' as const,
  createdAt: new Date('2026-05-19'),
  _count: { jobs: 5 },
}

test('renders project name', () => {
  render(<ProjectCard project={mockProject} />)
  expect(screen.getByText('My API')).toBeInTheDocument()
})

test('renders repo URL', () => {
  render(<ProjectCard project={mockProject} />)
  expect(screen.getByText('https://github.com/org/api')).toBeInTheDocument()
})

test('renders job count', () => {
  render(<ProjectCard project={mockProject} />)
  expect(screen.getByText('5 งานวิเคราะห์')).toBeInTheDocument()
})
