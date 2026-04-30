import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js';
import { Copy, Download, FileText } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: Tokens.Code) => {
  const highlighted = lang && hljs.getLanguage(lang)
    ? hljs.highlight(text, { language: lang }).value
    : hljs.highlightAuto(text).value;

  const languageClass = lang ? ` language-${lang}` : '';
  return `<pre><code class="hljs${languageClass}">${highlighted}</code></pre>`;
};

// 配置 marked 选项
marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
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


    <ToolPageShell toolId="markdown" description="实时编写、预览并导出 Markdown，保留语法高亮与大篇幅编辑体验。">
      <div className="mx-auto max-w-[1520px]">

        {/* 操作按钮 */}
        <div className="mb-2 flex gap-1.5">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex h-8 items-center gap-1.5 rounded-md bg-slate-700 px-2.5 text-sm text-white transition-colors hover:bg-slate-800"
          >
            <Copy className="w-4 h-4" />
            复制 HTML
          </button>
          <button
            type="button"
            onClick={handleExportHtml}
            className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 text-sm text-white transition-colors hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" />
            导出 HTML
          </button>
        </div>

        {/* 编辑器 */}
        <div className="grid min-h-[calc(100vh-11rem)] grid-cols-1 gap-2 lg:grid-cols-2">
          {/* 输入区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Markdown</h2>
            </div>
            <textarea
              value={state.input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="h-full min-h-[380px] w-full resize-none bg-white p-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 lg:min-h-0"
              placeholder="输入 Markdown 内容..."
              spellCheck={false}
            />
          </div>

          {/* 预览区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">预览</h2>
            </div>
            <div
              className="prose prose-slate h-full min-h-[380px] max-w-none overflow-auto p-2.5 text-sm dark:prose-invert lg:min-h-0"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          </div>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">历史记录</h3>
            <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-md bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => handleInputChange((item as MarkdownState).input)}
                >
                  <div className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item as MarkdownState).input.slice(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
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
