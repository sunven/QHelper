import { Radio as AntdRadio } from 'antd';
import type { RadioGroupProps as AntdRadioGroupProps } from 'antd';
import { cn } from '@/lib/utils';

const Radio = AntdRadio;

function RadioGroup({ className, ...props }: AntdRadioGroupProps) {
  return <AntdRadio.Group className={cn(className)} {...props} />;
}

export { Radio, RadioGroup };
