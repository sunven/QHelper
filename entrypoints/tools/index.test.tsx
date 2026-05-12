import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ToolsRoutes } from './index'

vi.mock('@/components/tool/settings', () => ({
  SettingsPage: () => <div>Settings route content</div>,
}))

vi.mock('@/components/tool/ToolWorkspaceShell', () => ({
  ToolWorkspaceShell: ({
    children,
    pageTitle,
  }: {
    children: ReactNode
    pageTitle?: string
  }) => (
    <section>
      <h1>{pageTitle}</h1>
      {children}
    </section>
  ),
}))

vi.mock('./ToolActivityOutlet', () => ({
  ToolActivityOutlet: () => <div>Tool route content</div>,
}))

function CurrentPath() {
  const location = useLocation()
  return <div data-testid="current-path">{location.pathname}</div>
}

describe('ToolsRoutes', () => {
  it('opens settings from the generated settings.html alias', () => {
    render(
      <MemoryRouter initialEntries={['/settings.html']}>
        <CurrentPath />
        <ToolsRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '设置' })).toBeVisible()
    expect(screen.getByText('Settings route content')).toBeVisible()
    expect(screen.queryByText('Tool route content')).not.toBeInTheDocument()
  })

  it('redirects the legacy settings route to settings.html', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <CurrentPath />
        <ToolsRoutes />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-path')).toHaveTextContent(
        '/settings.html',
      )
    })
    expect(screen.getByText('Settings route content')).toBeVisible()
  })
})
