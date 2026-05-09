import { Button as AntdButton } from 'antd';
import type { ButtonProps as AntdButtonProps } from 'antd';
import { cn } from './utils';

export interface ButtonProps
  extends Omit<AntdButtonProps, 'htmlType' | 'variant' | 'danger' | 'size' | 'type'> {
  variant?: 'default' | 'primary' | 'destructive' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
}

const variantMap: Record<
  NonNullable<ButtonProps['variant']>,
  Pick<AntdButtonProps, 'danger' | 'ghost' | 'type' | 'variant'>
> = {
  default: { type: 'primary' },
  primary: { type: 'primary' },
  destructive: { type: 'primary', danger: true },
  ghost: { variant: 'text' },
  outline: { variant: 'outlined' },
  secondary: { variant: 'filled' },
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const mapped = variantMap[variant];

  return (
    <AntdButton
      htmlType={type}
      {...mapped}
      size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'middle'}
      className={cn(
        size === 'icon' && 'h-8 w-8 p-0',
        variant === 'default' && 'shadow-sm',
        variant === 'outline' && 'shadow-none',
        variant === 'ghost' && 'shadow-none',
        variant === 'secondary' && 'shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </AntdButton>
  );
}
