import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';

function ColorTransformTool() {
  const [srcRgb, setSrcRgb] = useState(['', '', '']);
  const [desHex, setDesHex] = useState('');
  const [srcHex, setSrcHex] = useState('');
  const [desRgbR, setDesRgbR] = useState('');
  const [desRgbG, setDesRgbG] = useState('');
  const [desRgbB, setDesRgbB] = useState('');
  const [color, setColor] = useState('#000000');

  function rgbToHex() {
    const [r, g, b] = srcRgb;
    const hexR = parseInt(r || '0').toString(16).padStart(2, '0');
    const hexG = parseInt(g || '0').toString(16).padStart(2, '0');
    const hexB = parseInt(b || '0').toString(16).padStart(2, '0');
    const hex = `#${hexR}${hexG}${hexB}`;
    setDesHex(hex);
    setColor(hex);
  }

  function hexToRgb() {
    if (!srcHex.startsWith('#')) {
      return;
    }
    const hex = srcHex.slice(1);
    if (hex.length !== 6) {
      return;
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    setDesRgbR(r.toString());
    setDesRgbG(g.toString());
    setDesRgbB(b.toString());
    setColor(srcHex);
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setColor(value);
    setSrcHex(value);
    hexToRgb();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-8">颜色转换</h1>

      <div className="space-y-6">
        {/* 颜色预览 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">颜色预览：</div>
            <div className="flex-1 h-16 rounded border" style={{ backgroundColor: color }} />
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="w-16 h-16 cursor-pointer"
            />
          </div>
        </div>

        {/* RGB → HEX */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4 border-b pb-2">【RGB】 → 【HEX】</h4>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={srcRgb[0]}
              onChange={(e) => setSrcRgb([e.target.value, srcRgb[1], srcRgb[2]])}
              placeholder="R"
              className="w-20 px-3 py-2 border rounded"
            />
            <input
              type="text"
              value={srcRgb[1]}
              onChange={(e) => setSrcRgb([srcRgb[0], e.target.value, srcRgb[2]])}
              placeholder="G"
              className="w-20 px-3 py-2 border rounded"
            />
            <input
              type="text"
              value={srcRgb[2]}
              onChange={(e) => setSrcRgb([srcRgb[0], srcRgb[1], e.target.value])}
              placeholder="B"
              className="w-20 px-3 py-2 border rounded"
            />
            <button
              onClick={rgbToHex}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              转换
            </button>
            <input
              type="text"
              value={desHex}
              disabled
              className="flex-1 px-3 py-2 border rounded disabled:bg-gray-200"
            />
          </div>
        </div>

        {/* HEX → RGB */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4 border-b pb-2">【HEX】 → 【RGB】</h4>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={srcHex}
              onChange={(e) => setSrcHex(e.target.value)}
              placeholder="#RRGGBB"
              className="w-32 px-3 py-2 border rounded"
            />
            <button
              onClick={hexToRgb}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              转换
            </button>
            <input
              type="text"
              value={desRgbR}
              disabled
              className="w-20 px-3 py-2 border rounded disabled:bg-gray-200"
            />
            <input
              type="text"
              value={desRgbG}
              disabled
              className="w-20 px-3 py-2 border rounded disabled:bg-gray-200"
            />
            <input
              type="text"
              value={desRgbB}
              disabled
              className="w-20 px-3 py-2 border rounded disabled:bg-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<ColorTransformTool />);
}
