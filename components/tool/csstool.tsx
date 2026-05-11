import React, { useState, useCallback, useEffect } from 'react';
import * as csso from 'csso';
import { Copy, Download, Palette, Minimize2, Maximize2 } from 'lucide-react';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Button } from '@/components/ui/button';
import { useToolHistory } from '@/hooks/useToolHistory';
import type { ToolHistoryItem } from '@/types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';

interface CssToolState {
  input: string;
  output: string;
  mode: 'beautify' | 'minify';
}

function CssTool() {
  const [state, setState] = useState<CssToolState>({
    input: `.container {
  width: 100%;
  padding: 20px;
  background: #ffffff;
  color: #333333;
}`,
    output: '',
    mode: 'minify',
  });

  const { addToHistory, history } = useToolHistory<CssToolState>('csstool', {
    maxSize: 10,
    key: 'csstool-state',
  });

  // 处理 CSS
  useEffect(() => {
    try {
      let result: string;
      if (state.mode === 'minify') {
        // 压缩 CSS
        const minified = csso.minify(state.input);
        result = minified.css;
      } else {
        // 美化 CSS (使用简单的格式化)
        const minified = csso.minify(state.input);
        const css = minified.css;
        // 简单的美化 - 添加换行和缩进
        result = css
          .replace(/\{/g, ' {\n  ')
          .replace(/\}/g, '\n}\n')
          .replace(/;/g, ';\n  ')
          .replace(/^\s+/gm, '')
          .replace(/\n\s*\n/g, '\n')
          .trim();
      }
      setState((prev) => ({ ...prev, output: result }));
    } catch {
      setState((prev) => ({ ...prev, output: '/* 错误：输入的不是有效的 CSS */' }));
    }
  }, [state.input, state.mode]);

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
    a.download = `style-${state.mode}-${Date.now()}.css`;
    a.click();
    URL.revokeObjectURL(url);
    addToHistory({ ...state } as ToolHistoryItem);
  }, [state.output, state.mode, addToHistory, state]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: '', output: '' }));
  }, []);

  return (


    <ToolPageShell toolId="csstool">
      <div className="mx-auto max-w-[1520px]">

        {/* 操作栏 */}
        <div className="mb-2 rounded-none border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            {/* 模式切换 */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant={state.mode === 'beautify' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, mode: 'beautify' }))}
                className="gap-1.5"
              >
                <Maximize2 className="w-4 h-4" />
                美化
              </Button>
              <Button
                type="button"
                variant={state.mode === 'minify' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, mode: 'minify' }))}
                className="gap-1.5"
              >
                <Minimize2 className="w-4 h-4" />
                压缩
              </Button>
            </div>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-2 lg:grid-cols-2">
          {/* 输入区域 */}
          <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">输入 CSS</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs"
              >
                清空
              </Button>
            </div>
            <textarea
              value={state.input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="h-full min-h-[360px] w-full resize-none bg-white p-2.5 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 lg:min-h-0"
              placeholder="输入 CSS 代码..."
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {state.mode === 'beautify' ? '美化结果' : '压缩结果'}
              </h2>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Copy className="w-3 h-3" />
                  复制
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Download className="w-3 h-3" />
                  下载
                </Button>
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
          <div className="mt-2 rounded-none border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">历史记录</h3>
            <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-none bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => handleInputChange((item as CssToolState).input)}
                >
                  <div className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item as CssToolState).input.slice(0, 100)}...
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

export function App() {
  return (
    <ToolErrorBoundary>
      <CssTool />
    </ToolErrorBoundary>
  );
}
