import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TOOL_ID,
  getCurrentToolIdFromLocation,
  getToolIdFromHash,
  getToolsSpaPath,
  getToolsSpaUrl,
  isToolsSpaLocation,
} from './tools-spa';

describe('tools-spa routing helpers', () => {
  it('builds hash-based routes for ordinary tools', () => {
    expect(DEFAULT_TOOL_ID).toBe('json');
    expect(getToolsSpaPath('json')).toBe('tools.html#/json');
    expect(getToolsSpaPath('trans-radix')).toBe('tools.html#/trans-radix');
  });

  it('detects current tool from SPA hash', () => {
    expect(getToolIdFromHash('#/json')).toBe('json');
    expect(getToolIdFromHash('#trans-radix')).toBe('trans-radix');
    expect(getToolIdFromHash('#/json-string-panel')).toBeNull();
    expect(getCurrentToolIdFromLocation({ hash: '#/downloads', pathname: '/tools.html' })).toBe('downloads');
    expect(getCurrentToolIdFromLocation({ hash: '', pathname: '/tools.html' })).toBeNull();
    expect(getCurrentToolIdFromLocation({ hash: '', pathname: '/downloads.html' })).toBeNull();
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
});
