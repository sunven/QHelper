/**
 * JSON Diff 工具测试
 */

import { describe, it, expect } from 'vitest';
import { formatDiffChange, generateDiffReport, jsonDiff } from './jsonDiff';

describe('jsonDiff', () => {
  it('should detect no changes for identical objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };

    const result = jsonDiff(obj1, obj2);

    expect(result.isModified).toBe(false);
    expect(result.changes).toHaveLength(0);
  });

  it('should detect added properties', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1, b: 2 };

    const result = jsonDiff(obj1, obj2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('added');
    expect(result.changes[0].path).toBe('b');
    expect(result.changes[0].newValue).toBe(2);
  });

  it('should detect removed properties', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };

    const result = jsonDiff(obj1, obj2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('removed');
    expect(result.changes[0].path).toBe('b');
    expect(result.changes[0].oldValue).toBe(2);
  });

  it('should detect modified properties', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };

    const result = jsonDiff(obj1, obj2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('modified');
    expect(result.changes[0].path).toBe('b');
    expect(result.changes[0].oldValue).toBe(2);
    expect(result.changes[0].newValue).toBe(3);
  });

  it('should handle nested objects', () => {
    const obj1 = { a: { b: { c: 1 } } };
    const obj2 = { a: { b: { c: 2 } } };

    const result = jsonDiff(obj1, obj2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].path).toBe('a.b.c');
  });

  it('should handle arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 4];

    const result = jsonDiff(arr1, arr2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('modified');
    expect(result.changes[0].path).toBe('[2]');
  });

  it('should parse JSON strings', () => {
    const str1 = '{"a":1,"b":2}';
    const str2 = '{"a":1,"b":3}';

    const result = jsonDiff(str1, str2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
  });

  it('should handle null values', () => {
    const obj1 = { a: null };
    const obj2 = { a: 1 };

    const result = jsonDiff(obj1, obj2);

    expect(result.isModified).toBe(true);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('type-changed');
  });

  it('should treat matching null values as unchanged', () => {
    const result = jsonDiff({ a: null }, { a: null });

    expect(result.isModified).toBe(false);
    expect(result.changes).toHaveLength(0);
  });

  it('should handle invalid JSON strings as plain strings', () => {
    const result = jsonDiff('{invalid', '{"valid":true');

    expect(result.isModified).toBe(true);
    expect(result.changes).toEqual([
      {
        path: '',
        type: 'modified',
        oldValue: '{invalid',
        newValue: '{"valid":true',
      },
    ]);
  });

  it('should detect added and removed array items', () => {
    expect(jsonDiff([1], [1, 2]).changes).toEqual([
      { path: '[1]', type: 'added', newValue: 2 },
    ]);
    expect(jsonDiff([1, 2], [1]).changes).toEqual([
      { path: '[1]', type: 'removed', oldValue: 2 },
    ]);
  });

  it('should include parent paths for nested array item changes', () => {
    expect(jsonDiff({ items: [1] }, { items: [1, 2] }).changes).toEqual([
      { path: 'items[1]', type: 'added', newValue: 2 },
    ]);
  });

  it('should handle root-level additions and removals', () => {
    expect(jsonDiff(undefined, { a: 1 }).changes).toEqual([
      { path: '', type: 'added', newValue: { a: 1 } },
    ]);
    expect(jsonDiff({ a: 1 }, undefined).changes).toEqual([
      { path: '', type: 'removed', oldValue: { a: 1 } },
    ]);
  });

  it('should treat two undefined values as unchanged', () => {
    expect(jsonDiff(undefined, undefined)).toEqual({
      changes: [],
      isModified: false,
    });
  });
});

describe('generateDiffReport', () => {
  it('should generate readable report for no changes', () => {
    const result = jsonDiff({ a: 1 }, { a: 1 });
    const report = generateDiffReport(result);

    expect(report).toContain('没有发现差异');
  });

  it('should generate readable report for changes', () => {
    const result = jsonDiff({ a: 1 }, { a: 2 });
    const report = generateDiffReport(result);

    expect(report).toContain('1 处差异');
    expect(report).toContain('值变化');
  });

  it('should include added and removed values in readable reports', () => {
    const result = jsonDiff({ removed: true }, { added: true });
    const report = generateDiffReport(result);

    expect(report).toContain('[删除] "removed": true → 字段不存在');
    expect(report).toContain('[新增] "added": 字段不存在 → true');
  });

  it('should format root-level modifications', () => {
    expect(generateDiffReport(jsonDiff('old', 'new'))).toContain('[值变化] 根: "old" → "new"');
  });

  it('should format unchanged changes without value details', () => {
    expect(formatDiffChange({ path: 'same', type: 'unchanged' })).toBe('[未变化] "same"');
  });
});

describe('response comparison semantics', () => {
  it.each([
    [null, {}],
    [{}, null],
    [[], {}],
    [{}, []],
    [1, '1'],
  ])('distinguishes JSON types: %j and %j', (before, after) => {
    expect(jsonDiff({ value: before }, { value: after }).changes).toEqual([
      {
        path: 'value',
        type: 'type-changed',
        oldValue: before,
        newValue: after,
      },
    ])
  })

  it('ignores key order but compares arrays by position', () => {
    expect(jsonDiff('{"b":2,"a":1}', '{"a":1,"b":2}').isModified).toBe(false)
    expect(
      jsonDiff([1, 2], [2, 1]).changes.map((change) => change.path),
    ).toEqual(['[0]', '[1]'])
  })

  it('uses unambiguous paths for special property names', () => {
    const result = jsonDiff(
      { 'a.b': { '': 1 }, a: { b: 1 }, 'x[0]': 1 },
      { 'a.b': { '': 2 }, a: { b: 2 }, 'x[0]': 2 },
    )
    expect(result.changes.map((change) => change.path)).toEqual([
      '["a.b"][""]',
      'a.b',
      '["x[0]"]',
    ])
  })

  it('only compares own properties, including prototype-like keys', () => {
    expect(jsonDiff('{}', '{"toString":null,"__proto__":1}').changes).toEqual([
      { path: 'toString', type: 'added', newValue: null },
      { path: '__proto__', type: 'added', newValue: 1 },
    ])
  })

  it('keeps embedded JSON strings and null distinct from missing fields', () => {
    expect(
      jsonDiff({ value: '{"a":1}', gone: null }, { value: { a: 1 } }).changes,
    ).toEqual([
      {
        path: 'value',
        type: 'type-changed',
        oldValue: '{"a":1}',
        newValue: { a: 1 },
      },
      { path: 'gone', type: 'removed', oldValue: null },
    ])
  })

  it('compares root primitives without parsing quoted strings twice', () => {
    expect(jsonDiff('"1"', '1').changes).toEqual([
      { path: '', type: 'type-changed', oldValue: '1', newValue: 1 },
    ])
  })

  it('reports direction, types and missing values', () => {
    const report = generateDiffReport(
      jsonDiff({ id: 1, gone: null }, { id: '1', added: true }),
    )
    expect(report).toContain('基准响应 → 待比较响应')
    expect(report).toContain('[类型变化]')
    expect(report).toContain('number → string')
    expect(report).toContain('字段不存在')
  })
})
