import { beforeEach, describe, expect, it, vi } from 'vitest';

const { installGitHubStarHistoryView, installGitHubZreadButton } = vi.hoisted(() => ({
  installGitHubStarHistoryView: vi.fn(),
  installGitHubZreadButton: vi.fn(),
}));

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/github/star-history-view', () => ({
  installGitHubStarHistoryView,
}));

vi.mock('@/lib/github/zread-button', () => ({
  installGitHubZreadButton,
}));

import githubContentScript from '../entrypoints/github.content';

describe('entrypoints/github.content.ts', () => {
  beforeEach(() => {
    installGitHubStarHistoryView.mockClear();
    installGitHubZreadButton.mockClear();
  });

  it('registers the GitHub content script and delegates to shared GitHub helpers', () => {
    expect(githubContentScript.matches).toEqual(['*://github.com/*']);
    expect(githubContentScript.runAt).toBe('document_end');

    githubContentScript.main({} as never);

    expect(installGitHubZreadButton).toHaveBeenCalledWith(window, document);
    expect(installGitHubStarHistoryView).toHaveBeenCalledWith(window, document);
  });
});
