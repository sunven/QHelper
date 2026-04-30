import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import cronParser from 'cron-parser';
import { Clock, Calendar, Play, Copy, Download, RefreshCw } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

interface CronState {
  expression: string;
  isValid: boolean;
  error: string | null;
  nextRuns: Date[];
  interval: string;
}

function CronParser() {
  const [state, setState] = useState<CronState>({
    expression: '0 0 * * *',
    isValid: true,
    error: null,
    nextRuns: [],
    interval: '0 */1 * * * *',
  });

  const { addToHistory, history } = useToolHistory<CronState>('cron', {
    maxSize: 10,
    key: 'cron-state',
  });

  // 解析 Cron 表达式
  useEffect(() => {
    if (!state.expression.trim()) {
      setState((prev) => ({ ...prev, isValid: false, error: '请输入 Cron 表达式', nextRuns: [] }));
      return;
    }

    try {
      const interval = cronParser.parse(state.expression);
      const now = Date.now();
      const nextRuns: Date[] = [];

      for (let i = 0; i < 10; i++) {
        nextRuns.push(interval.next().toDate());
      }

      setState((prev) => ({ ...prev, isValid: true, error: null, nextRuns }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '无效的 Cron 表达式';
      setState((prev) => ({ ...prev, isValid: false, error: message, nextRuns: [] }));
    }
  }, [state.expression]);

  // 常用预设
  const presets = [
    { name: '每分钟', value: '* * * * *' },
    { name: '每小时', value: '0 * * * *' },
    { name: '每天 0 点', value: '0 0 * * *' },
    { name: '每周一 0 点', value: '0 0 * * 1' },
    { name: '每月 1 号 0 点', value: '0 0 1 * *' },
    { name: '每 5 分钟', value: '*/5 * * * *' },
    { name: '工作日 9 点', value: '0 9 * * 1-5' },
  ];

  const handleExpressionChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, expression: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.expression);
    } catch {
      console.error('复制失败');
    }
  }, [state.expression]);

  const handleDownload = useCallback(() => {
    const content = `Cron 表达式: ${state.expression}
${state.error ? `错误: ${state.error}` : ''}

${state.isValid ? `下次运行时间:\n${state.nextRuns.map(d => `  ${d.toLocaleString('zh-CN')}`).join('\n')}` : ''}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cron-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToHistory({ ...state } as ToolHistoryItem);
  }, [state.expression, state.error, state.isValid, state.nextRuns, addToHistory]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();

    let dayLabel = '';
    if (isToday) dayLabel = '今天';
    else if (isTomorrow) dayLabel = '明天';
    else dayLabel = date.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });

    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const full = date.toLocaleString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' });

    return { dayLabel, time, full };
  };

  return (
    <ToolPageShell toolId="cron">
      <div className="mx-auto grid max-w-[1320px] gap-2 xl:grid-cols-[minmax(320px,0.85fr)_minmax(520px,1.15fr)]">
        <div className="space-y-2">
          <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <div className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">常用预设</div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleExpressionChange(preset.value)}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Cron 表达式</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={state.expression}
                onChange={(e) => handleExpressionChange(e.target.value)}
                placeholder="* * * * *"
                className={`h-9 flex-1 rounded-md border px-2.5 font-mono text-sm transition-colors focus:outline-none ${
                  state.error
                    ? 'border-red-300 bg-red-50 text-slate-900 dark:border-red-700 dark:bg-red-900/20 dark:text-slate-100'
                    : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                }`}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-white transition-colors hover:bg-slate-800"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {state.error && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <Calendar className="h-3.5 w-3.5" />
                {state.error}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <h3 className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Cron 表达式格式</h3>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="rounded bg-slate-100 p-1.5 font-mono dark:bg-slate-800">* * * * * *</div>
              <div className="grid grid-cols-5 gap-1 text-center">
                <div>
                  <div className="font-semibold">分钟</div>
                  <div className="text-slate-500">0-59</div>
                </div>
                <div>
                  <div className="font-semibold">小时</div>
                  <div className="text-slate-500">0-23</div>
                </div>
                <div>
                  <div className="font-semibold">日期</div>
                  <div className="text-slate-500">1-31</div>
                </div>
                <div>
                  <div className="font-semibold">月份</div>
                  <div className="text-slate-500">1-12</div>
                </div>
                <div>
                  <div className="font-semibold">星期</div>
                  <div className="text-slate-500">0-6</div>
                </div>
              </div>
              <div className="text-slate-500">
                <strong>特殊符号:</strong> * (任意值) , (列表) - (范围) / (间隔)
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
              <h3 className="mb-1.5 font-semibold text-slate-700 dark:text-slate-300">历史记录</h3>
              <div className="max-h-36 space-y-1 overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="cursor-pointer rounded-md bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => handleExpressionChange((item as CronState).expression)}
                  >
                    <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                      {(item as CronState).expression}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {state.isValid && state.nextRuns.length > 0 && (
          <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-slate-700 dark:text-slate-300">
                <Calendar className="h-4 w-4" />
                下次运行时间
              </h2>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" />
                导出
              </button>
            </div>
            <div className="max-h-[calc(100vh-12rem)] space-y-1 overflow-y-auto">
              {state.nextRuns.map((date, index) => {
                const { dayLabel, time, full } = formatDate(date);
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[4.5rem_4rem_1fr_1.5fr] items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">第 {index + 1} 次</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dayLabel}</span>
                    <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{time}</span>
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400" title={full}>
                      {full}
                    </span>
                  </div>
                );
              })}
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
      <CronParser />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
