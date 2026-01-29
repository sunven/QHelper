import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { Copy, Download, FileText } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import '../../index.css';

// 配置 marked 选项
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch {
        return code;
      }
    }
    return hljs.highlightAuto(code).value;
  },
});

// 导入 highlight.js 样式
import 'highlight.js/styles/github-dark.css';

interface MarkdownState {
  input: string;
  html: string;
}

function MarkdownEditor() {
  const [state, setState] = useState<MarkdownState>({
    input: `# 欢迎使用 Markdown 编辑器

## 功能特性

- **实时预览**: 左侧编辑，右侧实时显示
- **语法高亮**: 支持多种编程语言代码块
- **GFM 支持**: 支持 GitHub Flavored Markdown
- **导出 HTML**: 一键导出格式化的 HTML

## 代码示例

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet('QHelper');
\`\`\`

## 表格

| 功能 | 状态 |
|------|------|
| 实时预览 | ✅ |
| 语法高亮 | ✅ |
| 导出 HTML | ✅ |

开始编写你的 Markdown 文档吧！`,
    html: '',
  });

  const { addToHistory, history } = useToolHistory<MarkdownState>('markdown', {
    maxSize: 10,
    key: 'markdown-state',
  });

  // 更新 HTML 预览
  useEffect(() => {
    const html = marked.parse(state.input) as string;
    setState((prev) => ({ ...prev, html }));
  }, [state.input]);

  const handleInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const handleExportHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 导出</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    code {
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px 12px;
    }
    table th {
      background: #f6f8fa;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      color: #666;
      margin: 0;
    }
    img {
      max-width: 100%;
    }
  </style>
</head>
<body>
${state.html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addToHistory({ input: state.input, html: fullHtml } as ToolHistoryItem);
  }, [state.html, state.input, addToHistory]);

  const handleCopyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.html);
    } catch {
      console.error('复制失败');
    }
  }, [state.html]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Markdown 编辑器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            实时预览、语法高亮、支持 GFM
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制 HTML
          </button>
          <button
            type="button"
            onClick={handleExportHtml}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 HTML
          </button>
        </div>

        {/* 编辑器 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 输入区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">Markdown</h2>
            </div>
            <textarea
              value={state.input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full h-[600px] p-4 resize-none focus:outline-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="输入 Markdown 内容..."
              spellCheck={false}
            />
          </div>

          {/* 预览区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">预览</h2>
            </div>
            <div
              className="h-[600px] p-4 overflow-auto prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          </div>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">历史记录</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                  onClick={() => handleInputChange((item as MarkdownState).input)}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {(item as MarkdownState).input.slice(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ToolErrorBoundary>
      <MarkdownEditor />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
