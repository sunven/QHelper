import { Activity, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { ToolWorkspaceShell } from '@/components/tool/ToolWorkspaceShell';
import { DEFAULT_TOOL_ID, getToolRoutePath, isOrdinaryToolId } from '@/lib/tools-spa';
import { toolRoutes } from './tool-routes';

export function ToolActivityOutlet() {
  const { toolId } = useParams<{ toolId: string }>();
  const activeToolId = isOrdinaryToolId(toolId) ? toolId : null;
  const [visitedToolIds, setVisitedToolIds] = useState<Set<string>>(() => new Set([activeToolId ?? DEFAULT_TOOL_ID]));

  useEffect(() => {
    if (!activeToolId) {
      return;
    }

    setVisitedToolIds((current) => {
      if (current.has(activeToolId)) {
        return current;
      }

      const next = new Set(current);
      next.add(activeToolId);
      return next;
    });
  }, [activeToolId]);

  if (!activeToolId) {
    return <Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />;
  }

  return (
    <ToolWorkspaceShell activeToolId={activeToolId}>
      {toolRoutes.map(({ id, Component }) => {
        if (!visitedToolIds.has(id)) {
          return null;
        }

        return (
          <Activity key={id} name={`tool-${id}`} mode={id === activeToolId ? 'visible' : 'hidden'}>
            <Component />
          </Activity>
        );
      })}
    </ToolWorkspaceShell>
  );
}
