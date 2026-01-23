import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';

function TimestampTool() {
  const [nowDate, setNowDate] = useState('');
  const [now, setNow] = useState('');
  const [srcStamp, setSrcStamp] = useState('');
  const [desDate, setDesDate] = useState('');
  const [srcLocale, setSrcLocale] = useState('');
  const [desStamp, setDesStamp] = useState('');

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  function updateTime() {
    const now = new Date();
    setNowDate(formatDate(now));
    setNow(Math.floor(now.getTime() / 1000).toString());
  }

  function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }

  function stampToDate() {
    const stamp = parseInt(srcStamp);
    if (isNaN(stamp)) {
      setDesDate('');
      return;
    }
    const date = new Date(stamp * 1000);
    setDesDate(formatDate(date));
  }

  function dateToStamp() {
    const match = srcLocale.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!match) {
      setDesStamp('');
      return;
    }
    const [, y, m, d, h, min, s] = match;
    const date = new Date(
      parseInt(y),
      parseInt(m) - 1,
      parseInt(d),
      parseInt(h),
      parseInt(min),
      parseInt(s),
    );
    setDesStamp(Math.floor(date.getTime() / 1000).toString());
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-4">时间戳转换</h1>
      <h4 className="text-sm text-center text-gray-600 mb-6">
        源自：
        <a href="https://github.com/zxlie/FeHelper" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          https://github.com/zxlie/FeHelper
        </a>
      </h4>

      <div className="space-y-6">
        {/* Unix时间戳定义 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4 border-b pb-2">Unix时间戳定义</h4>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="w-32 text-right">现在的当地时间为：</span>
              <input type="text" value={nowDate} disabled className="flex-1 px-3 py-2 border rounded disabled:bg-gray-200" />
            </div>

            <div className="flex items-center gap-4">
              <span className="w-32 text-right">现在的Unix时间戳：</span>
              <input type="text" value={now} disabled className="flex-1 px-3 py-2 border rounded disabled:bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Unix时间戳 → 当地时间 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4 border-b pb-2">【Unix时间戳】 → 【当地时间】</h4>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={srcStamp}
              onChange={(e) => setSrcStamp(e.target.value)}
              placeholder="例如：1507722100"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={stampToDate}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              转换
            </button>
            <input
              type="text"
              value={desDate}
              disabled
              className="flex-1 px-3 py-2 border rounded disabled:bg-gray-200"
            />
          </div>
        </div>

        {/* 当地时间 → Unix时间戳 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-4 border-b pb-2">【当地时间】 → 【Unix时间戳】</h4>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={srcLocale}
              onChange={(e) => setSrcLocale(e.target.value)}
              placeholder="例如：2017-10-11 19:42:00"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={dateToStamp}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              转换
            </button>
            <input
              type="text"
              value={desStamp}
              disabled
              className="flex-1 px-3 py-2 border rounded disabled:bg-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<TimestampTool />);
}
