import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TOOL_ID,
  getCurrentToolIdFromLocation,
  getToolIdFromPathname,
  getToolRoutePath,
  getToolsSpaPath,
  getToolsSpaUrl,
  isToolsSpaLocation,
} from './tools-spa';

describe('tools-spa routing helpers', () => {
  it('builds path-based routes for ordinary tools', () => {
    expect(DEFAULT_TOOL_ID).toBe('json');
    expect(getToolsSpaPath('json')).toBe('tools/json.html');
    expect(getToolsSpaPath('trans-radix')).toBe('tools/trans-radix.html');
    expect(getToolRoutePath('jsonschema')).toBe('/jsonschema.html');
    expect(getToolRoutePath('settings')).toBe('/settings.html');
  });

  it('detects current tool from SPA pathname', () => {
    expect(getToolIdFromPathname('/tools/json.html')).toBe('json');
    expect(getToolIdFromPathname('/tools/trans-radix.html')).toBe('trans-radix');
    expect(getToolIdFromPathname('/tools/json-string-panel.html')).toBeNull();
    expect(getCurrentToolIdFromLocation({ pathname: '/tools/downloads.html' })).toBe('downloads');
    expect(getCurrentToolIdFromLocation({ pathname: '/tools' })).toBeNull();
    expect(getCurrentToolIdFromLocation({ pathname: '/downloads.html' })).toBeNull();
  });

  it('uses chrome.runtime.getURL when available', () => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      },
    });

    expect(getToolsSpaUrl('json')).toBe('chrome-extension://test/tools/json.html');
  });

  it('detects the shared SPA entry', () => {
    expect(isToolsSpaLocation({ pathname: '/tools/json.html' })).toBe(true);
    expect(isToolsSpaLocation({ pathname: '/json.html' })).toBe(false);
  });
});
