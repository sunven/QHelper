import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import ReactJsonView from 'react-json-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileJson,
  Sparkles,
  Trash2,
  FileText,
  Minus,
  Plus,
  ArrowRightLeft,
  Save,
  Download,
  X,
  Check,
  AlertCircle,
  Clock,
  FileWarning,
} from 'lucide-react';
import { jsonDiff, type DiffResult, type DiffChange } from '@/lib/utils/jsonDiff';
import { useToolHistory } from '@/hooks/useToolHistory';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import type { HistoryEntry } from '@/types/storage';
import '../../index.css';

// 文件大小阈值
const SIZE_THRESHOLDS = {
  SMALL: 100 * 1024,      // 100KB
  MEDIUM: 1024 * 1024,    // 1MB
  LARGE: 10 * 1024 * 1024, // 10MB
  WARNING: 5 * 1024 * 1024, // 5MB - 显示警告
};

// 获取文件大小描述
function getFileSizeDescription(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 10 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 防抖函数
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface HistoryItem {
  name: string;
  content: string;
}

function JsonTool() {
  const [jsoncon, setJsoncon] = useState('');
  const [newjsoncon, setNewjsoncon] = useState('');
  const [baseview, setBaseview] = useState<'formatter' | 'diff'>('formatter');
  const [view, setView] = useState<'code' | 'error' | 'empty' | 'compress'>('empty');
  const [jsonhtml, setJsonhtml] = useState<object | null>(null);
  const [compressStr, setCompressStr] = useState('');
  const [error, setError] = useState('');
  const [isSaveShow, setIsSaveShow] = useState(false);
  const [historyName, setHistoryName] = useState('');
  const [isExportTxtShow, setIsExportTxtShow] = useState(false);
  const [exTxtName, setExTxtName] = useState('');

  // Diff 相关状态
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [diffError, setDiffError] = useState('');

  // 性能优化相关状态
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [inputSize, setInputSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const parsingStartTimeRef = useRef<number>(0);

  // 使用防抖输入，对于大文件延迟解析
  const debouncedJsoncon = useDebounce(jsoncon, inputSize > SIZE_THRESHOLDS.MEDIUM ? 500 : 200);

  // 使用工具历史记录 Hook
  const { history, loading: historyLoading, addHistory, clearHistory, removeHistory } = useToolHistory<string, object>(
    'json',
    { maxHistory: 50 },
  );

  // 将历史记录转换为旧格式以保持兼容性
  const historys: HistoryItem[] = history.map((entry: HistoryEntry<string, object>) => ({
    name: entry.metadata?.name as string || `历史记录 ${new Date(entry.timestamp).toLocaleString()}`,
    content: entry.input,
  }));

  // 处理 JSON 输入变化
  useEffect(() => {
    // 更新输入大小
    setInputSize(jsoncon.length);

    if (baseview === 'formatter' && debouncedJsoncon) {
      setIsProcessing(true);
      parsingStartTimeRef.current = performance.now();

      // 使用 setTimeout 让 UI 有机会更新加载状态
      const timeoutId = setTimeout(() => {
        try {
          const parsed = JSON.parse(debouncedJsoncon);
          const endTime = performance.now();
          setProcessingTime(endTime - parsingStartTimeRef.current);
          setJsonhtml(parsed);
          setView('code');
          setError('');
        } catch (e) {
          setProcessingTime(0);
          setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`);
          setView('error');
          setJsonhtml(null);
        } finally {
          setIsProcessing(false);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    } else if (!debouncedJsoncon) {
      setJsonhtml(null);
      setView('empty');
      setError('');
      setProcessingTime(0);
      setIsProcessing(false);
    }
  }, [debouncedJsoncon, baseview]);

  // 压缩
  const compress = useCallback(() => {
    try {
      const parsed = JSON.parse(jsoncon);
      setCompressStr(JSON.stringify(parsed));
      setView('compress');
    } catch (e) {
      setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`);
    }
  }, [jsoncon]);

  // 美化
  const beauty = useCallback(() => {
    try {
      const parsed = JSON.parse(jsoncon);
      setJsonhtml(parsed);
      setCompressStr('');
      setView('code');
      setError('');
    } catch (e) {
      setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`);
      setView('error');
      setJsonhtml(null);
    }
  }, [jsoncon]);

  // 清空
  const clearAll = useCallback(() => {
    setJsoncon('');
    setNewjsoncon('');
    setJsonhtml(null);
    setCompressStr('');
    setError('');
    setView('empty');
  }, []);

  // 切换到 Diff 视图
  const baseViewToDiff = useCallback(() => {
    setBaseview('diff');
  }, []);

  // 切换到格式化视图
  const baseViewToFormatter = useCallback(() => {
    setBaseview('formatter');
  }, []);

  // 注册键盘快捷键
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        description: '清空输入',
        action: clearAll,
      },
      {
        key: 'Enter',
        ctrlKey: true,
        metaKey: true,
        description: '执行格式化',
        action: beauty,
      },
      {
        key: 's',
        ctrlKey: true,
        metaKey: true,
        description: '保存历史',
        action: () => {
          if (jsoncon) setIsSaveShow(true);
        },
      },
      {
        key: 'd',
        ctrlKey: true,
        metaKey: true,
        description: '切换到 Diff',
        action: baseViewToDiff,
      },
      {
        key: 'f',
        ctrlKey: true,
        metaKey: true,
        description: '切换到格式化',
        action: baseViewToFormatter,
      },
    ],
    [jsoncon, clearAll, beauty, baseViewToDiff, baseViewToFormatter]
  );

  // 使用键盘快捷键 Hook
  useKeyboardShortcuts({ shortcuts, isEnabled: true });

  // Diff 功能
  function diffTwo() {
    setDiffError('');
    setDiffResult(null);

    if (!jsoncon.trim() || !newjsoncon.trim()) {
      setDiffError('请输入两个 JSON 内容进行对比');
      return;
    }

    try {
      const result = jsonDiff(jsoncon, newjsoncon);
      setDiffResult(result);
    } catch (e) {
      setDiffError(`Diff 失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 渲染差异变更项
  function renderDiffChange(change: DiffChange) {
    const typeConfig = {
      added: { icon: Plus, className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20', label: '添加' },
      removed: { icon: Minus, className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20', label: '删除' },
      modified: { icon: AlertCircle, className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20', label: '修改' },
      unchanged: { icon: Check, className: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20', label: '未变化' },
    };

    const config = typeConfig[change.type];
    const Icon = config.icon;

    return (
      <div key={change.path} className={`p-3 rounded-md ${config.className} mb-2`}>
        <div className="flex items-start gap-2">
          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{config.label}</span>
              <code className="text-xs bg-black/10 dark:bg-black/20 px-1.5 py-0.5 rounded">
                {change.path || '(根)'}
              </code>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {change.oldValue !== undefined && (
                <div>
                  <span className="opacity-70">旧值:</span>
                  <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(change.oldValue, null, 2)}</pre>
                </div>
              )}
              {change.newValue !== undefined && (
                <div>
                  <span className="opacity-70">新值:</span>
                  <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(change.newValue, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 保存历史记录
  function saveHistory() {
    if (!historyName || !jsoncon) return;
    try {
      const parsed = JSON.parse(jsoncon);
      addHistory(jsoncon, parsed, { name: historyName });
      setIsSaveShow(false);
      setHistoryName('');
    } catch {
      // 忽略无效 JSON
    }
  }

  // 恢复历史记录
  function restore(_his: HistoryItem) {
    setJsoncon(_his.content);
  }

  // 删除历史记录
  async function remove(_his: HistoryItem, index: number) {
    // 从历史记录中找到对应的 entry 并删除
    if (history[index]) {
      await removeHistory(history[index].id);
    }
  }

  // 导出文本文件
  function exportTxt() {
    if (!exTxtName || !jsoncon) return;
    const blob = new Blob([jsoncon], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exTxtName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportTxtShow(false);
    setExTxtName('');
  }

  // 性能指示器组件
  const PerformanceIndicator = useMemo(() => {
    if (!jsoncon && !inputSize) return null;

    const showWarning = inputSize >= SIZE_THRESHOLDS.WARNING;
    const sizeText = getFileSizeDescription(inputSize);

    return (
      <div className={`flex items-center gap-2 text-xs ${
        showWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
      }`}>
        {showWarning && <FileWarning className="w-3 h-3" />}
        <span>{sizeText}</span>
        {processingTime > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{processingTime.toFixed(1)}ms</span>
            </div>
          </>
        )}
        {isProcessing && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="animate-pulse">处理中...</span>
          </>
        )}
      </div>
    );
  }, [inputSize, processingTime, isProcessing, jsoncon]);

  return (
    <div className="h-screen flex flex-col">
      {/* 工具栏 */}
      <div className="border-b p-2 flex items-center gap-2 bg-muted/50 flex-wrap">
        <Button
          variant={baseview === 'formatter' ? 'default' : 'outline'}
          size="sm"
          onClick={baseViewToFormatter}
          className="gap-1.5"
        >
          <FileJson className="w-4 h-4" />
          格式化
        </Button>
        <Button
          variant={baseview === 'diff' ? 'default' : 'outline'}
          size="sm"
          onClick={baseViewToDiff}
          className="gap-1.5"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Diff
        </Button>

        {/* 性能指示器 */}
        {PerformanceIndicator}

        {baseview === 'formatter' && (
          <>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={compress} className="gap-1.5">
              <Minus className="w-4 h-4" />
              压缩
            </Button>
            <Button variant="outline" size="sm" onClick={beauty} className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              美化
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
              <Trash2 className="w-4 h-4" />
              清空
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsExportTxtShow(true)} className="gap-1.5">
              <Download className="w-4 h-4" />
              导出
            </Button>
            <div className="flex-1" />
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Save className="w-4 h-4" />
                历史 ({historys.length})
              </Button>
              {historys.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-md shadow-lg p-2 z-10">
                  {historys.map((his, index) => (
                    <div
                      key={`${his.name}-${index}`}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-muted rounded"
                    >
                      <button
                        type="button"
                        onClick={() => restore(his)}
                        className="flex-1 text-left text-sm"
                      >
                        {his.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(his, index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsSaveShow(true)} className="gap-1.5">
              <Save className="w-4 h-4" />
              保存
            </Button>
          </>
        )}

        {baseview === 'diff' && (
          <>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="default" size="sm" onClick={diffTwo} className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4" />
              执行 Diff
            </Button>
          </>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧输入 */}
        <div
          className={`flex-1 ${
            baseview === 'diff'
              ? diffResult
                ? 'w-1/3'
                : 'w-1/2'
              : 'w-full'
          } border-r`}
        >
          <Textarea
            value={jsoncon}
            onChange={(e) => setJsoncon(e.target.value)}
            placeholder="请输入 JSON 字符串"
            className="w-full h-full border-0 rounded-none resize-none font-mono text-sm"
          />
        </div>

        {/* Diff 模式的第二个输入或结果展示 */}
        {baseview === 'diff' && (
          <>
            {diffResult ? (
              /* Diff 结果展示 */
              <div className="flex-1 overflow-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Diff 结果
                      {diffResult.isModified && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({diffResult.changes.length} 处变更)
                        </span>
                      )}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiffResult(null)}
                      className="gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      清除
                    </Button>
                  </div>

                  {diffError && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">
                      {diffError}
                    </div>
                  )}

                  {!diffResult.isModified ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>两个 JSON 完全相同，没有发现差异</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {diffResult.changes.map(renderDiffChange)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 第二个 JSON 输入 */
              <div className="w-1/2">
                <Textarea
                  value={newjsoncon}
                  onChange={(e) => setNewjsoncon(e.target.value)}
                  placeholder="请输入新的 JSON 字符串用于对比"
                  className="w-full h-full border-0 rounded-none resize-none font-mono text-sm"
                />
              </div>
            )}
          </>
        )}

        {/* 右侧结果 */}
        {baseview !== 'diff' && (
          <div className="flex-1 overflow-auto">
            {baseview === 'formatter' && (
              <>
                {isProcessing && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4" />
                    <p className="text-sm">处理中...</p>
                    {inputSize > SIZE_THRESHOLDS.MEDIUM && (
                      <p className="text-xs mt-2">大文件处理可能需要较长时间</p>
                    )}
                  </div>
                )}

                {!isProcessing && view === 'code' && jsonhtml && (
                  <div className="p-4">
                    <ReactJsonView
                      src={jsonhtml}
                      theme="monokai"
                      enableClipboard
                      shouldCollapse={(field) => {
                        // 对于大型对象，默认折叠以提高性能
                        if (inputSize > SIZE_THRESHOLDS.MEDIUM) {
                          return typeof field !== 'string';
                        }
                        return false;
                      }}
                      displayObjectSize={inputSize <= SIZE_THRESHOLDS.LARGE}
                      displayDataTypes={inputSize <= SIZE_THRESHOLDS.LARGE}
                    />
                  </div>
                )}

                {view === 'empty' && (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileJson className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>请输入 JSON 字符串</p>
                  </div>
                )}

                {view === 'compress' && (
                  <Textarea
                    value={compressStr}
                    readOnly
                    className="w-full h-full border-0 rounded-none resize-none font-mono text-sm bg-muted/30"
                  />
                )}

                {view === 'error' && (
                  <div className="p-4 text-destructive font-mono text-sm whitespace-pre-wrap">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 保存对话框 */}
      {isSaveShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-base">保存历史</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                value={historyName}
                onChange={(e) => setHistoryName(e.target.value)}
                placeholder="请输入辨识名称"
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsSaveShow(false)} className="flex-1">
                  取消
                </Button>
                <Button onClick={saveHistory} className="flex-1">
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 导出对话框 */}
      {isExportTxtShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-base">导出为 .txt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                value={exTxtName}
                onChange={(e) => setExTxtName(e.target.value)}
                placeholder="请输入文件名"
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsExportTxtShow(false)} className="flex-1">
                  取消
                </Button>
                <Button onClick={exportTxt} className="flex-1">
                  下载
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mount the React app
const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<JsonTool />);
}
