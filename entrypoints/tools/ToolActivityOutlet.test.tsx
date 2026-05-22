import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { ToolActivityOutlet } from './ToolActivityOutlet';

vi.mock('@/components/tool/tool-routes', () => ({
  toolRoutes: [
    {
      id: 'json',
      preserveActivity: true,
      Component: () => {
        const [value, setValue] = useState('');
        return (
          <section>
            <h1>JSON Mock</h1>
            <textarea aria-label="JSON input" value={value} onChange={(event) => setValue(event.target.value)} />
            {value ? <output role="status">{value}</output> : null}
          </section>
        );
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
      id: 'text-preview',
      preserveActivity: false,
      Component: () => {
        useEffect(() => {
          window.dispatchEvent(new CustomEvent('text-preview-mounted'));

          return () => {
            window.dispatchEvent(new CustomEvent('text-preview-unmounted'));
          };
        }, []);

        return (
          <section>
            <h1>Text Preview Mock</h1>
            <p>Large editor</p>
          </section>
        );
      },
    },
  ],
}));

vi.mock('@/lib/tools-spa', () => ({
  DEFAULT_TOOL_ID: 'json',
  getToolRoutePath: (toolId: string) => `/${toolId}.html`,
  getToolsSpaPath: (toolId: string) => `tools/${toolId}.html`,
  isOrdinaryToolId: (toolId: string | null | undefined) =>
    ['json', 'downloads', 'text-preview'].includes(toolId ?? ''),
}))

vi.mock('@/components/ToolSideNavigation', () => ({
  ToolSideNavigation: () => <nav data-testid="tool-side-navigation">Tools</nav>,
}));

function RouteControls() {
  const navigate = useNavigate();

  return (
    <div>
      <button type="button" onClick={() => void navigate('/downloads.html')}>
        Go downloads
      </button>
      <button type="button" onClick={() => void navigate('/json.html')}>
        Go json
      </button>
      <button type="button" onClick={() => void navigate('/text-preview.html')}>
        Go text preview
      </button>
    </div>
  );
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
    }));
  });

  it('keeps React and DOM state when switching visited tools', async () => {
    render(
      <MemoryRouter initialEntries={['/json.html']}>
        <RouteControls />
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    );

    const input = screen.getByLabelText('JSON input');
    fireEvent.change(input, { target: { value: '{"a":1}' } });
    expect(screen.getByRole('status')).toHaveTextContent('{"a":1}');

    fireEvent.click(screen.getByRole('button', { name: 'Go downloads' }));

    await waitFor(() => {
      expect(screen.getByText('Downloads Mock')).toBeVisible();
    });
    expect(screen.getByLabelText('JSON input')).not.toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Go json' }));

    await waitFor(() => {
      expect(screen.getByLabelText('JSON input')).toHaveValue('{"a":1}');
    });
    expect(screen.getByRole('status')).toHaveTextContent('{"a":1}');
  });

  it('unmounts tools that opt out of hidden activity preservation', async () => {
    const mounted = vi.fn();
    const unmounted = vi.fn();
    window.addEventListener('text-preview-mounted', mounted);
    window.addEventListener('text-preview-unmounted', unmounted);

    render(
      <MemoryRouter initialEntries={['/text-preview.html']}>
        <RouteControls />
        <Routes>
          <Route path="/:toolId" element={<ToolActivityOutlet />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Text Preview Mock')).toBeVisible();
    });
    expect(mounted).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Go json' }));

    await waitFor(() => {
      expect(screen.getByText('JSON Mock')).toBeVisible();
    });
    await waitFor(() => {
      expect(unmounted).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Text Preview Mock')).toBeNull();

    window.removeEventListener('text-preview-mounted', mounted);
    window.removeEventListener('text-preview-unmounted', unmounted);
  });
});
