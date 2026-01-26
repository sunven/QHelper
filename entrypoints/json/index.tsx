import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ReactJsonView from 'react-json-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileJson,
  Compress,
  Sparkles,
  Trash2,
  FileText,
  Minus,
  Plus,
  ArrowRightLeft,
  Save,
  Download,
  X,
} from 'lucide-react';
import '../../index.css';

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
  const [historys, setHistorys] = useState<HistoryItem[]>([]);
  const [isSaveShow, setIsSaveShow] = useState(false);
  const [historyName, setHistoryName] = useState('');
  const [isExportTxtShow, setIsExportTxtShow] = useState(false);
  const [exTxtName, setExTxtName] = useState('');

  // 处理 JSON 输入变化
  useEffect(() => {
    if (baseview === 'formatter' && jsoncon) {
      try {
        const parsed = JSON.parse(jsoncon);
        setJsonhtml(parsed);
        setView('code');
        setError('');
      } catch (e) {
        setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`);
        setView('error');
        setJsonhtml(null);
      }
    }
  }, [jsoncon, baseview]);

  // 压缩
  function compress() {
    try {
      const parsed = JSON.parse(jsoncon);
      setCompressStr(JSON.stringify(parsed));
      setView('compress');
    } catch (e) {
      setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 美化
  function beauty() {
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
  }

  // 清空
  function clearAll() {
    setJsoncon('');
    setNewjsoncon('');
    setJsonhtml(null);
    setCompressStr('');
    setError('');
    setView('empty');
  }

  // 展开/折叠（预留功能）
  function handleExpandAll() {
    // TODO: 实现展开功能
  }

  function handleCollapseAll() {
    // TODO: 实现折叠功能
  }

  // 切换到 Diff 视图
  function baseViewToDiff() {
    setBaseview('diff');
  }

  // 切换到格式化视图
  function baseViewToFormatter() {
    setBaseview('formatter');
  }

  // Diff 功能
  function diffTwo() {
    alert('Diff 功能需要加载 diffview.js 和 difflib.js 库，将在完整实现中添加');
  }

  // 保存历史记录
  function saveHistory() {
    if (!historyName || !jsoncon) return;
    const newHistory: HistoryItem = { name: historyName, content: jsoncon };
    setHistorys((prev) => [...prev, newHistory]);
    setIsSaveShow(false);
    setHistoryName('');
  }

  // 恢复历史记录
  function restore(_his: HistoryItem) {
    setJsoncon(_his.content);
  }

  // 删除历史记录
  function remove(_his: HistoryItem, index: number) {
    setHistorys((prev) => prev.filter((_, i) => i !== index));
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

  return (
    <div className="h-screen flex flex-col">
      {/* 工具栏 */}
      <div className="border-b p-2 flex items-center gap-2 bg-muted/50">
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

        {baseview === 'formatter' && (
          <>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={compress} className="gap-1.5">
              <Compress className="w-4 h-4" />
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
        <div className={`flex-1 ${baseview === 'diff' ? 'w-1/2' : 'w-full'} border-r`}>
          <Textarea
            value={jsoncon}
            onChange={(e) => setJsoncon(e.target.value)}
            placeholder="请输入 JSON 字符串"
            className="w-full h-full border-0 rounded-none resize-none font-mono text-sm"
          />
        </div>

        {/* Diff 模式的第二个输入 */}
        {baseview === 'diff' && (
          <div className="w-1/2">
            <Textarea
              value={newjsoncon}
              onChange={(e) => setNewjsoncon(e.target.value)}
              placeholder="请输入新的 JSON 字符串用于对比"
              className="w-full h-full border-0 rounded-none resize-none font-mono text-sm"
            />
          </div>
        )}

        {/* 右侧结果 */}
        {baseview !== 'diff' && (
          <div className="flex-1 overflow-auto">
            {baseview === 'formatter' && (
              <>
                {view === 'code' && jsonhtml && (
                  <div className="p-4">
                    <ReactJsonView
                      src={jsonhtml}
                      theme="monokai"
                      onAdd={(path) => console.log('Add:', path)}
                      onEdit={(edit) => console.log('Edit:', edit)}
                      onDelete={(path) => console.log('Delete:', path)}
                      enableClipboard
                      shouldCollapse={() => true}
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
