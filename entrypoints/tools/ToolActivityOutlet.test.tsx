import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { ToolActivityOutlet } from './ToolActivityOutlet'

vi.mock('@/components/tool/tool-routes', () => ({
  toolRoutes: [
    {
      id: 'uuid',
      preserveActivity: true,
      Component: () => {
        const [value, setValue] = useState('')
        return (
          <section>
            <h1>UUID Mock</h1>
            <textarea
              aria-label="UUID input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            {value ? <output role="status">{value}</output> : null}
          </section>
        )
      },
    },
    {
      id: 'downloads',
      preserveActivity: true,
      Component: () => (
        <section>
          <h1>Downloads Mock</h1>
          <p>Download results</p>
        </section>
      ),
    },
    {
      id: 'auto-refresh',
      preserveActivity: false,
      Component: () => {
        useEffect(() => {
          window.dispatchEvent(new CustomEvent('auto-refresh-mounted'))

          return () => {
            window.dispatchEvent(new CustomEvent('auto-refresh-unmounted'))
          }
        }, [])

        return (
          <section>
            <h1>Auto Refresh Mock</h1>
            <p>Auto Refresh results</p>
          </section>
        )
      },
    },
  ],
}))

vi.mock('@/components/ToolSideNavigation', () => ({
  ToolSideNavigation: () => <nav data-testid="tool-side-navigation">Tools</nav>,
}))

function RouteControls() {
  const navigate = useNavigate()

  return (
    <div>
      <button type="button" onClick={() => void navigate('/downloads.html')}>
        Go downloads
      </button>
      <button type="button" onClick={() => void navigate('/uuid.html')}>
        Go uuid
      </button>
      <button type="button" onClick={() => void navigate('/auto-refresh.html')}>
        Go auto-refresh
      </button>
    </div>
  )
}

describe('ToolActivityOutlet', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  })

  it('redirects the removed text preview route to the default tool', async () => {
    render(
      <MemoryRouter initialEntries={['/text-preview.html']}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Auto Refresh Mock')).toBeVisible()
  })

  it.each([
    '/formatter.html',
    '/htmlformat.html',
    '/xmlformatter.html',
    '/csstool.html',
  ])('redirects the removed formatter route %s to the default tool', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Auto Refresh Mock')).toBeVisible()
  })

  it.each([
    '/markdown.html',
    '/urlparser.html',
    '/filemerge.html',
    '/svgoptimizer.html',
  ])('redirects the removed Web 格式 route %s to the default tool', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Auto Refresh Mock')).toBeVisible()
  })

  it.each([
    '/cron.html',
    '/csv2json.html',
    '/yaml.html',
    '/toml.html',
    '/jsonschema.html',
  ])('redirects the removed 数据格式 route %s to the default tool', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Auto Refresh Mock')).toBeVisible()
  })

  it('keeps React and DOM state when switching visited tools', async () => {
    render(
      <MemoryRouter initialEntries={['/uuid.html']}>
        <RouteControls />
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    const input = screen.getByLabelText('UUID input')
    fireEvent.change(input, { target: { value: '{"a":1}' } })
    expect(screen.getByRole('status')).toHaveTextContent('{"a":1}')

    fireEvent.click(screen.getByRole('button', { name: 'Go downloads' }))

    await waitFor(() => {
      expect(screen.getByText('Downloads Mock')).toBeVisible()
    })
    expect(screen.getByLabelText('UUID input')).not.toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Go uuid' }))

    await waitFor(() => {
      expect(screen.getByLabelText('UUID input')).toHaveValue('{"a":1}')
    })
    expect(screen.getByRole('status')).toHaveTextContent('{"a":1}')
  })

  it('unmounts tools that opt out of hidden activity preservation', async () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    window.addEventListener('auto-refresh-mounted', mounted)
    window.addEventListener('auto-refresh-unmounted', unmounted)

    render(
      <MemoryRouter initialEntries={['/auto-refresh.html']}>
        <RouteControls />
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Auto Refresh Mock')).toBeVisible()
    })
    expect(mounted).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Go uuid' }))

    await waitFor(() => {
      expect(screen.getByText('UUID Mock')).toBeVisible()
    })
    await waitFor(() => {
      expect(unmounted).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByText('Auto Refresh Mock')).toBeNull()

    window.removeEventListener('auto-refresh-mounted', mounted)
    window.removeEventListener('auto-refresh-unmounted', unmounted)
  })
})