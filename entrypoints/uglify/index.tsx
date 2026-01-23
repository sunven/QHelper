import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import uglify from 'uglify-js';
import '../../index.css';

function UglifyTool() {
  const [source, setSource] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mangle, setMangle] = useState(true);
  const [compress, setCompress] = useState(true);

  function doUglify() {
    if (!source.trim()) {
      setError('请输入代码');
      return;
    }

    try {
      const result = uglify(source, {
        compress: {
          drop_console: false,
          drop_debugger: false,
        },
        mangle: mangle
          ? {
              reserved: ['require', 'exports', 'module'],
            }
          : false,
        output: {
          beautify: !compress,
          comments: !compress,
        },
      });

      if (result.error) {
        setError(result.error);
        setOutput('');
      } else {
        setError('');
        setOutput(result.code);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setOutput('');
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => {
      alert('已复制到剪贴板');
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">uglify</h1>

      <div className="space-y-4">
        {/* 选项区域 */}
        <div className="border rounded-lg p-4 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mangle}
              onChange={(e) => setMangle(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Mangle（变量名缩短）</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compress}
              onChange={(e) => setCompress(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Compress（去除空格和注释）</span>
          </label>

          <button
            onClick={doUglify}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            执行
          </button>
        </div>

        {/* 代码区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 源代码 */}
          <div className="border rounded-lg p-4">
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="在这里粘贴需要进行混淆的代码"
              className="w-full h-96 px-3 py-2 border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 结果代码 */}
          <div className="border rounded-lg p-4">
            {error && (
              <div className="mb-2 p-2 bg-red-50 text-red-600 rounded text-sm">
                {error}
              </div>
            )}
            <textarea
              value={output}
              readOnly
              className="w-full h-96 px-3 py-2 border rounded bg-gray-50 font-mono text-sm"
            />
          </div>
        </div>

        {/* 复制按钮 */}
        {output && (
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
  ReactDOM.createRoot(root).render(<UglifyTool />);
}
