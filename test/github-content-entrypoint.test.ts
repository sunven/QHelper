import { beforeEach, describe, expect, it, vi } from 'vitest';

const { installGitHubZreadButton } = vi.hoisted(() => ({
  installGitHubZreadButton: vi.fn(),
}));

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/github/zread-button', () => ({
  installGitHubZreadButton,
}));

import githubContentScript from '../entrypoints/github.content';

describe('entrypoints/github.content.ts', () => {
  beforeEach(() => {
    installGitHubZreadButton.mockClear();
  });

  it('registers the GitHub content script and delegates to the shared GitHub button installer', () => {
    expect(githubContentScript.matches).toEqual(['*://github.com/*']);
    expect(githubContentScript.runAt).toBe('document_end');

    githubContentScript.main({} as never);

    expect(installGitHubZreadButton).toHaveBeenCalledWith(window, document);
  });
});
