import { TOOL_CATEGORIES, type Tool } from './navigation-config';
import { getCurrentToolIdFromLocation, getNavigationToolPath, getToolsSpaUrl } from './tools-spa';

/**
 * 从当前URL路径检测当前工具的key
 * @returns 当前工具的key，如果无法检测则返回null
 */
export function getCurrentToolKey(): string | null {
  return getCurrentToolIdFromLocation();
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
  return getToolsSpaUrl(tool.key);
}

export function getToolPath(tool: Tool): string {
  return getNavigationToolPath(tool);
}

export function navigateToTool(tool: Tool): void {
  const url = getToolUrl(tool);
  window.location.href = url;
}
