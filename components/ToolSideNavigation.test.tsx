import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolSideNavigation, createToolMenuItems, findCategoryKeyForTool } from './ToolSideNavigation';
import type { Tool } from '@/lib/navigation-config';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

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
    window.history.replaceState({}, '', '/tools.html#/json');
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
    render(<ToolSideNavigation />);

    expect(screen.getByTestId('tool-side-navigation')).toBeVisible();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
    expect(screen.getByText('常用')).toBeVisible();
    expect(screen.getByText('JSON 格式化')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /JSON 格式化/ })).toHaveClass('ant-menu-item-selected');
  });

  it('opens the current tool category by default', async () => {
    render(<ToolSideNavigation />);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /进制转换/ })).toBeVisible();
    });
  });

  it('delegates tool clicks to the existing navigation helper', () => {
    render(<ToolSideNavigation />);

    fireEvent.click(screen.getByRole('menuitem', { name: /进制转换/ }));

    expect(navigateToTool).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'trans-radix',
        path: '/tools.html#/trans-radix',
      }) satisfies Partial<Tool>,
    );
  });

  it('changes only the React Router location when rendered inside the tools SPA', async () => {
    function LocationProbe() {
      const location = useLocation();
      return <div data-testid="router-location">{location.pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={['/json']}>
        <ToolSideNavigation />
        <Routes>
          <Route path="/:toolId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('menuitem', { name: /进制转换/ }));

    await waitFor(() => {
      expect(screen.getByTestId('router-location')).toHaveTextContent('/trans-radix');
    });
    expect(navigateToTool).not.toHaveBeenCalled();
  });
});
