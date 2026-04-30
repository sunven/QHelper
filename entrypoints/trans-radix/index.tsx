import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

const RADIX_OPTIONS = [
  { value: 2, label: '2进制' },
  { value: 8, label: '8进制' },
  { value: 10, label: '10进制' },
  { value: 16, label: '16进制' },
];

function TransRadixTool() {
  const [radixRadio1, setRadixRadio1] = useState(10);
  const [radixSelect1, setRadixSelect1] = useState<number | undefined>(undefined);
  const [value1, setValue1] = useState('');
  const [radixRadio2, setRadixRadio2] = useState(10);
  const [radixSelect2, setRadixSelect2] = useState<number | undefined>(undefined);
  const [value2, setValue2] = useState('');

  const currentRadix1 = radixSelect1 ?? radixRadio1;
  const currentRadix2 = radixSelect2 ?? radixRadio2;

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
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {RADIX_OPTIONS.map((r) => (
                <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value={r.value}
                    checked={radixRadio1 === r.value}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRadixRadio1(r.value);
                        setRadixSelect1(undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={radixSelect1 ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setRadixSelect1(val ? Number(val) : undefined);
                  if (val) setRadixRadio1(-1);
                }}
                className="h-9 w-24 rounded-md border border-input bg-white/75 px-2 text-sm dark:bg-slate-900/58"
              >
                <option value="">自定义</option>
                {Array.from({ length: 35 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}进制
                  </option>
                ))}
              </select>

              <Input
                type="text"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder={`输入${currentRadix1}进制数`}
              />
            </div>
          </div>

          <div className="flex justify-center gap-2 pb-0.5 lg:flex-col">
            <Button onClick={convertValue1To2} size="icon" className="rounded-full">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={convertValue2To1} size="icon" className="rounded-full" variant="secondary">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {RADIX_OPTIONS.map((r) => (
                <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value={r.value}
                    checked={radixRadio2 === r.value}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRadixRadio2(r.value);
                        setRadixSelect2(undefined);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={radixSelect2 ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setRadixSelect2(val ? Number(val) : undefined);
                  if (val) setRadixRadio2(-1);
                }}
                className="h-9 w-24 rounded-md border border-input bg-white/75 px-2 text-sm dark:bg-slate-900/58"
              >
                <option value="">自定义</option>
                {Array.from({ length: 35 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}进制
                  </option>
                ))}
              </select>

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

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="trans-radix" toolName="进制转换">
      <TransRadixTool />
    </ToolErrorBoundary>,
  );
}
