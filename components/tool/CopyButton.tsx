import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  /** 要复制的内容 */
  content: string;
  /** 按钮标签 */
  label?: string;
  /** 复制成功后显示的时长（毫秒） */
  successDuration?: number;
  /** 按钮变体 */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  /** 按钮大小 */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** 额外的类名 */
  className?: string;
  /** 复制成功回调 */
  onCopy?: () => void;
}

/**
 * 复制按钮组件
 *
 * 提供一键复制功能，带有复制成功反馈
 *
 * @example
 * ```tsx
 * <CopyButton content={output} label="复制结果" />
 * <CopyButton content={output} variant="outline" size="sm" />
 * ```
 */
export function CopyButton({
  content,
  label = '复制',
  successDuration = 2000,
  variant = 'outline',
  size = 'default',
  className = '',
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.();

      setTimeout(() => {
        setCopied(false);
      }, successDuration);
    } catch (error) {
      console.error('复制失败:', error);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={!content || copied}
      className={`gap-2 ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          已复制
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {label}
        </>
      )}
    </Button>
  );
}
