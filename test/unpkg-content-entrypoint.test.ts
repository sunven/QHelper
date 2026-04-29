import { beforeEach, describe, expect, it, vi } from 'vitest';

const { installUnpkgCopyActions } = vi.hoisted(() => ({
  installUnpkgCopyActions: vi.fn(),
}));

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: <T>(config: T) => config,
}));

vi.mock('@/lib/unpkg/copy-actions', () => ({
  installUnpkgCopyActions,
}));

import unpkgContentScript from '../entrypoints/unpkg.content';

describe('entrypoints/unpkg.content.ts', () => {
  beforeEach(() => {
    installUnpkgCopyActions.mockClear();
  });

  it('registers the unpkg browse content script and delegates to the shared installer', () => {
    expect(unpkgContentScript.matches).toEqual([
      'https://www.unpkg.com/browse/*',
      'https://unpkg.com/browse/*',
      'https://app.unpkg.com/*',
    ]);
    expect(unpkgContentScript.runAt).toBe('document_end');

    unpkgContentScript.main({} as never);

    expect(installUnpkgCopyActions).toHaveBeenCalledWith(window, document);
  });
});
