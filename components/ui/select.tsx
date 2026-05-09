import { Select as AntdSelect } from 'antd';
import type { SelectProps as AntdSelectProps } from 'antd';
import { cn } from '@/lib/utils';

export function Select({ className, size = 'middle', ...props }: AntdSelectProps) {
  return <AntdSelect size={size} className={cn(className)} {...props} />;
}
