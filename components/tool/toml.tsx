import React, { useState, useCallback, useEffect } from 'react';
import TOMLParser from 'toml-j0.4';
import { Copy, Download, FileJson, FileCode, ArrowLeftRight, Zap } from 'lucide-react';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Button } from '@/components/ui/button';
import { useToolHistory } from '@/hooks/useToolHistory';
import type { ToolHistoryItem } from '@/types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';

interface TomlState {
  input: string;
  output: string;
  mode: 'toml-to-json' | 'json-to-toml';
  error: string | null;
}

function TomlParser() {
  const [state, setState] = useState<TomlState>({
    input: `# 示例 TOML 配置
title = "TOML 示例"
owner = "Toml Preston"

[database]
server = "192.168.1.1"
ports = [8001, 8002, 8003]

[servers.alpha]
ip = "10.0.0.1"
dc = "eqdc10"
`,
    output: '',
    mode: 'toml-to-json',
    error: null,
  });

  const { addToHistory, history } = useToolHistory<TomlState>('toml', {
    maxSize: 10,
    key: 'toml-state',
  });

  // 转换
  useEffect(() => {
    if (!state.input.trim()) {
      setState((prev) => ({ ...prev, output: '', error: null }));
      return;
    }

    try {
      if (state.mode === 'toml-to-json') {
        const result = TOMLParser.parse(state.input);
        const json = JSON.stringify(result, null, 2);
        setState((prev) => ({ ...prev, output: json, error: null }));
      } else {
        const jsonObj = JSON.parse(state.input);
        const toml = TOMLParser.stringify(jsonObj);
        setState((prev) => ({ ...prev, output: toml, error: null }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '解析错误';
      setState((prev) => ({ ...prev, error: message, output: '' }));
    }
  }, [state.input, state.mode]);

  const handleInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const handleModeChange = useCallback((mode: 'toml-to-json' | 'json-to-toml') => {
    setState((prev) => ({ ...prev, mode, input: prev.output, output: prev.input, error: null }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.output);
    } catch {
      console.error('复制失败');
    }
  }, [state.output]);

  const handleDownload = useCallback(() => {
    const ext = state.mode === 'toml-to-json' ? 'json' : 'toml';
    const blob = new Blob([state.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    if (!state.error) {
      addToHistory({ ...state } as ToolHistoryItem);
    }
  }, [state.output, state.mode, addToHistory, state]);

  const handleSwap = useCallback(() => {
    handleModeChange(state.mode === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json');
  }, [state.mode, handleModeChange]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: '', output: '', error: null }));
  }, []);

  return (


    <ToolPageShell toolId="toml">
      <div className="mx-auto max-w-[1520px]">

        {/* 模式切换 */}
        <div className="mb-2 rounded-none border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                onClick={() => handleModeChange('toml-to-json')}
                variant={state.mode === 'toml-to-json' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                <FileJson className="w-4 h-4" />
                TOML → JSON
              </Button>
              <Button
                type="button"
                onClick={handleSwap}
                variant="outline"
                size="sm"
                className="px-2"
                title="交换方向"
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
              <Button
                type="button"
                onClick={() => handleModeChange('json-to-toml')}
                variant={state.mode === 'json-to-toml' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                <FileCode className="w-4 h-4" />
                JSON → TOML
              </Button>
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
          <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {state.mode === 'toml-to-json' ? 'TOML 输入' : 'JSON 输入'}
              </h2>
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
              placeholder={state.mode === 'toml-to-json' ? '输入 TOML 代码...' : '输入 JSON 代码...'}
              spellCheck={false}
            />
          </div>

          {/* 输出区域 */}
          <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {state.mode === 'toml-to-json' ? 'JSON 输出' : 'TOML 输出'}
              </h2>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!state.output}
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
                  disabled={!state.output}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Download className="w-3 h-3" />
                  下载
                </Button>
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
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-2 rounded-none border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">历史记录</h3>
            <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-none bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600"
                  onClick={() => handleInputChange((item as TomlState).input)}
                >
                  <div className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item as TomlState).input.slice(0, 100)}...
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
      <TomlParser />
    </ToolErrorBoundary>
  );
}
