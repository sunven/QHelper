import { Checkbox as AntdCheckbox } from 'antd';
import type { CheckboxProps as AntdCheckboxProps } from 'antd';
import { cn } from '@/lib/utils';

export type CheckboxProps = Omit<AntdCheckboxProps, 'onChange'> & {
  onChange?: AntdCheckboxProps['onChange'];
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ className, onChange, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <AntdCheckbox
      className={cn(className)}
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.target.checked);
      }}
      {...props}
    />
  );
}
