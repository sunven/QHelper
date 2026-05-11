import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { ToolActivityOutlet } from './ToolActivityOutlet';

vi.mock('./tool-routes', () => ({
  toolRoutes: [
    {
      id: 'json',
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
      Component: () => (
        <section>
          <h1>Downloads Mock</h1>
          <p>Download results</p>
        </section>
      ),
    },
  ],
}));

vi.mock('@/components/ToolSideNavigation', () => ({
  ToolSideNavigation: () => <nav data-testid="tool-side-navigation">Tools</nav>,
}));

function RouteControls() {
  const navigate = useNavigate();

  return (
    <div>
      <button type="button" onClick={() => void navigate('/downloads')}>
        Go downloads
      </button>
      <button type="button" onClick={() => void navigate('/json')}>
        Go json
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
      <MemoryRouter initialEntries={['/json']}>
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
});
