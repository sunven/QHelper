import type { Tool } from './navigation-config';
import { TOOL_CATEGORIES } from './navigation-config';

export const TOOLS_SPA_ENTRY = 'tools.html';
export const TOOLS_ROUTE_BASE = 'tools';
export const DEFAULT_TOOL_ID = 'json';
export const TOOL_SETTINGS_ID = 'settings';

export const ORDINARY_TOOL_IDS = TOOL_CATEGORIES.flatMap((category) => category.tools.map((tool) => tool.key));

const ordinaryToolIdSet = new Set(ORDINARY_TOOL_IDS);

export function isOrdinaryToolId(toolId: string | null | undefined): toolId is string {
  return typeof toolId === 'string' && ordinaryToolIdSet.has(toolId);
}

export function getToolRoutePath(toolId: string): string {
  return `/${encodeURIComponent(toolId)}.html`;
}

export function getToolsSpaPath(toolId: string): string {
  return `${TOOLS_ROUTE_BASE}/${encodeURIComponent(toolId)}.html`;
}

export function getToolsSpaUrl(toolId: string): string {
  const path = getToolsSpaPath(toolId);

  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }

  return `/${path}`;
}

export function getToolIdFromPathname(pathname: string): string | null {
  const [base, candidateWithExtension] = pathname.replace(/^\/+/, '').split('/');
  if (base !== TOOLS_ROUTE_BASE) {
    return null;
  }

  const candidate = candidateWithExtension?.replace(/\.html$/, '');
  return isOrdinaryToolId(candidate) ? candidate : null;
}

export function getCurrentToolIdFromLocation(location: Pick<Location, 'pathname'> = window.location): string | null {
  return getToolIdFromPathname(location.pathname);
}

export function getNavigationToolPath(tool: Tool): string {
  return `/${getToolsSpaPath(tool.key)}`;
}

export function isToolsSpaLocation(location: Pick<Location, 'pathname'> = window.location): boolean {
  return location.pathname.includes(`/${TOOLS_ROUTE_BASE}/`);
}
