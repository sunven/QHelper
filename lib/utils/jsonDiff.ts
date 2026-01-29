/**
 * JSON Diff 工具
 *
 * 用于比较两个 JSON 对象的差异
 */

export type DiffType = 'unchanged' | 'added' | 'removed' | 'modified';

export interface DiffChange {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface DiffResult {
  changes: DiffChange[];
  isModified: boolean;
}

/**
 * 比较两个值是否相等
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }

  return false;
}

/**
 * 递归比较两个对象并返回差异
 */
function compare(
  oldValue: unknown,
  newValue: unknown,
  path: string = '',
  changes: DiffChange[] = [],
): DiffChange[] {
  // 两者都为 undefined
  if (oldValue === undefined && newValue === undefined) {
    return changes;
  }

  // 旧值是 undefined，新值存在 -> 添加
  if (oldValue === undefined) {
    changes.push({ path, type: 'added', newValue });
    return changes;
  }

  // 新值是 undefined，旧值存在 -> 删除
  if (newValue === undefined) {
    changes.push({ path, type: 'removed', oldValue });
    return changes;
  }

  // 类型不同 -> 修改
  if (typeof oldValue !== typeof newValue) {
    changes.push({ path, type: 'modified', oldValue, newValue });
    return changes;
  }

  // 数组比较
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    const maxLength = Math.max(oldValue.length, newValue.length);

    for (let i = 0; i < maxLength; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;

      if (i >= oldValue.length) {
        changes.push({ path: itemPath, type: 'added', newValue: newValue[i] });
      } else if (i >= newValue.length) {
        changes.push({ path: itemPath, type: 'removed', oldValue: oldValue[i] });
      } else {
        compare(oldValue[i], newValue[i], itemPath, changes);
      }
    }

    return changes;
  }

  // 对象比较
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    const oldKeys = Object.keys(oldValue as object);
    const newKeys = Object.keys(newValue as object);
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const itemPath = path ? `${path}.${key}` : key;
      const hasOld = key in (oldValue as object);
      const hasNew = key in (newValue as object);

      if (!hasOld) {
        changes.push({ path: itemPath, type: 'added', newValue: (newValue as Record<string, unknown>)[key] });
      } else if (!hasNew) {
        changes.push({ path: itemPath, type: 'removed', oldValue: (oldValue as Record<string, unknown>)[key] });
      } else {
        compare(
          (oldValue as Record<string, unknown>)[key],
          (newValue as Record<string, unknown>)[key],
          itemPath,
          changes,
        );
      }
    }

    return changes;
  }

  // 基本类型值比较
  if (!isEqual(oldValue, newValue)) {
    changes.push({ path, type: 'modified', oldValue, newValue });
  }

  return changes;
}

/**
 * 比较两个 JSON 对象的差异
 *
 * @param oldJson - 旧的 JSON 对象或字符串
 * @param newJson - 新的 JSON 对象或字符串
 * @returns DiffResult - 差异结果
 *
 * @example
 * ```ts
 * const result = jsonDiff(
 *   { a: 1, b: 2 },
 *   { a: 1, b: 3, c: 4 }
 * );
 * // result.changes = [
 * //   { path: 'b', type: 'modified', oldValue: 2, newValue: 3 },
 * //   { path: 'c', type: 'added', newValue: 4 }
 * // ]
 * ```
 */
export function jsonDiff(oldJson: unknown, newJson: unknown): DiffResult {
  let oldValue: unknown;
  let newValue: unknown;

  // 如果是字符串，尝试解析为 JSON
  if (typeof oldJson === 'string') {
    try {
      oldValue = JSON.parse(oldJson);
    } catch {
      oldValue = oldJson;
    }
  } else {
    oldValue = oldJson;
  }

  if (typeof newJson === 'string') {
    try {
      newValue = JSON.parse(newJson);
    } catch {
      newValue = newJson;
    }
  } else {
    newValue = newJson;
  }

  const changes: DiffChange[] = [];
  compare(oldValue, newValue, '', changes);

  return {
    changes,
    isModified: changes.length > 0,
  };
}

/**
 * 格式化差异显示
 */
export function formatDiffChange(change: DiffChange): string {
  const pathStr = change.path ? `"${change.path}"` : '根';
  const typeStr = {
    added: '添加',
    removed: '删除',
    modified: '修改',
    unchanged: '未变化',
  }[change.type];

  let valueStr = '';
  if (change.type === 'added') {
    valueStr = ` → ${JSON.stringify(change.newValue)}`;
  } else if (change.type === 'removed') {
    valueStr = ` ← ${JSON.stringify(change.oldValue)}`;
  } else if (change.type === 'modified') {
    valueStr = `: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`;
  }

  return `[${typeStr}] ${pathStr}${valueStr}`;
}

/**
 * 将差异结果转换为可读的文本报告
 */
export function generateDiffReport(diff: DiffResult): string {
  if (!diff.isModified) {
    return '没有发现差异';
  }

  const lines = diff.changes.map(formatDiffChange);
  return `发现 ${diff.changes.length} 处差异:\n\n${lines.join('\n')}`;
}
