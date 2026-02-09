import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { copyToClipboard, formatFileSize } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Copy, Image as ImageIcon, FileType } from 'lucide-react';
import '../../index.css';
import { ToolNavigation } from '@/components/ToolNavigation';

function ImageBase64Tool() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [sizeOri, setSizeOri] = useState(0);
  const [sizeBase, setSizeBase] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | Blob) => {
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
  }, []);

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
  }, [processFile]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleCopy() {
    copyToClipboard(result).then(() => {
      alert('已复制到剪贴板');
    });
  }

  return (
    <>
      <ToolNavigation />
      <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-2">图片 Base64 编码</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        将图片转换为 DataURI 格式
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：预览和上传 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-4 h-4" />
              图片预览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview ? (
              <img
                src={preview}
                alt="预览"
                className="w-full h-auto rounded-md border"
              />
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md text-muted-foreground">
                <span className="text-sm">图片预览区域</span>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                选择图片
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                支持拖拽或 Ctrl + V 粘贴
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* 右侧：结果 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileType className="w-4 h-4" />
              Base64 结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={result}
              readOnly
              placeholder="Base64 结果将显示在这里"
              className="h-48 font-mono text-xs"
            />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">原始大小</span>
                <div className="font-medium">{formatFileSize(sizeOri)}</div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Base64 大小</span>
                <div className="font-medium">{formatFileSize(sizeBase)}</div>
              </div>
            </div>

            {result && (
              <Button onClick={handleCopy} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                复制到剪贴板
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="imagebase64" toolName="图片 Base64 编码">
      <ImageBase64Tool />
    </ToolErrorBoundary>,
  );
}
