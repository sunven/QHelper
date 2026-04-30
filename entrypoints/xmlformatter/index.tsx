import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { FileCode, Copy, Download, Minimize2, Maximize2, Sparkles, Trash2 } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

interface XmlState {
  input: string;
  output: string;
  mode: 'beautify' | 'minify';
  error: string | null;
}

function XmlFormatter() {
  const [state, setState] = useState<XmlState>({
    input: `<root><person><name>John Doe</name><age>30</age></person><person><name>Jane Smith</name><age>25</age></person></root>`,
    output: '',
    mode: 'beautify',
    error: null,
  });

  const { addToHistory, history } = useToolHistory<XmlState>('xmlformatter', {
    maxSize: 10,
    key: 'xmlformatter-state',
  });

  // 处理 XML
  useEffect(() => {
    if (!state.input.trim()) {
      setState((prev) => ({ ...prev, output: '', error: null }));
      return;
    }

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: true,
      });

      const jsonObj = parser.parse(state.input);

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        format: state.mode === 'beautify',
        indentBy: '  ',
      });

      const output = builder.build(jsonObj);
      setState((prev) => ({ ...prev, output, error: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'XML 解析错误';
      setState((prev) => ({ ...prev, error: message, output: '' }));
    }
  }, [state.input, state.mode]);

  const handleInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const handleModeChange = useCallback((mode: 'beautify' | 'minify') => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.output);
    } catch {
      console.error('复制失败');
    }
  }, [state.output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([state.output], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    if (!state.error) {
      addToHistory({ ...state } as ToolHistoryItem);
    }
  }, [state.output, addToHistory, state]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: '', output: '', error: null }));
  }, []);

  const handleSwap = useCallback(() => {
    setState((prev) => ({
      ...prev,
      input: prev.output,
      mode: prev.mode === 'beautify' ? 'minify' : 'beautify',
    }));
  }, []);

  return (


    <ToolPageShell toolId="xmlformatter">
      <div className="mx-auto max-w-[1520px]">

        {/* 模式切换 */}
        <div className="mb-2 rounded-md border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleModeChange('beautify')}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors ${
                  state.mode === 'beautify'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                美化
              </button>
              <button
                type="button"
                onClick={handleSwap}
                className="h-8 rounded-md bg-slate-100 px-2 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                title="交换方向"
              >
                <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('minify')}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors ${
                  state.mode === 'minify'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
                压缩
              </button>
            </div>
            {state.error && (
              <div className="flex min-w-0 items-center gap-1.5 truncate text-xs text-red-600 dark:text-red-400">
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
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                XML 输入
              </h2>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                清空
              </button>
            </div>
            <textarea
              value={state.input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="h-full min-h-[360px] w-full resize-none bg-white p-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 lg:min-h-0"
              placeholder="输入 XML 代码..."
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
        {!state.error && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>输入字符: {state.input.length}</span>
            <span>输出字符: {state.output.length}</span>
            <span>压缩率: {state.input.length > 0 ? Math.round((1 - state.output.length / state.input.length) * 100) : 0}%</span>
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
                  onClick={() => handleInputChange((item as XmlState).input)}
                >
                  <div className="line-clamp-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {(item as XmlState).input.slice(0, 100)}...
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
      <XmlFormatter />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
