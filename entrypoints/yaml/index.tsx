import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import * as yaml from 'js-yaml';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileCode, FileJson, ArrowRightLeft } from 'lucide-react';
import '../../index.css';

function YAMLConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'yaml2json' | 'json2yaml'>('yaml2json');

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' };

    try {
      if (mode === 'yaml2json') {
        // YAML 转 JSON
        const parsed = yaml.load(input);
        const jsonString = JSON.stringify(parsed, null, 2);
        return { output: jsonString, error: '' };
      } else {
        // JSON 转 YAML
        const parsed = JSON.parse(input);
        const yamlString = yaml.dump(parsed, { indent: 2, lineWidth: -1 });
        return { output: yamlString, error: '' };
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '转换失败';
      return { output: '', error: errorMsg };
    }
  }, [input, mode]);

  useMemo(() => {
    setOutput(result.output);
    setError(result.error);
  }, [result]);

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setError('');
  }

  function handleSample() {
    if (mode === 'yaml2json') {
      const sample = `name: 张三
age: 25
city: 北京
hobbies:
  - 编程
  - 阅读
  - 运动
address:
  street: 朝阳区
  zipCode: 100000`;
      setInput(sample);
    } else {
      const sample = `{
  "name": "张三",
  "age": 25,
  "city": "北京",
  "hobbies": ["编程", "阅读", "运动"],
  "address": {
    "street": "朝阳区",
    "zipCode": 100000
  }
}`;
      setInput(sample);
    }
  }

  function switchMode() {
    setMode(mode === 'yaml2json' ? 'json2yaml' : 'yaml2json');
    setInput('');
    setOutput('');
    setError('');
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <FileCode className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">YAML 转换器</h1>
          <p className="text-sm text-muted-foreground">YAML 与 JSON 格式互转</p>
        </div>
        <span className="ml-auto px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
          Beta
        </span>
      </div>

      <div className="space-y-6">
        {/* 模式切换 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">转换模式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={mode === 'yaml2json' ? 'default' : 'outline'}
                onClick={() => {
                  if (mode !== 'yaml2json') {
                    setMode('yaml2json');
                    setInput('');
                    setOutput('');
                    setError('');
                  }
                }}
                className="flex-1"
              >
                <FileCode className="w-4 h-4 mr-2" />
                YAML → JSON
              </Button>
              <Button variant="outline" size="icon" onClick={switchMode}>
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={mode === 'json2yaml' ? 'default' : 'outline'}
                onClick={() => {
                  if (mode !== 'json2yaml') {
                    setMode('json2yaml');
                    setInput('');
                    setOutput('');
                    setError('');
                  }
                }}
                className="flex-1"
              >
                <FileJson className="w-4 h-4 mr-2" />
                JSON → YAML
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* 输入区域 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {mode === 'yaml2json' ? 'YAML 输入' : 'JSON 输入'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSample}>
                    示例
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    清空
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'yaml2json' ? '请输入 YAML 格式...' : '请输入 JSON 格式...'}
                className="font-mono text-sm min-h-[400px]"
              />
            </CardContent>
          </Card>

          {/* 输出区域 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {mode === 'yaml2json' ? 'JSON 输出' : 'YAML 输出'}
                </CardTitle>
                {output && (
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md min-h-[400px]">
                  {error}
                </div>
              ) : (
                <Textarea
                  value={output}
                  readOnly
                  placeholder="转换结果将显示在这里..."
                  className="font-mono text-sm min-h-[400px] bg-muted/50"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">YAML 特性：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>使用缩进表示层级关系（推荐使用 2 空格）</li>
                <li>支持注释（使用 # 开头）</li>
                <li>支持多行字符串（使用 | 或 &gt;）</li>
                <li>支持锚点(&)和别名(*)引用</li>
                <li>注意：YAML 中 Tab 字符不被允许作为缩进</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="yaml" toolName="YAML 转换器">
      <YAMLConverter />
    </ToolErrorBoundary>,
  );
}
