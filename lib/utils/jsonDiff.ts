/**
 * JSON Diff 工具
 *
 * 用于比较两个 JSON 对象的差异
 */

export type DiffType =
  | 'unchanged'
  | 'added'
  | 'removed'
  | 'modified'
  | 'type-changed'

export interface DiffChange {
  path: string
  type: DiffType
  oldValue?: unknown
  newValue?: unknown
}

export interface DiffResult {
  changes: DiffChange[]
  isModified: boolean
}

export const DIFF_LABELS: Record<DiffType, string> = {
  added: '新增',
  removed: '删除',
  modified: '值变化',
  'type-changed': '类型变化',
  unchanged: '未变化',
}

export function getJsonValueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function propertyPath(parent: string, key: string): string {
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return parent ? `${parent}.${key}` : key
  return `${parent}[${JSON.stringify(key)}]`
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
    return changes
  }

  // 旧值是 undefined，新值存在 -> 添加
  if (oldValue === undefined) {
    changes.push({ path, type: 'added', newValue })
    return changes
  }

  // 新值是 undefined，旧值存在 -> 删除
  if (newValue === undefined) {
    changes.push({ path, type: 'removed', oldValue })
    return changes
  }

  if (oldValue === newValue) {
    return changes
  }

  // JSON 类型不同，在当前路径报告一次变化
  if (getJsonValueType(oldValue) !== getJsonValueType(newValue)) {
    changes.push({ path, type: 'type-changed', oldValue, newValue })
    return changes
  }

  // 数组比较
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    const maxLength = Math.max(oldValue.length, newValue.length)

    for (let i = 0; i < maxLength; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`

      if (i >= oldValue.length) {
        changes.push({ path: itemPath, type: 'added', newValue: newValue[i] })
      } else if (i >= newValue.length) {
        changes.push({ path: itemPath, type: 'removed', oldValue: oldValue[i] })
      } else {
        compare(oldValue[i], newValue[i], itemPath, changes)
      }
    }

    return changes
  }

  // 对象比较
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    const oldKeys = new Set(Object.keys(oldValue as object))
    const newKeys = new Set(Object.keys(newValue as object))
    const allKeys = new Set([...oldKeys, ...newKeys])

    for (const key of allKeys) {
      const itemPath = propertyPath(path, key)
      const hasOld = oldKeys.has(key)
      const hasNew = newKeys.has(key)

      if (!hasOld) {
        changes.push({
          path: itemPath,
          type: 'added',
          newValue: (newValue as Record<string, unknown>)[key],
        })
      } else if (!hasNew) {
        changes.push({
          path: itemPath,
          type: 'removed',
          oldValue: (oldValue as Record<string, unknown>)[key],
        })
      } else {
        compare(
          (oldValue as Record<string, unknown>)[key],
          (newValue as Record<string, unknown>)[key],
          itemPath,
          changes,
        )
      }
    }

    return changes
  }

  // 基本类型值比较
  changes.push({ path, type: 'modified', oldValue, newValue })

  return changes
}

// 字符串解析失败时按普通文本参与比较（历史契约，调用方应自行校验）
function parse(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
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
  return diffValues(parse(oldJson), parse(newJson))
}

/**
 * 比较两个已解析 JSON 值的差异
 *
 * @param oldValue - 解析后的旧值
 * @param newValue - 解析后的新值
 */
export function diffValues(oldValue: unknown, newValue: unknown): DiffResult {
  const changes: DiffChange[] = []
  compare(oldValue, newValue, '', changes)

  return {
    changes,
    isModified: changes.length > 0,
  }
}

/**
 * 格式化差异显示
 */
export function formatDiffChange(change: DiffChange): string {
  const pathStr = change.path ? JSON.stringify(change.path) : '根'
  if (change.type === 'unchanged') return `[未变化] ${pathStr}`
  const before =
    change.type === 'added' ? '字段不存在' : JSON.stringify(change.oldValue)
  const after =
    change.type === 'removed' ? '字段不存在' : JSON.stringify(change.newValue)
  const types =
    change.type === 'type-changed'
      ? ` (${getJsonValueType(change.oldValue)} → ${getJsonValueType(change.newValue)})`
      : ''
  return `[${DIFF_LABELS[change.type]}] ${pathStr}${types}: ${before} → ${after}`
}

/** 报告头，标识差异的方向。 */
export const DIFF_REPORT_HEADER = '基准响应 → 待比较响应'

/** 将单条差异转为报告行（含报告头，便于单独复制）。 */
export function formatChangeReport(change: DiffChange): string {
  return `${DIFF_REPORT_HEADER}\n${formatDiffChange(change)}`
}

/** 将差异结果转换为可复制的文本报告。 */
export function generateDiffReport(diff: DiffResult): string {
  const summary = diff.isModified
    ? `发现 ${diff.changes.length} 处差异`
    : '没有发现差异'
  return [
    `${DIFF_REPORT_HEADER}（数组按位置比较）`,
    summary,
    ...diff.changes.map(formatDiffChange),
  ].join('\n')
}
