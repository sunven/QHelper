import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';

function ImageBase64Tool() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [sizeOri, setSizeOri] = useState(0);
  const [sizeBase, setSizeBase] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Handle paste events
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const blob = items[i].getAsFile();
          if (blob) {
            processFile(blob);
          }
          break;
        }
      }
    };

    // Handle drag and drop
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', handleDragOver);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', handleDragOver);
    };
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function processFile(file: File | Blob) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setResult(dataUrl);
      setSizeOri(file.size);

      // Calculate base64 size (approximately)
      const base64Size = Math.round(dataUrl.length * 0.75);
      setSizeBase(base64Size);
    };
    reader.readAsDataURL(file);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => {
      alert('已复制到剪贴板');
    });
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        图片Base64编码工具（DataURI数据）
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：预览和上传 */}
        <div className="border rounded-lg p-4 min-h-[400px]">
          {preview ? (
            <img src={preview} alt="预览" className="max-w-full h-auto rounded" />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed rounded-lg">
              <span className="text-sm">图片预览区域</span>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              选择图片
            </button>
            <p className="text-sm text-gray-600">或者选择一张图片拖拽图片到这里来</p>
            <p className="text-xs text-gray-500">支持屏幕截图后直接 Ctrl + V</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 右侧：结果 */}
        <div className="border rounded-lg p-4 min-h-[400px]">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">DataURI</label>
            <textarea
              value={result}
              readOnly
              className="w-full h-64 px-3 py-2 border rounded bg-gray-50 text-xs font-mono"
            />
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="font-medium">原始图片大小：</span>
              <span>{formatSize(sizeOri)}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-medium">DataURI 大小：</span>
              <span>{formatSize(sizeBase)}</span>
            </li>
          </ul>

          {result && (
            <button
              onClick={handleCopy}
              className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              复制到剪贴板
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<ImageBase64Tool />);
}
