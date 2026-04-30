import '../../index.css';
import * as beautify from 'js-beautify';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { useState } from 'react';
import { copyToClipboard } from '../../lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Copy, FileCode, FileJson, FileType, Database } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';

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
    <ToolPageShell toolId="codebeautify">
      <div className="mx-auto max-w-[1440px] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-white/72 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm dark:bg-slate-900/55">
          <span>
            源自：
          {' '}
            <a
              href="https://www.baidufe.com/fehelper/codebeautify.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              https://www.baidufe.com/fehelper/codebeautify.html
            </a>
          </span>
          <div className="flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            <span>选择代码类型并美化</span>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-2 pt-3 lg:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-1.5">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">源代码</div>
              <Textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="在这里粘贴需要进行美化的代码"
                className="h-[min(62vh,620px)] font-mono text-sm"
              />
            </div>

            <div className="flex flex-col gap-2 lg:w-40">
              <div className="flex flex-wrap gap-1.5 lg:flex-col">
                {codeTypes.map((item) => (
                  <Button
                    key={item.type}
                    variant={codeType === item.type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCodeType(item.type)}
                    className="justify-start gap-1.5"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                ))}
              </div>
              <Button onClick={doBeautify} className="lg:w-full">
                美化代码
              </Button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">美化结果</div>
                {result && (
                  <Button onClick={handleCopy} variant="outline" size="sm">
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    复制
                  </Button>
                )}
              </div>
              <Textarea
                value={result}
                readOnly
                placeholder="美化结果将显示在这里"
                className="h-[min(62vh,620px)] bg-muted/50 font-mono text-sm"
              />
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
    <ToolErrorBoundary toolId="codebeautify" toolName="代码美化">
      <CodeBeautifyTool />
    </ToolErrorBoundary>,
  );
}
