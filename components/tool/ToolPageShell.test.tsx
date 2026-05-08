import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToolPageShell } from './ToolPageShell';
import { ToolWorkspaceShell } from './ToolWorkspaceShell';

vi.mock('@/components/ToolSideNavigation', () => ({
  ToolSideNavigation: () => <nav data-testid="tool-side-navigation">Tools</nav>,
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
  it('renders side navigation and reserves shared shell width for it', () => {
    render(
      <ToolWorkspaceShell>
        <ToolPageShell toolId="json">
          <div>Tool body</div>
        </ToolPageShell>
      </ToolWorkspaceShell>,
    );

    expect(screen.getByTestId('tool-page-main').closest('.tool-page-shell')).toHaveClass('h-screen', 'overflow-hidden');
    expect(screen.getByTestId('tool-side-navigation-region')).toBeVisible();
    expect(screen.getByTestId('tool-side-navigation-region')).toHaveClass('min-h-0', 'shrink-0', 'lg:h-full', 'lg:w-[18.5rem]');
    expect(screen.getByTestId('tool-side-navigation-region')).not.toHaveClass('lg:fixed', 'lg:left-2');
    expect(screen.getByTestId('tool-side-navigation')).toBeVisible();
    expect(screen.getByTestId('tool-page-main')).toHaveClass('min-h-0', 'min-w-0', 'flex-1', 'overflow-y-auto');
    expect(screen.getByText('Tool body')).toBeVisible();
    expect(screen.queryByText('tool-category-chevron-common')).not.toBeInTheDocument();
  });
});
