import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';

const RADIX_OPTIONS = [2, 8, 10, 16];

function TransRadixTool() {
  const [radixRadio1, setRadixRadio1] = useState(10);
  const [radixSelect1, setRadixSelect1] = useState<number | undefined>(undefined);
  const [value1, setValue1] = useState('');
  const [radixRadio2, setRadixRadio2] = useState(10);
  const [radixSelect2, setRadixSelect2] = useState<number | undefined>(undefined);
  const [value2, setValue2] = useState('');

  const currentRadix1 = radixSelect1 ?? radixRadio1;
  const currentRadix2 = radixSelect2 ?? radixRadio2;

  function convertValue1To2() {
    if (!value1) {
      setValue2('');
      return;
    }
    try {
      const num = parseInt(value1, currentRadix1);
      if (isNaN(num)) {
        setValue2('无效输入');
        return;
      }
      setValue2(num.toString(currentRadix2));
    } catch {
      setValue2('转换失败');
    }
  }

  function convertValue2To1() {
    if (!value2) {
      setValue1('');
      return;
    }
    try {
      const num = parseInt(value2, currentRadix2);
      if (isNaN(num)) {
        setValue1('无效输入');
        return;
      }
      setValue1(num.toString(currentRadix1));
    } catch {
      setValue1('转换失败');
    }
  }

  return (
    <div className="w-[400px] mx-auto p-6">
      <div className="space-y-6">
        {/* 第一行：选择进制和输入值 */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {RADIX_OPTIONS.map((r) => (
              <label key={r} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  value={r}
                  checked={radixRadio1 === r}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRadixRadio1(r);
                      setRadixSelect1(undefined);
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>{r}进制</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={radixSelect1 ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setRadixSelect1(val ? Number(val) : undefined);
                if (val) setRadixRadio1(-1);
              }}
              className="w-16 px-3 py-2 border rounded"
            >
              <option value="">自定义</option>
              {Array.from({ length: 35 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}进制
                </option>
              ))}
            </select>

            <input
              type="text"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder={`输入${currentRadix1}进制数`}
              className="flex-1 px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* 转换按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={convertValue1To2}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m14 0V3" />
            </svg>
          </button>
          <button
            onClick={convertValue2To1}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m14 0V3" />
            </svg>
          </button>
        </div>

        {/* 第二行：选择进制和显示结果 */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {RADIX_OPTIONS.map((r) => (
              <label key={r} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  value={r}
                  checked={radixRadio2 === r}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRadixRadio2(r);
                      setRadixSelect2(undefined);
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>{r}进制</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={radixSelect2 ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setRadixSelect2(val ? Number(val) : undefined);
                if (val) setRadixRadio2(-1);
              }}
              className="w-16 px-3 py-2 border rounded"
            >
              <option value="">自定义</option>
              {Array.from({ length: 35 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}进制
                </option>
              ))}
            </select>

            <input
              type="text"
              value={value2}
              readOnly
              placeholder={`结果${currentRadix2}进制数`}
              className="flex-1 px-3 py-2 border rounded bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<TransRadixTool />);
}
