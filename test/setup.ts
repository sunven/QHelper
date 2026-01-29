/**
 * Vitest 测试环境设置文件
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
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
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  cookies: {
    getAll: vi.fn(() => Promise.resolve([])),
    remove: vi.fn(() => Promise.resolve()),
  },
  tabs: {
    create: vi.fn(() => Promise.resolve()),
    query: vi.fn(() => Promise.resolve([])),
  },
};

(global as any).chrome = mockChrome;

// 模拟 defineBackground
(global as any).defineBackground = vi.fn(() => undefined);
