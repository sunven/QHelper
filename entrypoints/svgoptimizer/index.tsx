import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { optimize } from 'svgo';
import { Copy, Download, Image, Zap, Upload } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

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
                cleanupIds: false,
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


    <ToolPageShell toolId="svgoptimizer">
      <div className="mx-auto max-w-[1520px]">

        {/* 文件上传 */}
        <div className="mb-2 rounded-md border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2">
            <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 text-sm text-white transition-colors hover:bg-emerald-700">
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
              <div className="flex min-w-0 items-center gap-1.5 truncate text-xs text-red-600 dark:text-red-400">
                <Zap className="w-4 h-4" />
                {state.error}
              </div>
            )}
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 gap-2 lg:grid-cols-2">
          {/* 输入区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">原始 SVG</h2>
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
              className="h-full min-h-[340px] w-full resize-none bg-white p-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 lg:min-h-0"
              placeholder="输入或粘贴 SVG 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">优化后 SVG</h2>
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
              className={`h-full min-h-[340px] w-full resize-none p-2.5 font-mono text-sm focus:outline-none lg:min-h-0 ${
                state.error
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
              }`}
            />
          </div>
        </div>

        {/* 统计信息 */}
        {!state.error && state.output && (
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-xs">
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
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">历史记录</h3>
            <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-md bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => handleInputChange((item as SvgState).input)}
                >
                  <div className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item as SvgState).input.slice(0, 100)}...
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
      <SvgOptimizer />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
