import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { optimize } from 'svgo';
import { Copy, Download, Image, Zap, Upload } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import '../../index.css';
import { ToolNavigation } from '@/components/ToolNavigation';

interface SvgState {
  input: string;
  output: string;
  error: string | null;
  originalSize: number;
  optimizedSize: number;
}

function SvgOptimizer() {
  const [state, setState] = useState<SvgState>({
    input: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <circle cx="50" cy="50" r="40" fill="red" />\n</svg>',
    output: '',
    error: null,
    originalSize: 0,
    optimizedSize: 0,
  });

  const { addToHistory, history } = useToolHistory<SvgState>('svgoptimizer', {
    maxSize: 10,
    key: 'svgoptimizer-state',
  });

  // 优化 SVG
  useEffect(() => {
    if (!state.input.trim()) {
      setState((prev) => ({ ...prev, output: '', error: null, originalSize: 0, optimizedSize: 0 }));
      return;
    }

    try {
      const result = optimize(state.input, {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
                cleanupIDs: false,
              },
            },
          },
        ],
      });

      setState((prev) => ({
        ...prev,
        output: result.data,
        error: null,
        originalSize: new Blob([state.input]).size,
        optimizedSize: new Blob([result.data]).size,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '无效的 SVG';
      setState((prev) => ({ ...prev, error: message, output: '', optimizedSize: 0 }));
    }
  }, [state.input]);

  const handleInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setState((prev) => ({ ...prev, input: content }));
      }
    };
    reader.readAsText(file);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.output);
    } catch {
      console.error('复制失败');
    }
  }, [state.output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([state.output], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    if (!state.error && state.output) {
      addToHistory({ ...state } as ToolHistoryItem);
    }
  }, [state.output, addToHistory, state]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: '', output: '', error: null }));
  }, []);

  const compressionRatio = state.originalSize > 0
    ? Math.round((1 - state.optimizedSize / state.originalSize) * 100)
    : 0;

  return (


    <>


      <ToolNavigation />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Image className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              SVG 优化器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            优化 SVG 代码，减小文件大小
          </p>
        </div>

        {/* 文件上传 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>上传 SVG 文件</span>
              <input
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
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
                <Image className="w-4 h-4 text-purple-600" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200">原始 SVG</h2>
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
              className="w-full h-[450px] p-4 resize-none focus:outline-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="输入或粘贴 SVG 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <h2 className="font-semibold text-slate-700 dark:text-slate-200">优化后 SVG</h2>
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
              className={`w-full h-[450px] p-4 resize-none focus:outline-none font-mono text-sm ${
                state.error
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
              }`}
            />
          </div>
        </div>

        {/* 统计信息 */}
        {!state.error && state.output && (
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">原始大小:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{state.originalSize} B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">优化后大小:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{state.optimizedSize} B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">减少:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{state.originalSize - state.optimizedSize} B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">压缩率:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">{compressionRatio}%</span>
              </div>
            </div>
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
                  onClick={() => handleInputChange((item as SvgState).input)}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {(item as SvgState).input.slice(0, 100)}...
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
      <SvgOptimizer />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
