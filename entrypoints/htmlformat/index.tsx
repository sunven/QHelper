import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import js_beautify from 'js-beautify';
import { Copy, Download, FileCode, Minimize2, Maximize2, Settings2 } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

interface HtmlFormatState {
  input: string;
  output: string;
  indentSize: number;
  indentChar: 'space' | 'tab';
  wrapLineLength: number;
  mode: 'beautify' | 'minify';
}

function HtmlFormatter() {
  const [state, setState] = useState<HtmlFormatState>({
    input: '<div class="container"><h1>Hello World</h1><p>This is a <strong>test</strong> paragraph.</p></div>',
    output: '',
    indentSize: 2,
    indentChar: 'space',
    wrapLineLength: 120,
    mode: 'beautify',
  });

  const { addToHistory, history } = useToolHistory<HtmlFormatState>('htmlformat', {
    maxSize: 10,
    key: 'htmlformat-state',
  });

  // 格式化或压缩 HTML
  useEffect(() => {
    try {
      let result: string;
      const options = {
        indent_size: state.indentSize,
        indent_char: state.indentChar === 'space' ? ' ' : '\t',
        wrap_line_length: state.wrapLineLength,
        max_preserve_newlines: 2,
        preserve_newlines: true,
        unformatted: ['pre', 'code', 'textarea'],
        content_unformatted: ['style', 'script'],
      };

      if (state.mode === 'beautify') {
        result = js_beautify.html(state.input, options);
      } else {
        // 压缩模式
        result = js_beautify.html(state.input, {
          ...options,
          indent_size: 0,
          indent_char: '',
          wrap_line_length: 0,
          max_preserve_newlines: 0,
          preserve_newlines: false,
        }).replace(/\s+/g, ' ').replace(/>\s</g, '><').trim();
      }
      setState((prev) => ({ ...prev, output: result }));
    } catch {
      setState((prev) => ({ ...prev, output: '// 格式化错误：输入的不是有效的 HTML' }));
    }
  }, [state.input, state.indentSize, state.indentChar, state.wrapLineLength, state.mode]);

  const handleInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.output);
    } catch {
      console.error('复制失败');
    }
  }, [state.output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([state.output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `html-${state.mode}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addToHistory({ ...state } as ToolHistoryItem);
  }, [state.output, state.mode, addToHistory, state]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: '', output: '' }));
  }, []);

  return (


    <ToolPageShell toolId="htmlformat">
      <div className="mx-auto max-w-[1520px]">

        {/* 操作栏 */}
        <div className="mb-2 rounded-md border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* 模式切换 */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, mode: 'beautify' }))}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors ${
                  state.mode === 'beautify'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                格式化
              </button>
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, mode: 'minify' }))}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors ${
                  state.mode === 'minify'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
                压缩
              </button>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />

            {/* 设置 */}
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <select
                value={state.indentSize}
                onChange={(e) => setState((prev) => ({ ...prev, indentSize: Number(e.target.value) }))}
                className="h-8 rounded-md bg-slate-100 px-2 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
                <option value={8}>8 空格</option>
              </select>

              <select
                value={state.indentChar}
                onChange={(e) => setState((prev) => ({ ...prev, indentChar: e.target.value as 'space' | 'tab' }))}
                className="h-8 rounded-md bg-slate-100 px-2 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="space">空格缩进</option>
                <option value="tab">Tab 缩进</option>
              </select>
            </div>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-2 lg:grid-cols-2">
          {/* 输入区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">输入 HTML</h2>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                清空
              </button>
            </div>
            <textarea
              value={state.input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="h-full min-h-[360px] w-full resize-none bg-white p-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 lg:min-h-0"
              placeholder="输入 HTML 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {state.mode === 'beautify' ? '格式化结果' : '压缩结果'}
              </h2>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-7 items-center gap-1 rounded-md bg-slate-600 px-2 text-xs text-white transition-colors hover:bg-slate-700"
                >
                  <Copy className="w-3 h-3" />
                  复制
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2 text-xs text-white transition-colors hover:bg-emerald-700"
                >
                  <Download className="w-3 h-3" />
                  下载
                </button>
              </div>
            </div>
            <textarea
              value={state.output}
              readOnly
              className="h-full min-h-[360px] w-full resize-none bg-slate-50 p-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100 lg:min-h-0"
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span>输入字符: {state.input.length}</span>
          <span>输出字符: {state.output.length}</span>
          <span>压缩率: {state.input.length > 0 ? Math.round((1 - state.output.length / state.input.length) * 100) : 0}%</span>
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
                  onClick={() => handleInputChange((item as HtmlFormatState).input)}
                >
                  <div className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item as HtmlFormatState).input.slice(0, 100)}...
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
      <HtmlFormatter />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
