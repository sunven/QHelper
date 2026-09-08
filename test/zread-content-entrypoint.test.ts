import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createZreadGithubLinkHelper, installPageHelpers, zreadLinkHelper } =
  vi.hoisted(() => ({
    createZreadGithubLinkHelper: vi.fn(),
    installPageHelpers: vi.fn(),
    zreadLinkHelper: { render: vi.fn() },
  }));

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/page-helper-lifecycle', () => ({
  installPageHelpers,
}));

vi.mock('@/lib/zread/github-link', () => ({
  createZreadGithubLinkHelper,
}));

import zreadContentScript from '../entrypoints/zread.content';

describe('entrypoints/zread.content.ts', () => {
  beforeEach(() => {
    createZreadGithubLinkHelper.mockClear();
    installPageHelpers.mockClear();
    createZreadGithubLinkHelper.mockReturnValue(zreadLinkHelper);
  });

  it('registers the Zread content script and installs the GitHub link helper with a popstate-only profile', () => {
    expect(zreadContentScript.matches).toEqual(['*://zread.ai/*']);
    expect(zreadContentScript.runAt).toBe('document_end');

    zreadContentScript.main({} as never);

    expect(createZreadGithubLinkHelper).toHaveBeenCalledWith(document);
    expect(installPageHelpers).toHaveBeenCalledWith(
      window,
      document,
      { windowEvents: ['popstate'] },
      [zreadLinkHelper],
    );
  });
});
