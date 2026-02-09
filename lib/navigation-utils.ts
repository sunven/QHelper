import { TOOL_CATEGORIES, type Tool } from './navigation-config';

/**
 * 从当前URL路径检测当前工具的key
 * @returns 当前工具的key，如果无法检测则返回null
 */
export function getCurrentToolKey(): string | null {
  const pathname = window.location.pathname;

  // 从路径中提取工具key
  // 支持多种格式：
  // - /json.html -> json
  // - /json/index.html -> json (开发环境)
  // - chrome-extension://xxx/json.html -> json

  // 先尝试匹配 .html 格式
  let match = pathname.match(/\/([^\/]+)\.html$/);
  if (match) {
    return match[1];
  }

  // 再尝试匹配 /index.html 格式
  match = pathname.match(/\/([^\/]+)\/index\.html$/);
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * 根据工具key查找工具信息
 * @param key 工具key
 * @returns 工具信息，如果未找到则返回null
 */
export function findToolByKey(key: string): Tool | null {
  for (const category of TOOL_CATEGORIES) {
    const tool = category.tools.find((t) => t.key === key);
    if (tool) return tool;
  }
  return null;
}

/**
 * 获取工具的完整URL
 * @param tool 工具信息
 * @returns 完整的URL路径
 */
export function getToolUrl(tool: Tool): string {
  // Chrome扩展中使用chrome.runtime.getURL
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(tool.path);
  }
  // 开发环境回退
  return tool.path;
}

/**
 * 导航到指定工具
 * @param tool 目标工具
 */
export function navigateToTool(tool: Tool): void {
  const url = getToolUrl(tool);
  window.location.href = url;
}
