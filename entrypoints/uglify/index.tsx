import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import uglify from 'uglify-js';
import { copyToClipboard } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Copy, Play } from 'lucide-react';
import '../../index.css';

function UglifyTool() {
  const [source, setSource] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mangle, setMangle] = useState(true);
  const [compress, setCompress] = useState(true);

  function doUglify() {
    if (!source.trim()) {
      setError('请输入代码');
      return;
    }

    try {
      const result = uglify(source, {
        compress: {
          drop_console: false,
          drop_debugger: false,
        },
        mangle: mangle
          ? {
              reserved: ['require', 'exports', 'module'],
            }
          : false,
        output: {
          beautify: !compress,
          comments: !compress,
        },
      });

      if (result.error) {
        setError(result.error.message);
        setOutput('');
      } else {
        setError('');
        setOutput(result.code);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setOutput('');
    }
  }

  function handleCopy() {
    copyToClipboard(output).then(() => {
      alert('已复制到剪贴板');
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-2">JavaScript 压缩</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        使用 UglifyJS 压缩 JavaScript 代码
      </p>

      <div className="space-y-6">
        {/* 选项区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4" />
              选项
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={mangle}
                onCheckedChange={(checked) => setMangle(checked === true)}
              />
              <span className="text-sm">Mangle（变量名缩短）</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={compress}
                onCheckedChange={(checked) => setCompress(checked === true)}
              />
              <span className="text-sm">Compress（去除空格和注释）</span>
            </label>

            <Button onClick={doUglify} className="ml-auto">
              <Play className="w-4 h-4 mr-2" />
              执行压缩
            </Button>
          </CardContent>
        </Card>

        {/* 代码区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 源代码 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">源代码</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="在这里粘贴需要进行压缩的 JavaScript 代码"
                className="h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* 结果代码 */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">压缩结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}
              <Textarea
                value={output}
                readOnly
                placeholder="压缩结果将显示在这里"
                className="h-[340px] font-mono text-sm bg-muted/50"
              />
              {output && (
                <Button onClick={handleCopy} variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  复制结果
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="uglify" toolName="JavaScript 压缩">
      <UglifyTool />
    </ToolErrorBoundary>,
  );
}
