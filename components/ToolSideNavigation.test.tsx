import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolSideNavigation, createToolMenuItems, findCategoryKeyForTool } from './ToolSideNavigation';
import type { Tool } from '@/lib/navigation-config';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithSidebar(ui: React.ReactElement) {
  return render(
    <TooltipProvider>
      <SidebarProvider>{ui}</SidebarProvider>
    </TooltipProvider>,
  );
}

const { getCurrentToolKey, navigateToTool } = vi.hoisted(() => ({
  getCurrentToolKey: vi.fn(),
  navigateToTool: vi.fn(),
}));

vi.mock('@/lib/navigation-utils', () => ({
  getCurrentToolKey,
  navigateToTool,
}));

describe('ToolSideNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentToolKey.mockReturnValue('json');
    window.history.replaceState({}, '', '/tools/json.html');
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

  it('creates inline menu items from tool categories', () => {
    const items = createToolMenuItems();

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'common',
          label: '常用',
          children: expect.arrayContaining([
            expect.objectContaining({
              key: 'json',
            }),
          ]),
        }),
      ]),
    );
  });

  it('finds the parent category for the current tool', () => {
    expect(findCategoryKeyForTool('json')).toBe('common');
    expect(findCategoryKeyForTool('downloads')).toBe('other');
    expect(findCategoryKeyForTool('missing')).toBeNull();
    expect(findCategoryKeyForTool(null)).toBeNull();
  });

  it('renders categories and tools with the current tool selected', () => {
    renderWithSidebar(<ToolSideNavigation />);

    expect(screen.getByTestId('tool-side-navigation')).toBeVisible();
    expect(screen.getByText('Tools')).toBeVisible();
    expect(screen.getByText('常用')).toBeVisible();
    expect(screen.getByText('JSON 格式化')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /JSON 格式化/ })).toHaveAttribute('data-active', 'true');
  });

  it('opens the current tool category by default', async () => {
    renderWithSidebar(<ToolSideNavigation />);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /进制转换/ })).toBeVisible();
    });
  });

  it('delegates tool clicks to the existing navigation helper', () => {
    renderWithSidebar(<ToolSideNavigation />);

    fireEvent.click(screen.getByRole('menuitem', { name: /进制转换/ }));

    expect(navigateToTool).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'trans-radix',
        path: '/tools/trans-radix.html',
      }) satisfies Partial<Tool>,
    );
  });

  it('changes only the React Router location when rendered inside the tools SPA', async () => {
    function LocationProbe() {
      const location = useLocation();
      return <div data-testid="router-location">{location.pathname}</div>;
    }

    renderWithSidebar(
      <MemoryRouter initialEntries={['/json.html']}>
        <ToolSideNavigation />
        <Routes>
          <Route path="/:toolFile" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('menuitem', { name: /进制转换/ }));

    await waitFor(() => {
      expect(screen.getByTestId('router-location')).toHaveTextContent('/trans-radix.html');
    });
    expect(navigateToTool).not.toHaveBeenCalled();
  });
});
