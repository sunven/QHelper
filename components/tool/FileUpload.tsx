import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
  /** 文件上传回调 */
  onFileSelect: (file: File) => void;
  /** 接受的文件类型 */
  accept?: string;
  /** 按钮标签 */
  label?: string;
  /** 是否显示已选文件 */
  showFile?: boolean;
  /** 清除文件回调 */
  onClear?: () => void;
  /** 额外的类名 */
  className?: string;
  /** 按钮变体 */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

/**
 * 文件上传组件
 *
 * 提供文件选择和上传功能
 *
 * @example
 * ```tsx
 * <FileUpload
 *   onFileSelect={(file) => processFile(file)}
 *   accept=".json,.txt"
 *   label="选择文件"
 *   showFile
 * />
 * ```
 */
export function FileUpload({
  onFileSelect,
  accept,
  label = '选择文件',
  showFile = true,
  onClear,
  className = '',
  variant = 'outline',
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    onClear?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <Button variant={variant} size="sm" onClick={handleClick} className="gap-2">
        <Upload className="w-4 h-4" />
        {label}
      </Button>

      {showFile && selectedFile && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="max-w-[200px] truncate">{selectedFile.name}</span>
          <span className="text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-0.5"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface DropZoneProps {
  /** 文件放置回调 */
  onFileDrop: (file: File) => void;
  /** 接受的文件类型 */
  accept?: string;
  /** 子内容 */
  children: ReactNode;
  /** 额外的类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

import type { ReactNode } from 'react';

/**
 * 拖放区域组件
 *
 * 支持拖放文件上传
 *
 * @example
 * ```tsx
 * <DropZone onFileDrop={(file) => processFile(file)} accept=".json">
 *   <div className="p-8 text-center">
 *     <p>拖放文件到此处</p>
 *   </div>
 * </DropZone>
 * ```
 */
export function DropZone({
  onFileDrop,
  accept,
  children,
  className = '',
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files[0];
    if (file) {
      // 检查文件类型
      if (accept) {
        const acceptedTypes = accept.split(',').map((type) => type.trim());
        const fileExtension = `.${file.name.split('.').pop()}`;
        if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes(file.type)) {
          console.warn('不支持的文件类型:', file.type);
          return;
        }
      }
      onFileDrop(file);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
