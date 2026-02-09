import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { FileCode, Copy, Download, Minimize2, Maximize2, Sparkles, Trash2 } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import '../../index.css';
import { ToolNavigation } from '@/components/ToolNavigation';

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


    <>


      <ToolNavigation />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileCode className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              XML 格式化器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            XML 美化、压缩、格式化、验证
          </p>
        </div>

        {/* 模式切换 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('beautify')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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
                className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="交换方向"
              >
                <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('minify')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
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
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
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
              className="w-full h-[500px] p-4 resize-none focus:outline-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="输入 XML 代码..."
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
        {!state.error && (
          <div className="mt-4 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>输入字符: {state.input.length}</span>
            <span>输出字符: {state.output.length}</span>
            <span>压缩率: {state.input.length > 0 ? Math.round((1 - state.output.length / state.input.length) * 100) : 0}%</span>
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
                  onClick={() => handleInputChange((item as XmlState).input)}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-mono">
                    {(item as XmlState).input.slice(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  


    </>);
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
