/**
 * MD5 工具测试
 */

import { describe, it, expect } from 'vitest';
import { md5 } from './md5';

describe('md5', () => {
  it('should compute correct MD5 hash for empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should compute correct MD5 hash for simple string', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('should compute correct MD5 hash for numbers', () => {
    expect(md5('123')).toBe('202cb962ac59075b964b07152d234b70');
  });

  it('should compute correct MD5 hash for special characters', () => {
    expect(md5('test@test.com')).toBe('b642b4217b34b1e8d3bd915fc65c4452');
  });

  it('should handle Chinese characters', () => {
    const hash = md5('测试');
    expect(hash).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(hash)).toBe(true);
  });

  it('should produce consistent results', () => {
    const input = 'consistent input';
    expect(md5(input)).toBe(md5(input));
  });

  it('should produce different results for different inputs', () => {
    expect(md5('input1')).not.toBe(md5('input2'));
  });
});
