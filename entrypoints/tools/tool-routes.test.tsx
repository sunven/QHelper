import { describe, expect, it } from 'vitest';
import { toolRoutes as canonicalToolRoutes } from '@/components/tool/tool-routes';
import { toolRoutes } from './tool-routes';

describe('toolRoutes', () => {
  it('re-exports the canonical component route registry', () => {
    expect(toolRoutes).toBe(canonicalToolRoutes);
  });
});
