import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as beautify from 'js-beautify';
import '../../index.css';

type CodeType = 'js' | 'css' | 'html' | 'xml' | 'sql';

function CodeBeautifyTool() {
  const [source, setSource] = useState('');
  const [result, setResult] = useState('');
  const [codeType, setCodeType] = useState<CodeType>('js');

  function doBeautify() {
    if (!source.trim()) {
      setResult('');
      return;
    }

    try {
      let beautified: string;

      switch (codeType) {
        case 'js':
          beautified = beautify.js(source, { indent_size: 2, space_in_empty: true });
          break;
        case 'css':
          beautified = beautify.css(source, { indent_size: 2 });
          break;
        case 'html':
          beautified = beautify.html(source, { indent_size: 2 });
          break;
        case 'xml':
          beautified = beautify.xml(source, { indent_size: 2 });
          break;
        case 'sql':
          beautified = beautify.sql(source, { indent_size: 2 });
          break;
      }

      setResult(beautified);
    } catch (e) {
      setResult('美化失败：' + (e instanceof Error ? e.message : String(e)));
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => {
      alert('已复制到剪贴板');
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">代码美化</h1>
      <h4 className="text-sm text-center text-gray-600 mb-6">
        源自：
        <a
          href="https://www.baidufe.com/fehelper/codebeautify.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          https://www.baidufe.com/fehelper/codebeautify.html
        </a>
      </h4>

      <div className="space-y-4">
        {/* 源代码 */}
        <div className="border rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">Text</label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="在这里粘贴需要进行美化的代码"
            className="w-full h-48 px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 操作按钮 */}
        <div className="border rounded-lg p-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCodeType('js')}
            className={`px-4 py-2 border rounded transition-colors ${
              codeType === 'js' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
            }`}
          >
            JS代码美化
          </button>
          <button
            onClick={() => setCodeType('css')}
            className={`px-4 py-2 border rounded transition-colors ${
              codeType === 'css' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
            }`}
          >
            CSS代码美化
          </button>
          <button
            onClick={() => setCodeType('html')}
            className={`px-4 py-2 border rounded transition-colors ${
              codeType === 'html' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
            }`}
          >
            HTML代码美化
          </button>
          <button
            onClick={() => setCodeType('xml')}
            className={`px-4 py-2 border rounded transition-colors ${
              codeType === 'xml' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
            }`}
          >
            XML代码美化
          </button>
          <button
            onClick={() => setCodeType('sql')}
            className={`px-4 py-2 border rounded transition-colors ${
              codeType === 'sql' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
            }`}
          >
            SQL代码美化
          </button>

          <button
            onClick={doBeautify}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            美化
          </button>
        </div>

        {/* 结果区域 */}
        <div className="border rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">结果</label>
          <textarea
            value={result}
            readOnly
            className="w-full h-48 px-3 py-2 border rounded bg-gray-50 font-mono text-sm"
          />
        </div>

        {/* 复制按钮 */}
        {result && (
          <div className="text-center">
            <button
              onClick={handleCopy}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              复制结果
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<CodeBeautifyTool />);
}
