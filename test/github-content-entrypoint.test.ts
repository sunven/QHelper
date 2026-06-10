import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createGitHubStarHistoryViewHelper,
  createGitHubZreadButtonHelper,
  installRepositoryPageHelpers,
  starHistoryHelper,
  zreadHelper,
} = vi.hoisted(() => {
  const starHistoryHelper = { render: vi.fn() };
  const zreadHelper = { render: vi.fn() };

  return {
    createGitHubStarHistoryViewHelper: vi.fn(() => starHistoryHelper),
    createGitHubZreadButtonHelper: vi.fn(() => zreadHelper),
    installRepositoryPageHelpers: vi.fn(),
    starHistoryHelper,
    zreadHelper,
  };
});

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/github/repository-page-helper', () => ({
  installRepositoryPageHelpers,
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
    createGitHubStarHistoryViewHelper.mockClear();
    createGitHubZreadButtonHelper.mockClear();
    installRepositoryPageHelpers.mockClear();
  });

  it('registers the GitHub content script and delegates to shared GitHub helpers', () => {
    expect(githubContentScript.matches).toEqual(['*://github.com/*']);
    expect(githubContentScript.runAt).toBe('document_end');

    githubContentScript.main({} as never);

    expect(createGitHubZreadButtonHelper).toHaveBeenCalledWith(document);
    expect(createGitHubStarHistoryViewHelper).toHaveBeenCalledWith(document);
    expect(installRepositoryPageHelpers).toHaveBeenCalledWith(window, document, [
      zreadHelper,
      starHistoryHelper,
    ]);
  });
});
