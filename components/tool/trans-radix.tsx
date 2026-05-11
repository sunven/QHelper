import { useState } from 'react';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';

const RADIX_OPTIONS = [
  { value: '2', label: '2进制' },
  { value: '8', label: '8进制' },
  { value: '10', label: '10进制' },
  { value: '16', label: '16进制' },
];

export function TransRadixTool() {
  const [radixRadio1, setRadixRadio1] = useState(10);
  const [radixSelect1, setRadixSelect1] = useState<number | undefined>(undefined);
  const [value1, setValue1] = useState('');
  const [radixRadio2, setRadixRadio2] = useState(10);
  const [radixSelect2, setRadixSelect2] = useState<number | undefined>(undefined);
  const [value2, setValue2] = useState('');

  const currentRadix1 = radixSelect1 ?? radixRadio1;
  const currentRadix2 = radixSelect2 ?? radixRadio2;
  const selectOptions = Array.from({ length: 35 }, (_, i) => {
    const value = i + 1;
    return { value, label: `${value}进制` };
  });

  function convertValue1To2() {
    if (!value1) {
      setValue2('');
      return;
    }
    try {
      const num = parseInt(value1, currentRadix1);
      if (Number.isNaN(num)) {
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
      if (Number.isNaN(num)) {
        setValue1('无效输入');
        return;
      }
      setValue1(num.toString(currentRadix1));
    } catch {
      setValue1('转换失败');
    }
  }

  return (
    <ToolPageShell toolId="trans-radix">
      <div className="mx-auto w-full max-w-[920px]">
        <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">进制转换</CardTitle>
        </CardHeader>
        <CardContent className="grid items-end gap-2 pt-2 lg:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <RadioGroup
              value={String(radixRadio1)}
              onValueChange={(value) => {
                setRadixRadio1(Number(value));
                setRadixSelect1(undefined);
              }}
              className="flex flex-wrap gap-2"
            >
              {RADIX_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-1.5">
                  <RadioGroupItem id={`source-radix-${option.value}`} value={option.value} />
                  <Label htmlFor={`source-radix-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-2">
              <Select
                value={radixSelect1 ? String(radixSelect1) : undefined}
                onValueChange={(value) => {
                  setRadixSelect1(Number(value));
                  setRadixRadio1(-1);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="自定义" />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder={`输入${currentRadix1}进制数`}
              />
            </div>
          </div>

          <div className="flex justify-center gap-2 pb-0.5 lg:flex-col">
            <Button onClick={convertValue1To2} size="icon" className="rounded-none">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={convertValue2To1} size="icon" className="rounded-none" variant="secondary">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <RadioGroup
              value={String(radixRadio2)}
              onValueChange={(value) => {
                setRadixRadio2(Number(value));
                setRadixSelect2(undefined);
              }}
              className="flex flex-wrap gap-2"
            >
              {RADIX_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-1.5">
                  <RadioGroupItem id={`target-radix-${option.value}`} value={option.value} />
                  <Label htmlFor={`target-radix-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-2">
              <Select
                value={radixSelect2 ? String(radixSelect2) : undefined}
                onValueChange={(value) => {
                  setRadixSelect2(Number(value));
                  setRadixRadio2(-1);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="自定义" />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                value={value2}
                readOnly
                placeholder={`结果${currentRadix2}进制数`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </ToolPageShell>
  );
}

export function App() {
  return <ToolErrorBoundary toolId="trans-radix" toolName="进制转换"><TransRadixTool /></ToolErrorBoundary>;
}
