import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as sass from 'sass';
import { Copy, Download, FileJson, FileCode, Zap } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileJson className="w-8 h-8 text-pink-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              SCSS 编译器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            将 SCSS/SASS 编译为 CSS
          </p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm text-slate-600 dark:text-slate-400">输出格式:</label>
              <select
                value={state.outputStyle}
                onChange={(e) => setState((prev) => ({ ...prev, outputStyle: e.target.value as 'expanded' | 'compressed' }))}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="expanded">展开格式</option>
                <option value="compressed">压缩格式</option>
              </select>
            </div>
            {state.error && (
              <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {state.error}
              </div>
            )}
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 输入区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-pink-600" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200">SCSS 输入</h2>
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
              className="w-full h-[500px] p-4 resize-none focus:outline-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="输入 SCSS 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200">CSS 输出</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!state.output}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  复制
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!state.output}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                >
                  <Download className="w-3 h-3" />
                  下载
                </button>
              </div>
            </div>
            <textarea
              value={state.error ? state.error : state.output}
              readOnly
              className={`w-full h-[500px] p-4 resize-none focus:outline-none font-mono text-sm ${
                state.error
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
              }`}
            />
          </div>
        </div>

        {/* 统计信息 */}
        {!state.error && state.output && (
          <div className="mt-4 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>输入字符: {state.input.length}</span>
            <span>输出字符: {state.output.length}</span>
            <span>压缩率: {state.output.length > 0 ? Math.round((1 - state.output.length / state.input.length) * 100) : 0}%</span>
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">历史记录</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                  onClick={() => handleInputChange((item as ScssState).input)}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {(item as ScssState).input.slice(0, 100)}...
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
      <ScssCompiler />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
