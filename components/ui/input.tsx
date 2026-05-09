import { Input as AntdInput } from 'antd';
import type { InputProps as AntdInputProps } from 'antd';
import { cn } from '@/lib/utils';

export function Input({ className, size = 'middle', ...props }: AntdInputProps) {
  return <AntdInput size={size} className={cn(className)} {...props} />;
}
