import { describe, expect, it } from 'vitest';
import { toolRoutes } from '@/components/tool/tool-routes';
import { ORDINARY_TOOL_IDS } from '@/lib/tools-spa';

describe('toolRoutes', () => {
  it('maps every ordinary tool id to a component', () => {
    expect(toolRoutes.map((route) => route.id)).toEqual(ORDINARY_TOOL_IDS);

    for (const route of toolRoutes) {
      expect(route.Component).toBeTypeOf('function');
    }
  });
});
