/**
 * Vitest 测试环境设置文件
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
Element.prototype.scrollIntoView = vi.fn();

// 每个测试后清理
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// 模拟 Chrome API
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    session: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  cookies: {
    getAll: vi.fn(() => Promise.resolve([])),
    remove: vi.fn(() => Promise.resolve()),
  },
  browsingData: {
    remove: vi.fn(() => Promise.resolve()),
  },
  tabs: {
    create: vi.fn(() => Promise.resolve()),
    query: vi.fn(() => Promise.resolve([])),
    get: vi.fn(() => Promise.resolve(undefined)),
    reload: vi.fn(() => Promise.resolve()),
    sendMessage: vi.fn(() => Promise.resolve(undefined)),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  alarms: {
    getAll: vi.fn(() => Promise.resolve([])),
    get: vi.fn(() => Promise.resolve(undefined)),
    create: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve(true)),
  },
  action: {
    setBadgeText: vi.fn(() => Promise.resolve()),
    setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
    setTitle: vi.fn(() => Promise.resolve()),
  },
  scripting: {
    executeScript: vi.fn(() => Promise.resolve([])),
  },
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve(undefined)),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  sidePanel: {
    open: vi.fn(() => Promise.resolve()),
  },
};

(global as any).chrome = mockChrome;

// 模拟 defineBackground
(global as any).defineBackground = vi.fn(() => undefined);
