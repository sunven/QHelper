import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TOOL_ID,
  getCurrentToolIdFromLocation,
  getToolIdFromHash,
  getToolIdFromLegacyPath,
  getToolsSpaPath,
  getToolsSpaUrl,
  isToolsSpaLocation,
  redirectLegacyToolPageToSpa,
} from './tools-spa';

describe('tools-spa routing helpers', () => {
  it('builds hash-based routes for ordinary tools', () => {
    expect(DEFAULT_TOOL_ID).toBe('json');
    expect(getToolsSpaPath('json')).toBe('tools.html#/json');
    expect(getToolsSpaPath('trans-radix')).toBe('tools.html#/trans-radix');
  });

  it('detects current tool from SPA hash and legacy paths', () => {
    expect(getToolIdFromHash('#/json')).toBe('json');
    expect(getToolIdFromHash('#trans-radix')).toBe('trans-radix');
    expect(getToolIdFromHash('#/json-string-panel')).toBeNull();
    expect(getToolIdFromLegacyPath('/json.html')).toBe('json');
    expect(getToolIdFromLegacyPath('/json/index.html')).toBe('json');
    expect(getToolIdFromLegacyPath('/json-string-panel.html')).toBeNull();
    expect(getCurrentToolIdFromLocation({ hash: '#/downloads', pathname: '/tools.html' })).toBe('downloads');
    expect(getCurrentToolIdFromLocation({ hash: '', pathname: '/downloads.html' })).toBe('downloads');
  });

  it('uses chrome.runtime.getURL when available', () => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
    });

    expect(getToolsSpaUrl('json')).toBe('chrome-extension://test/tools.html#/json');
  });

  it('detects the shared SPA entry', () => {
    expect(isToolsSpaLocation({ pathname: '/tools.html' })).toBe(true);
    expect(isToolsSpaLocation({ pathname: '/json.html' })).toBe(false);
  });

  it('redirects legacy tool pages to the shared SPA entry', () => {
    const replace = vi.fn();

    vi.stubGlobal('chrome', {
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
    });

    redirectLegacyToolPageToSpa('json', { pathname: '/json.html', replace } as unknown as Location);

    expect(replace).toHaveBeenCalledWith('chrome-extension://test/tools.html#/json');
  });

  it('does not mount ordinary tool entrypoints when imported by the shared SPA', () => {
    const replace = vi.fn();

    expect(redirectLegacyToolPageToSpa('json', { pathname: '/tools.html', replace } as unknown as Location)).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
