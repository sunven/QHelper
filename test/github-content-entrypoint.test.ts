import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createGitHubInactiveWarningHelper,
  createGitHubStarHistoryViewHelper,
  createGitHubZreadButtonHelper,
  inactiveWarningHelper,
  installPageHelpers,
  starHistoryHelper,
  zreadHelper,
} = vi.hoisted(() => {
  const inactiveWarningHelper = { render: vi.fn() };
  const starHistoryHelper = { render: vi.fn() };
  const zreadHelper = { render: vi.fn() };

  return {
    createGitHubInactiveWarningHelper: vi.fn(() => inactiveWarningHelper),
    createGitHubStarHistoryViewHelper: vi.fn(() => starHistoryHelper),
    createGitHubZreadButtonHelper: vi.fn(() => zreadHelper),
    inactiveWarningHelper,
    installPageHelpers: vi.fn(),
    starHistoryHelper,
    zreadHelper,
  };
});

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/page-helper-lifecycle', () => ({
  installPageHelpers,
}));

vi.mock('@/lib/github/inactive-warning-view', () => ({
  createGitHubInactiveWarningHelper,
}));

vi.mock('@/lib/github/star-history-view', () => ({
  createGitHubStarHistoryViewHelper,
}));

vi.mock('@/lib/github/zread-button', () => ({
  createGitHubZreadButtonHelper,
}));

import githubContentScript from '../entrypoints/github.content';

describe('entrypoints/github.content.ts', () => {
  beforeEach(() => {
    createGitHubInactiveWarningHelper.mockClear();
    createGitHubStarHistoryViewHelper.mockClear();
    createGitHubZreadButtonHelper.mockClear();
    installPageHelpers.mockClear();
  });

  it('registers the GitHub content script and delegates to shared GitHub helpers', () => {
    expect(githubContentScript.matches).toEqual(['*://github.com/*']);
    expect(githubContentScript.runAt).toBe('document_end');

    githubContentScript.main({} as never);

    expect(createGitHubZreadButtonHelper).toHaveBeenCalledWith(document);
    expect(createGitHubStarHistoryViewHelper).toHaveBeenCalledWith(document);
    expect(createGitHubInactiveWarningHelper).toHaveBeenCalledWith(document);
    expect(installPageHelpers).toHaveBeenCalledWith(
      window,
      document,
      {
        documentEvents: ['turbo:load', 'pjax:end'],
        windowEvents: ['popstate'],
      },
      [zreadHelper, starHistoryHelper, inactiveWarningHelper],
    );
  });
});
