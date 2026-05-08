import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { DEFAULT_TOOL_ID, getToolRoutePath } from '@/lib/tools-spa';
import '../../index.css';
import { ToolActivityOutlet } from './ToolActivityOutlet';

function ToolsApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />} />
        <Route path="/:toolId" element={<ToolActivityOutlet />} />
        <Route path="*" element={<Navigate replace to={getToolRoutePath(DEFAULT_TOOL_ID)} />} />
      </Routes>
    </HashRouter>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<ToolsApp />);
}
