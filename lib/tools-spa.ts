import type { ToolCatalogTool as Tool } from './tool-catalog';
import {
  DEFAULT_TOOL_ID,
  ORDINARY_TOOL_IDS,
  TOOL_SETTINGS_ID,
  TOOLS_ROUTE_BASE,
  TOOLS_SPA_ENTRY,
  getToolsSpaPath as getCatalogToolsSpaPath,
  isOrdinaryToolId,
} from './tool-catalog';

export {
  DEFAULT_TOOL_ID,
  ORDINARY_TOOL_IDS,
  TOOL_SETTINGS_ID,
  TOOLS_ROUTE_BASE,
  TOOLS_SPA_ENTRY,
  isOrdinaryToolId,
};

export function getToolRoutePath(toolId: string): string {
  return `/${encodeURIComponent(toolId)}.html`;
}

export function getToolsSpaPath(toolId: string): string {
  return getCatalogToolsSpaPath(toolId);
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
  return tool.path;
}

export function isToolsSpaLocation(location: Pick<Location, 'pathname'> = window.location): boolean {
  return location.pathname.includes(`/${TOOLS_ROUTE_BASE}/`);
}
