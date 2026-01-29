/**
 * 输入验证工具函数
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * 验证 JSON 字符串
 */
export function validateJson(input: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || !input.trim()) {
    return {
      isValid: false,
      errors: ['输入不能为空'],
    };
  }

  try {
    const parsed = JSON.parse(input);

    // 检查常见问题
    if (typeof parsed === 'string') {
      warnings.push('JSON 是一个字符串，可能需要引号');
    }

    const size = new Blob([input]).size;
    if (size > 10 * 1024 * 1024) {
      warnings.push('JSON 文件较大 (>10MB)，处理可能需要较长时间');
    }

    return { isValid: true, errors, warnings };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    // 提供更友好的错误消息
    let friendlyMessage = message;
    if (message.includes('Unexpected token')) {
      friendlyMessage = 'JSON 语法错误：意外的字符';
      const match = message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1], 10);
        const line = input.substring(0, pos).split('\n').length;
        friendlyMessage += ` (第 ${line} 行)`;
      }
    } else if (message.includes('Unexpected end')) {
      friendlyMessage = 'JSON 语法错误：未闭合的括号或引号';
    } else if (message.includes('Duplicate key')) {
      friendlyMessage = 'JSON 语法错误：重复的键名';
    }

    return {
      isValid: false,
      errors: [friendlyMessage],
    };
  }
}

/**
 * 验证 XML 字符串
 */
export function validateXml(input: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || !input.trim()) {
    return {
      isValid: false,
      errors: ['输入不能为空'],
    };
  }

  // 基本检查
  if (!input.trim().startsWith('<')) {
    errors.push('XML 必须以 < 开头');
  }

  // 检查标签平衡
  const openTags = (input.match(/<[^/!?][^>]*>/g) || []).length;
  const closeTags = (input.match(/<\/[^>]+>/g) || []).length;
  const selfClosing = (input.match(/<[^>]+\/>/g) || []).length;

  if (openTags - selfClosing !== closeTags) {
    errors.push('标签不匹配：开标签和闭标签数量不一致');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证 YAML 字符串
 */
export function validateYaml(input: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || !input.trim()) {
    return {
      isValid: false,
      errors: ['输入不能为空'],
    };
  }

  // 检查缩进（YAML 使用空格，不支持 Tab）
  if (input.includes('\t')) {
    warnings.push('YAML 不支持 Tab 缩进，请使用空格');
  }

  // 检查常见的 YAML 语法问题
  const lines = input.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检查冒号后的空格
    if (line.includes(':') && !line.trim().startsWith('#')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex < line.length - 1 && line[colonIndex + 1] !== ' ' && line[colonIndex + 1] !== '\n') {
        warnings.push(`第 ${lineNum} 行：冒号后应该有空格`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证 URL
 */
export function validateUrl(input: string): ValidationResult {
  const errors: string[] = [];

  if (!input || !input.trim()) {
    return {
      isValid: false,
      errors: ['URL 不能为空'],
    };
  }

  try {
    new URL(input);
    return { isValid: true, errors };
  } catch {
    return {
      isValid: false,
      errors: ['URL 格式无效'],
    };
  }
}

/**
 * 验证文件大小
 */
export function validateFileSize(
  input: string,
  maxSize: number = 5 * 1024 * 1024 // 默认 5MB
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const size = new Blob([input]).size;

  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    errors.push(`文件过大 (${sizeMB}MB)，超过限制 (${maxSizeMB}MB)`);
  } else if (size > maxSize * 0.8) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    warnings.push(`文件接近大小限制 (${maxSizeMB}MB)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 获取友好的错误消息
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    // 常见错误的友好提示
    const friendlyMessages: Record<string, string> = {
      'Unexpected token': 'JSON 格式错误：存在意外的字符',
      'Unexpected end': 'JSON 格式错误：未闭合的括号或引号',
      'Duplicate key': 'JSON 格式错误：存在重复的键名',
      'Failed to fetch': '网络请求失败，请检查网络连接',
      'Network error': '网络错误，请检查网络连接',
      'Timeout': '请求超时，请稍后重试',
      'Not Found': '资源未找到',
      'Unauthorized': '未授权，请检查访问权限',
    };

    for (const [key, friendlyMessage] of Object.entries(friendlyMessages)) {
      if (message.includes(key)) {
        return friendlyMessage;
      }
    }

    return message;
  }

  return String(error);
}
