import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { SettingsPage } from '@/components/tool/settings'
import { ToolWorkspaceShell } from '@/components/tool/ToolWorkspaceShell'
import { DEFAULT_TOOL_ID, getToolRoutePath, TOOLS_ROUTE_BASE } from '@/lib/tools-spa'
import '@fontsource-variable/jetbrains-mono'
import '../../index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ToolActivityOutlet } from './ToolActivityOutlet'

export function ToolsRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />}
      />
      <Route
        path="/settings.html"
        element={
          <ToolWorkspaceShell pageTitle="设置">
            <SettingsPage />
          </ToolWorkspaceShell>
        }
      />
      <Route
        path="/settings"
        element={<Navigate replace to="/settings.html" />}
      />
      <Route path="/:toolId" element={<ToolActivityOutlet />} />
      <Route
        path="*"
        element={<Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />}
      />
    </Routes>
  )
}

function ToolsApp() {
  return (
    <BrowserRouter basename={`/${TOOLS_ROUTE_BASE}`}>
      <ToolsRoutes />
    </BrowserRouter>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(
    <ThemeProvider>
      <ToolsApp />
    </ThemeProvider>,
  )
}
