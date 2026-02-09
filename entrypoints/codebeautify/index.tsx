import '../../index.css';
import * as beautify from 'js-beautify';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { useState } from 'react';
import { copyToClipboard } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Copy, FileCode, FileJson, FileType, Database } from 'lucide-react';
import { ToolNavigation } from '@/components/ToolNavigation';

type CodeType = 'js' | 'css' | 'html' | 'xml' | 'sql';

const codeTypes: { type: CodeType; label: string; icon: React.ReactNode }[] = [
  { type: 'js', label: 'JavaScript', icon: <FileJson className="w-4 h-4" /> },
  { type: 'css', label: 'CSS', icon: <FileType className="w-4 h-4" /> },
  { type: 'html', label: 'HTML', icon: <FileCode className="w-4 h-4" /> },
  { type: 'xml', label: 'XML', icon: <FileCode className="w-4 h-4" /> },
  { type: 'sql', label: 'SQL', icon: <Database className="w-4 h-4" /> },
];

function CodeBeautifyTool() {
  const [source, setSource] = useState('');
  const [result, setResult] = useState('');
  const [codeType, setCodeType] = useState<CodeType>('js');

  function doBeautify() {
    if (!source.trim()) {
      setResult('');
      return;
    }

    try {
      let beautified: string;

      switch (codeType) {
        case 'js':
          beautified = beautify.js(source, { indent_size: 2, space_in_empty: true });
          break;
        case 'css':
          beautified = beautify.css(source, { indent_size: 2 });
          break;
        case 'html':
          beautified = beautify.html(source, { indent_size: 2 });
          break;
        case 'xml':
          beautified = beautify.xml(source, { indent_size: 2 });
          break;
        case 'sql':
          beautified = beautify.sql(source, { indent_size: 2 });
          break;
      }

      setResult(beautified);
    } catch (e) {
      setResult(`美化失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleCopy() {
    copyToClipboard(result).then(() => {
      alert('已复制到剪贴板');
    });
  }

  return (


    <>


      <ToolNavigation />
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-2">代码美化</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        源自：
        <a
          href="https://www.baidufe.com/fehelper/codebeautify.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          https://www.baidufe.com/fehelper/codebeautify.html
        </a>
      </p>

      <div className="space-y-6">
        {/* 源代码 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">源代码</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="在这里粘贴需要进行美化的代码"
              className="h-48 font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="w-4 h-4" />
              选择代码类型并美化
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {codeTypes.map((item) => (
                <Button
                  key={item.type}
                  variant={codeType === item.type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCodeType(item.type)}
                  className="gap-1.5"
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
            <Button onClick={doBeautify} className="w-full sm:w-auto">
              美化代码
            </Button>
          </CardContent>
        </Card>

        {/* 结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">美化结果</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={result}
              readOnly
              placeholder="美化结果将显示在这里"
              className="h-48 font-mono text-sm bg-muted/50"
            />
            {result && (
              <Button onClick={handleCopy} className="mt-3" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                复制结果
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  


    </>);
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="codebeautify" toolName="代码美化">
      <CodeBeautifyTool />
    </ToolErrorBoundary>,
  );
}
