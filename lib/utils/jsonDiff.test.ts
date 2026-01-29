/**
 * JSON Diff 工具测试
 */

import { describe, it, expect } from 'vitest';
import { jsonDiff, generateDiffReport } from './jsonDiff';

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
    expect(result.changes[0].type).toBe('modified');
  });
});

describe('generateDiffReport', () => {
  it('should generate readable report for no changes', () => {
    const result = jsonDiff({ a: 1 }, { a: 1 });
    const report = generateDiffReport(result);

    expect(report).toBe('没有发现差异');
  });

  it('should generate readable report for changes', () => {
    const result = jsonDiff({ a: 1 }, { a: 2 });
    const report = generateDiffReport(result);

    expect(report).toContain('1 处差异');
    expect(report).toContain('修改');
  });
});
