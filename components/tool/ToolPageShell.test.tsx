import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolPageShell } from './ToolPageShell';
import { ToolWorkspaceShell } from './ToolWorkspaceShell';

vi.mock('@/components/ToolSideNavigation', () => ({
  ToolSideNavigation: () => <nav data-testid="tool-side-navigation">Side navigation</nav>,
}));

describe('ToolPageShell', () => {
  it('renders one tool view without owning the shared navigation layout', () => {
    render(
      <ToolPageShell toolId="json">
        <div>Tool body</div>
      </ToolPageShell>,
    );

    expect(screen.getByText('Tool body')).toBeVisible();
    expect(screen.getByText('JSON 格式化')).toBeVisible();
    expect(screen.getByText('Tool body').closest('.tool-page-view')).toHaveAttribute('data-tool-id', 'json');
    expect(screen.queryByTestId('tool-side-navigation-region')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tool-page-main')).not.toBeInTheDocument();
  });
});

describe('ToolWorkspaceShell', () => {
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

  it('renders side navigation and reserves shared shell width for it', () => {
    render(
      <ToolWorkspaceShell activeToolId="json">
        <ToolPageShell toolId="json">
          <div>Tool body</div>
        </ToolPageShell>
      </ToolWorkspaceShell>,
    );

    expect(screen.getByTestId('tool-page-main').closest('.tool-page-shell')).toHaveClass('h-screen', 'overflow-hidden');
    expect(screen.getByTestId('tool-workspace-navbar')).toBeVisible();
    expect(screen.getByText('QHelper Tools')).toBeVisible();
    expect(screen.getByRole('link', { name: '打开设置' })).toHaveAttribute('href', '#/settings');
    expect(screen.getByTestId('tool-side-navigation-region')).toBeVisible();
    expect(screen.getByTestId('tool-side-navigation')).toBeVisible();
    expect(screen.getByTestId('tool-page-main')).toHaveClass('min-h-0', 'min-w-0', 'flex-1', 'overflow-y-auto', 'p-4', 'pt-0');
    expect(screen.getByText('Tool body')).toBeVisible();
    expect(screen.queryByText('tool-category-chevron-common')).not.toBeInTheDocument();
  });

  it('renders a non-tool page title in the shared shell', () => {
    render(
      <ToolWorkspaceShell pageTitle="设置">
        <div>Settings body</div>
      </ToolWorkspaceShell>,
    );

    expect(screen.getByText('设置')).toBeVisible();
    expect(screen.getByText('Settings body')).toBeVisible();
  });
});
