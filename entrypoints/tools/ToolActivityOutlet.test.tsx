import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { ToolActivityOutlet } from './ToolActivityOutlet'

vi.mock('@/components/tool/tool-routes', () => ({
  toolRoutes: [
    {
      id: 'json',
      preserveActivity: true,
      Component: () => {
        const [value, setValue] = useState('')
        return (
          <section>
            <h1>JSON Mock</h1>
            <textarea
              aria-label="JSON input"
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
      id: 'ocr',
      preserveActivity: false,
      Component: () => {
        useEffect(() => {
          window.dispatchEvent(new CustomEvent('ocr-mounted'))

          return () => {
            window.dispatchEvent(new CustomEvent('ocr-unmounted'))
          }
        }, [])

        return (
          <section>
            <h1>OCR Mock</h1>
            <p>OCR results</p>
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
      <button type="button" onClick={() => void navigate('/json.html')}>
        Go json
      </button>
      <button type="button" onClick={() => void navigate('/ocr.html')}>
        Go OCR
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

  it('redirects the removed text preview route to JSON', async () => {
    render(
      <MemoryRouter initialEntries={['/text-preview.html']}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('JSON Mock')).toBeVisible()
  })

  it.each([
    '/formatter.html',
    '/htmlformat.html',
    '/xmlformatter.html',
    '/csstool.html',
  ])('redirects the removed formatter route %s to JSON', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('JSON Mock')).toBeVisible()
  })

  it.each([
    '/markdown.html',
    '/urlparser.html',
    '/filemerge.html',
    '/svgoptimizer.html',
  ])('redirects the removed Web 格式 route %s to JSON', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('JSON Mock')).toBeVisible()
  })

  it.each([
    '/cron.html',
    '/csv2json.html',
    '/yaml.html',
    '/toml.html',
    '/jsonschema.html',
  ])('redirects the removed 数据格式 route %s to JSON', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('JSON Mock')).toBeVisible()
  })

  it('keeps React and DOM state when switching visited tools', async () => {
    render(
      <MemoryRouter initialEntries={['/json.html']}>
        <RouteControls />
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    const input = screen.getByLabelText('JSON input')
    fireEvent.change(input, { target: { value: '{"a":1}' } })
    expect(screen.getByRole('status')).toHaveTextContent('{"a":1}')

    fireEvent.click(screen.getByRole('button', { name: 'Go downloads' }))

    await waitFor(() => {
      expect(screen.getByText('Downloads Mock')).toBeVisible()
    })
    expect(screen.getByLabelText('JSON input')).not.toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Go json' }))

    await waitFor(() => {
      expect(screen.getByLabelText('JSON input')).toHaveValue('{"a":1}')
    })
    expect(screen.getByRole('status')).toHaveTextContent('{"a":1}')
  })

  it('unmounts tools that opt out of hidden activity preservation', async () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    window.addEventListener('ocr-mounted', mounted)
    window.addEventListener('ocr-unmounted', unmounted)

    render(
      <MemoryRouter initialEntries={['/ocr.html']}>
        <RouteControls />
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('OCR Mock')).toBeVisible()
    })
    expect(mounted).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Go json' }))

    await waitFor(() => {
      expect(screen.getByText('JSON Mock')).toBeVisible()
    })
    await waitFor(() => {
      expect(unmounted).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByText('OCR Mock')).toBeNull()

    window.removeEventListener('ocr-mounted', mounted)
    window.removeEventListener('ocr-unmounted', unmounted)
  })
})
