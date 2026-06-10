import { beforeEach, describe, expect, it, vi } from 'vitest';

const { installZreadGithubLink } = vi.hoisted(() => ({
  installZreadGithubLink: vi.fn(),
}));

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/zread/github-link', () => ({
  installZreadGithubLink,
}));

import zreadContentScript from '../entrypoints/zread.content';

describe('entrypoints/zread.content.ts', () => {
  beforeEach(() => {
    installZreadGithubLink.mockClear();
  });

  it('registers the Zread content script and delegates to the Zread GitHub link helper', () => {
    expect(zreadContentScript.matches).toEqual(['*://zread.ai/*']);
    expect(zreadContentScript.runAt).toBe('document_end');

    zreadContentScript.main({} as never);

    expect(installZreadGithubLink).toHaveBeenCalledWith(window, document);
  });
});
