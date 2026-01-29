import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import js_beautify from 'js-beautify';
import { Copy, Download, FileCode, Minimize2, Maximize2, Settings2 } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileCode className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              HTML 格式化器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            美化或压缩 HTML 代码
          </p>
        </div>

        {/* 操作栏 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 模式切换 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, mode: 'beautify' }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  state.mode === 'beautify'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                格式化
              </button>
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, mode: 'minify' }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  state.mode === 'minify'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
                压缩
              </button>
            </div>

            {/* 分隔线 */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-600" />

            {/* 设置 */}
            <div className="flex items-center gap-3">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <select
                value={state.indentSize}
                onChange={(e) => setState((prev) => ({ ...prev, indentSize: Number(e.target.value) }))}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300"
              >
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
                <option value={8}>8 空格</option>
              </select>

              <select
                value={state.indentChar}
                onChange={(e) => setState((prev) => ({ ...prev, indentChar: e.target.value as 'space' | 'tab' }))}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300"
              >
                <option value="space">空格缩进</option>
                <option value="tab">Tab 缩进</option>
              </select>
            </div>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 输入区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">输入 HTML</h2>
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
              placeholder="输入 HTML 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                {state.mode === 'beautify' ? '格式化结果' : '压缩结果'}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  复制
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Download className="w-3 h-3" />
                  下载
                </button>
              </div>
            </div>
            <textarea
              value={state.output}
              readOnly
              className="w-full h-[500px] p-4 resize-none focus:outline-none font-mono text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-4 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span>输入字符: {state.input.length}</span>
          <span>输出字符: {state.output.length}</span>
          <span>压缩率: {state.input.length > 0 ? Math.round((1 - state.output.length / state.input.length) * 100) : 0}%</span>
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
                  onClick={() => handleInputChange((item as HtmlFormatState).input)}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {(item as HtmlFormatState).input.slice(0, 100)}...
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
      <HtmlFormatter />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
