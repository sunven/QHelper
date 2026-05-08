import type { Tool } from '@/lib/navigation-config';
import { TOOL_CATEGORIES } from '@/lib/navigation-config';

export const TOOLS_SPA_ENTRY = 'tools.html';
export const DEFAULT_TOOL_ID = 'json';

export const ORDINARY_TOOL_IDS = TOOL_CATEGORIES.flatMap((category) => category.tools.map((tool) => tool.key));

const ordinaryToolIdSet = new Set(ORDINARY_TOOL_IDS);

export function isOrdinaryToolId(toolId: string | null | undefined): toolId is string {
  return typeof toolId === 'string' && ordinaryToolIdSet.has(toolId);
}

export function getToolRoutePath(toolId: string): string {
  return `/${toolId}`;
}

export function getToolsSpaHash(toolId: string): string {
  return `#${getToolRoutePath(toolId)}`;
}

export function getToolsSpaPath(toolId: string): string {
  return `${TOOLS_SPA_ENTRY}${getToolsSpaHash(toolId)}`;
}

export function getToolsSpaUrl(toolId: string): string {
  const path = getToolsSpaPath(toolId);

  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }

  return `/${path}`;
}

export function getToolIdFromHash(hash: string): string | null {
  const candidate = hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return isOrdinaryToolId(candidate) ? candidate : null;
}

export function getCurrentToolIdFromLocation(location: Pick<Location, 'hash' | 'pathname'> = window.location): string | null {
  return getToolIdFromHash(location.hash);
}

export function getNavigationToolPath(tool: Tool): string {
  return getToolsSpaPath(tool.key);
}

export function isToolsSpaLocation(location: Pick<Location, 'pathname'> = window.location): boolean {
  return location.pathname.endsWith(`/${TOOLS_SPA_ENTRY}`);
}
