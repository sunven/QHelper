import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import cronParser from 'cron-parser';
import { Clock, Calendar, Play, Copy, Download, RefreshCw } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
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
      const interval = cronParser.parseExpression(state.expression);
      const now = Date.now();
      const nextRuns: Date[] = [];

      for (let i = 0; i < 10; i++) {
        nextRuns.push(interval.next());
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Cron 表达式解析器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            解析、验证和计算 Cron 表达式运行时间
          </p>
        </div>

        {/* 预设按钮 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">常用预设</h3>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleExpressionChange(preset.value)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Cron 表达式
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={state.expression}
              onChange={(e) => handleExpressionChange(e.target.value)}
              placeholder="* * * * *"
              className={`flex-1 px-4 py-2 rounded-lg border-2 focus:outline-none transition-colors font-mono text-sm ${
                state.error
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-indigo-500'
              }`}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {state.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {state.error}
            </p>
          )}
        </div>

        {/* 结果区域 */}
        {state.isValid && state.nextRuns.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                下次运行时间
              </h2>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
            <div className="space-y-2">
              {state.nextRuns.map((date, index) => {
                const { dayLabel, time, full } = formatDate(date);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 w-16">
                      第 {index + 1} 次
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-16">
                      {dayLabel}
                    </span>
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300 flex-1">
                      {time}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {full}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 表达式格式说明 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Cron 表达式格式</h3>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded">
              * * * * * *
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
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
            <div className="mt-2 text-slate-500">
              <strong>特殊符号:</strong> * (任意值) , (列表) - (范围) / (间隔)
            </div>
          </div>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">历史记录</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
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
    </div>
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
