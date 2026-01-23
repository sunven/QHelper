import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';

function ConvertTool() {
  const [srcText, setSrcText] = useState('');
  const [result, setResult] = useState('');

  // HTML转义
  function htmlEscape() {
    const div = document.createElement('div');
    div.textContent = srcText;
    setResult(div.innerHTML);
  }

  // HTML反转义
  function htmlUnescape() {
    const div = document.createElement('div');
    div.innerHTML = srcText;
    setResult(div.textContent || '');
  }

  // Unicode编码
  function uniEncode() {
    let str = '';
    for (let i = 0; i < srcText.length; i++) {
      const code = srcText.charCodeAt(i).toString(16);
      str += '\\u' + '0000'.substring(0, 4 - code.length) + code;
    }
    setResult(str);
  }

  // Unicode解码
  function uniDecode() {
    setResult(srcText.replace(/\\u([\d\w]{4})/gi, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    }));
  }

  // UTF8(URL)编码
  function utf8Encode() {
    setResult(encodeURIComponent(srcText));
  }

  // UTF8(URL)解码
  function utf8Decode() {
    try {
      setResult(decodeURIComponent(srcText));
    } catch {
      setResult('解码失败，请检查输入');
    }
  }

  // Base64编码
  function base64Encode() {
    try {
      setResult(btoa(encodeURIComponent(srcText).replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode('0x' + p1),
      )));
    } catch {
      setResult('Base64 编码失败');
    }
  }

  // Base64解码
  function base64Decode() {
    try {
      setResult(decodeURIComponent(
        atob(srcText)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ));
    } catch {
      setResult('Base64 解码失败');
    }
  }

  // MD5编码（使用 Web Crypto API）
  async function md5Encode() {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(srcText);
      const hash = await crypto.subtle.digest('MD5', data);
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setResult(hashHex);
    } catch {
      setResult('MD5 编码失败');
    }
  }

  // HTML转JS字符串
  function html2js() {
    setResult(JSON.stringify(srcText));
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">字符串编解码</h1>
      <h4 className="text-sm text-center text-gray-600 mb-6">
        源自：
        <a
          href="https://www.baidufe.com/fehelper/endecode.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          https://www.baidufe.com/fehelper/endecode.html
        </a>
      </h4>

      <div className="space-y-4">
        {/* 输入区域 */}
        <div className="border rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">Text</label>
          <textarea
            value={srcText}
            onChange={(e) => setSrcText(e.target.value)}
            placeholder="粘贴需要进行编解码的字符串"
            className="w-full h-48 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 编码按钮 */}
        <div className="border rounded-lg p-4 flex flex-wrap gap-2">
          <button
            onClick={htmlEscape}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            HTML转义
          </button>
          <button
            onClick={uniEncode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            Unicode编码
          </button>
          <button
            onClick={utf8Encode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            UTF8编码
          </button>
          <button
            onClick={base64Encode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            base64编码
          </button>
          <button
            onClick={md5Encode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            md5编码
          </button>
          <button
            onClick={html2js}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            html2js
          </button>
        </div>

        {/* 解码按钮 */}
        <div className="border rounded-lg p-4 flex flex-wrap gap-2">
          <button
            onClick={htmlUnescape}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            HTML反转义
          </button>
          <button
            onClick={uniDecode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            Unicode解码
          </button>
          <button
            onClick={utf8Decode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            UTF8解码
          </button>
          <button
            onClick={base64Decode}
            className="px-4 py-2 border rounded hover:bg-blue-50 transition-colors"
          >
            base64解码
          </button>
        </div>

        {/* 结果区域 */}
        <div className="border rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">结果</label>
          <textarea
            value={result}
            readOnly
            className="w-full h-48 px-3 py-2 border rounded bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}

// Mount the React app
const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<ConvertTool />);
}
