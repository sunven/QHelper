import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileJson, FileText, Copy, Upload, Download } from 'lucide-react';
import '../../index.css';

function CSVToJSON() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [prettyPrint, setPrettyPrint] = useState(true);

  const result = useMemo(() => {
    if (!input.trim()) return { json: null, count: 0 };

    try {
      const lines = input.trim().split('\n').filter((line) => line.trim());
      if (lines.length === 0) return { json: null, count: 0 };

      // 解析 CSV
      const parseCSVRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          const nextChar = row[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);

        return result;
      };

      const rows = lines.map(parseCSVRow);
      const maxCols = Math.max(...rows.map((r) => r.length));

      // 填充不足的列
      rows.forEach((row) => {
        while (row.length < maxCols) {
          row.push('');
        }
      });

      let json: unknown;

      if (hasHeader && rows.length > 1) {
        const headers = rows[0];
        const data = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        json = data;
      } else {
        json = rows;
      }

      const jsonString = prettyPrint
        ? JSON.stringify(json, null, 2)
        : JSON.stringify(json);

      return { json: jsonString, count: Array.isArray(json) ? json.length : 1 };
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败');
      return { json: null, count: 0 };
    }
  }, [input, hasHeader, prettyPrint]);

  // 当结果改变时更新输出
  useMemo(() => {
    if (result.json) {
      setOutput(result.json);
      setError('');
    }
  }, [result]);

  function handleConvert() {
    // result 会自动更新
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
  }

  function handleClear() {
    setInput('');
    setOutput('');
    setError('');
  }

  function handleSample() {
    const sample = `name,age,city
张三,25,北京
李四,30,上海
王五,28,广州`;
    setInput(sample);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <FileJson className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">CSV 转 JSON</h1>
          <p className="text-sm text-muted-foreground">将 CSV 格式转换为 JSON 格式</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：CSV 输入 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV 输入
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
                placeholder="请输入 CSV 格式数据..."
                className="font-mono text-sm min-h-[400px]"
              />
            </CardContent>
          </Card>

          {/* 选项 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">选项</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasHeader"
                  checked={hasHeader}
                  onCheckedChange={(checked) => setHasHeader(checked === true)}
                />
                <Label htmlFor="hasHeader" className="cursor-pointer">
                  第一行作为标题 (Header)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="prettyPrint"
                  checked={prettyPrint}
                  onCheckedChange={(checked) => setPrettyPrint(checked === true)}
                />
                <Label htmlFor="prettyPrint" className="cursor-pointer">
                  美化输出 (Pretty Print)
                </Label>
              </div>

              <Button onClick={handleConvert} className="w-full">
                转换
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：JSON 输出 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                JSON 输出 {result.count > 0 && `(${result.count} 条记录)`}
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
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            ) : (
              <Textarea
                value={output}
                readOnly
                placeholder="JSON 结果将显示在这里..."
                className="font-mono text-sm min-h-[400px] bg-muted/50"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">使用说明：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>支持逗号分隔的 CSV 格式</li>
              <li>支持双引号包裹的字段</li>
              <li>可以自动识别第一行作为字段名</li>
              <li>支持转换为对象数组或二维数组</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="csv2json" toolName="CSV 转 JSON">
      <CSVToJSON />
    </ToolErrorBoundary>,
  );
}
