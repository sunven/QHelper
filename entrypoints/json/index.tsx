import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ReactJsonView from 'react-json-view';
import '../../index.css';

interface HistoryItem {
  name: string;
  content: string;
}

function JsonTool() {
  const [jsoncon, setJsoncon] = useState('');
  const [newjsoncon, setNewjsoncon] = useState('');
  const [baseview, setBaseview] = useState<'formater' | 'diff'>('formater');
  const [view, setView] = useState<'code' | 'error' | 'empty'>('empty');
  const [jsonhtml, setJsonhtml] = useState<any>(null);
  const [compressStr, setCompressStr] = useState('');
  const [error, setError] = useState('');
  const [historys, setHistorys] = useState<HistoryItem[]>([]);
  const [isSaveShow, setIsSaveShow] = useState(false);
  const [historyName, setHistoryName] = useState('');
  const [isExportTxtShow, setIsExportTxtShow] = useState(false);
  const [exTxtName, setExTxtName] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const [rjv, setRjv] = useState<any>(null);

  // 处理 JSON 输入变化
  useEffect(() => {
    if (baseview === 'formater' && jsoncon) {
      try {
        const parsed = JSON.parse(jsoncon);
        setJsonhtml(parsed);
        setView('code');
        setError('');
      } catch (e) {
        setError('JSON 解析错误：' + (e instanceof Error ? e.message : String(e)));
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
      setError('JSON 解析错误：' + (e instanceof Error ? e.message : String(e)));
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
      setError('JSON 解析错误：' + (e instanceof Error ? e.message : String(e)));
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

  // 展开/折叠
  function handleExpandAll() {
    setExpandAll(true);
  }

  function handleCollapseAll() {
    setExpandAll(false);
  }

  // 切换到 Diff 视图
  function baseViewToDiff() {
    setBaseview('diff');
  }

  // 切换到格式化视图
  function baseViewToFormater() {
    setBaseview('formater');
  }

  // Diff 功能
  function diffTwo() {
    // 使用 diffview.js 和 difflib.js 实现
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
  function restore(his: HistoryItem) {
    setJsoncon(his.content);
  }

  // 删除历史记录
  function remove(his: HistoryItem, index: number) {
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
    <div className="flex h-screen">
      {/* 左侧输入 */}
      <div className={`flex-1 ${baseview === 'diff' ? 'w-1/2' : 'w-full'}`}>
        <textarea
          value={jsoncon}
          onChange={(e) => setJsoncon(e.target.value)}
          placeholder="请输入 JSON 字符串"
          className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none"
        />
      </div>

      {/* Diff 模式的第二个输入 */}
      {baseview === 'diff' && (
        <div className="w-1/2 border-l">
          <textarea
            value={newjsoncon}
            onChange={(e) => setNewjsoncon(e.target.value)}
            placeholder="请输入新的 JSON 字符串用于对比"
            className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none"
          />
        </div>
      )}

      {/* 分隔线 */}
      {baseview !== 'diff' && <div className="w-px bg-gray-300" />}

      {/* 右侧结果 */}
      {baseview !== 'diff' && (
        <div className="flex-1 overflow-auto">
          {/* 格式化视图 */}
          {baseview === 'formater' && (
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
                    shouldCollapse={({ rjv, depth }) => depth > 5}
                  />
                </div>
              )}

              {view === 'empty' && <div className="p-4 text-gray-400">空视图</div>}

              {view === 'compress' && (
                <textarea
                  value={compressStr}
                  readOnly
                  className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none bg-gray-50"
                />
              )}

              {view === 'error' && (
                <div className="p-4 text-red-600 font-mono text-sm whitespace-pre-wrap">{error}</div>
              )}
            </>
          )}

          {/* Diff 视图 */}
          {baseview === 'diff' && (
            <div id="diffoutput" className="p-4">
              <p className="text-gray-600">Diff 功能实现中...</p>
            </div>
          )}

          {/* 工具栏 */}
          {baseview === 'formater' && (
            <div className="fixed right-0 top-0 p-4 space-x-2">
              <button
                onClick={compress}
                className={`px-3 py-2 rounded ${view === 'compress' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                title="压缩"
              >
                📦
              </button>
              <button
                onClick={beauty}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="美化"
              >
                ✨
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="清空"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsExportTxtShow(true)}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="导出文本文件"
              >
                📄
              </button>
              <button
                onClick={handleExpandAll}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="全部展开"
              >
                ➕
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="全部折叠"
              >
                ➖
              </button>
              <button
                onClick={baseViewToDiff}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="Diff"
              >
                ↔️
              </button>

              {/* 历史记录 */}
              {historys.length > 0 && (
                <div className="relative">
                  <button className="px-3 py-2 rounded hover:bg-gray-100" title="历史保存">
                    📝
                  </button>
                  <div className="absolute right-0 top-full w-48 bg-white border rounded shadow-lg p-2 space-y-1">
                    {historys.map((his, index) => (
                      <div key={index} className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => restore(his)}
                          className="flex-1 text-left hover:bg-blue-50 px-2 py-1 rounded"
                        >
                          {his.name}
                        </button>
                        <button
                          onClick={() => remove(his, index)}
                          className="text-red-500 hover:bg-red-50 px-2 py-1"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsSaveShow(true)}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="保存"
              >
                💾
              </button>
            </div>
          )}

          {/* Diff 工具栏 */}
          {baseview === 'diff' && (
            <div className="fixed right-0 top-0 p-4 space-x-2">
              <button
                onClick={diffTwo}
                className="px-3 py-2 rounded bg-blue-600 text-white"
                title="Diff"
              >
                ↔️
              </button>
              <button
                onClick={baseViewToFormater}
                className="px-3 py-2 rounded hover:bg-gray-100"
                title="格式化视图"
              >
                🌳
              </button>
            </div>
          )}
        </div>
      )}

      {/* 保存对话框 */}
      {isSaveShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <button
              onClick={() => setIsSaveShow(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <input
              type="text"
              value={historyName}
              onChange={(e) => setHistoryName(e.target.value)}
              placeholder="请输入辨识名称"
              className="w-full px-3 py-2 border rounded"
              autoFocus
            />
            <button
              onClick={saveHistory}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 导出对话框 */}
      {isExportTxtShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <button
              onClick={() => setIsExportTxtShow(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <label className="block text-sm font-medium mb-2">.txt</label>
            <input
              type="text"
              value={exTxtName}
              onChange={(e) => setExTxtName(e.target.value)}
              placeholder="请输入辨识名称"
              className="w-full px-3 py-2 border rounded"
              autoFocus
            />
            <button
              onClick={exportTxt}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              下载
            </button>
          </div>
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
