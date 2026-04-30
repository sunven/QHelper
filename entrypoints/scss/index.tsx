import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as sass from 'sass';
import { Copy, Download, FileJson, FileCode, Zap } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

interface ScssState {
  input: string;
  output: string;
  outputStyle: 'expanded' | 'compressed';
  error: string | null;
}

function ScssCompiler() {
  const [state, setState] = useState<ScssState>({
    input: `$primary-color: #3498db;
$font-size: 16px;

.container {
  background: $primary-color;
  font-size: $font-size;
  padding: 20px;

  &:hover {
    background: darken($primary-color, 10%);
  }
}`,
    output: '',
    outputStyle: 'expanded',
    error: null,
  });

  const { addToHistory, history } = useToolHistory<ScssState>('scss', {
    maxSize: 10,
    key: 'scss-state',
  });

  // 编译 SCSS
  useEffect(() => {
    try {
      const result = sass.compileString(state.input, {
        style: state.outputStyle === 'compressed' ? 'compressed' : 'expanded',
        syntax: 'scss',
      });
      setState((prev) => ({ ...prev, output: result.css, error: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      setState((prev) => ({ ...prev, error: message, output: '' }));
    }
  }, [state.input, state.outputStyle]);

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
    const blob = new Blob([state.output], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `styles-${Date.now()}.css`;
    a.click();
    URL.revokeObjectURL(url);
    if (!state.error) {
      addToHistory({ ...state } as ToolHistoryItem);
    }
  }, [state.output, addToHistory, state]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: '', output: '', error: null }));
  }, []);

  return (


    <ToolPageShell toolId="scss">
      <div className="mx-auto max-w-[1520px]">

        {/* 操作栏 */}
        <div className="mb-2 rounded-md border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 dark:text-slate-400">输出格式</label>
              <select
                value={state.outputStyle}
                onChange={(e) => setState((prev) => ({ ...prev, outputStyle: e.target.value as 'expanded' | 'compressed' }))}
                className="h-8 rounded-md bg-slate-100 px-2 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              >
                <option value="expanded">展开格式</option>
                <option value="compressed">压缩格式</option>
              </select>
            </div>
            {state.error && (
              <div className="flex min-w-0 items-center gap-1.5 truncate text-xs text-red-600 dark:text-red-400">
                <Zap className="w-4 h-4" />
                {state.error}
              </div>
            )}
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-2 lg:grid-cols-2">
          {/* 输入区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <div className="flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-pink-600" />
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">SCSS 输入</h2>
              </div>
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
              placeholder="输入 SCSS 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">CSS 输出</h2>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!state.output}
                  className="flex h-7 items-center gap-1 rounded-md bg-slate-600 px-2 text-xs text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Copy className="w-3 h-3" />
                  复制
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!state.output}
                  className="flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2 text-xs text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  <Download className="w-3 h-3" />
                  下载
                </button>
              </div>
            </div>
            <textarea
              value={state.error ? state.error : state.output}
              readOnly
              className={`h-full min-h-[360px] w-full resize-none p-2.5 font-mono text-sm focus:outline-none lg:min-h-0 ${
                state.error
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
              }`}
            />
          </div>
        </div>

        {/* 统计信息 */}
        {!state.error && state.output && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>输入字符: {state.input.length}</span>
            <span>输出字符: {state.output.length}</span>
            <span>压缩率: {state.output.length > 0 ? Math.round((1 - state.output.length / state.input.length) * 100) : 0}%</span>
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">历史记录</h3>
            <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-md bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => handleInputChange((item as ScssState).input)}
                >
                  <div className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item as ScssState).input.slice(0, 100)}...
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
      <ScssCompiler />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
