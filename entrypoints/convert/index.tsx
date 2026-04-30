import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Code, Lock, Key, FileCode } from 'lucide-react';
import { md5 } from '@/lib/utils/md5';
import { useToolHistory } from '@/hooks/useToolHistory';
import { useToolState } from '@/hooks/useToolState';
import { CopyButton } from '@/components/tool/CopyButton';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

type EncodeType =
  | 'htmlEscape'
  | 'htmlUnescape'
  | 'uniEncode'
  | 'uniDecode'
  | 'utf8Encode'
  | 'utf8Decode'
  | 'base64Encode'
  | 'base64Decode'
  | 'md5Encode'
  | 'html2js';

interface EncodeItem {
  label: string;
  type: EncodeType;
  icon: React.ReactNode;
  direction: 'encode' | 'decode';
}

const encodeItems: EncodeItem[] = [
  { label: 'HTML转义', type: 'htmlEscape', icon: <Code className="w-4 h-4" />, direction: 'encode' },
  { label: 'HTML反转义', type: 'htmlUnescape', icon: <Code className="w-4 h-4" />, direction: 'decode' },
  { label: 'Unicode编码', type: 'uniEncode', icon: <FileCode className="w-4 h-4" />, direction: 'encode' },
  { label: 'Unicode解码', type: 'uniDecode', icon: <FileCode className="w-4 h-4" />, direction: 'decode' },
  { label: 'URL编码', type: 'utf8Encode', icon: <Lock className="w-4 h-4" />, direction: 'encode' },
  { label: 'URL解码', type: 'utf8Decode', icon: <Lock className="w-4 h-4" />, direction: 'decode' },
  { label: 'Base64编码', type: 'base64Encode', icon: <Key className="w-4 h-4" />, direction: 'encode' },
  { label: 'Base64解码', type: 'base64Decode', icon: <Key className="w-4 h-4" />, direction: 'decode' },
  { label: 'MD5编码', type: 'md5Encode', icon: <Key className="w-4 h-4" />, direction: 'encode' },
  { label: 'HTML转JS', type: 'html2js', icon: <FileCode className="w-4 h-4" />, direction: 'encode' },
];

function ConvertTool() {
  const [srcText, setSrcText] = useToolState('convert', 'srcText', '');
  const [result, setResult] = useState('');

  // 历史记录
  const { history, addHistory, clearHistory } = useToolHistory<string, string>(
    'convert',
    { maxHistory: 50 },
  );

  // 执行编解码并添加历史记录
  function executeEncode(type: EncodeType, encodeFn: () => void) {
    encodeFn();
    if (srcText && result) {
      addHistory(srcText, result, { type });
    }
  }

  function htmlEscape() {
    const div = document.createElement('div');
    div.textContent = srcText;
    setResult(div.innerHTML);
  }

  function htmlUnescape() {
    const div = document.createElement('div');
    div.innerHTML = srcText;
    setResult(div.textContent || '');
  }

  function uniEncode() {
    let str = '';
    for (let i = 0; i < srcText.length; i++) {
      const code = srcText.charCodeAt(i).toString(16);
      str += `\u0000${'0000'.substring(0, 4 - code.length)}${code}`;
    }
    setResult(str);
  }

  function uniDecode() {
    setResult(srcText.replace(/\\u([\d\w]{4})/gi, (_match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    }));
  }

  function utf8Encode() {
    setResult(encodeURIComponent(srcText));
  }

  function utf8Decode() {
    try {
      setResult(decodeURIComponent(srcText));
    } catch {
      setResult('解码失败，请检查输入');
    }
  }

  function base64Encode() {
    try {
      setResult(btoa(encodeURIComponent(srcText).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
        String.fromCharCode(parseInt(`0x${p1}`, 16)),
      )));
    } catch {
      setResult('Base64 编码失败');
    }
  }

  function base64Decode() {
    try {
      setResult(decodeURIComponent(
        atob(srcText)
          .split('')
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      ));
    } catch {
      setResult('Base64 解码失败');
    }
  }

  function md5Encode() {
    try {
      setResult(md5(srcText));
    } catch {
      setResult('MD5 编码失败');
    }
  }

  function html2js() {
    setResult(JSON.stringify(srcText));
  }

  function handleEncode(type: EncodeType) {
    switch (type) {
      case 'htmlEscape':
        executeEncode(type, htmlEscape);
        break;
      case 'uniEncode':
        executeEncode(type, uniEncode);
        break;
      case 'utf8Encode':
        executeEncode(type, utf8Encode);
        break;
      case 'base64Encode':
        executeEncode(type, base64Encode);
        break;
      case 'md5Encode':
        executeEncode(type, md5Encode);
        break;
      case 'html2js':
        executeEncode(type, html2js);
        break;
    }
  }

  function handleDecode(type: EncodeType) {
    switch (type) {
      case 'htmlUnescape':
        executeEncode(type, htmlUnescape);
        break;
      case 'uniDecode':
        executeEncode(type, uniDecode);
        break;
      case 'utf8Decode':
        executeEncode(type, utf8Decode);
        break;
      case 'base64Decode':
        executeEncode(type, base64Decode);
        break;
    }
  }

  // 恢复历史记录
  function restoreHistory(input: string) {
    setSrcText(input);
  }

  const encodeButtons = encodeItems.filter((item) => item.direction === 'encode');
  const decodeButtons = encodeItems.filter((item) => item.direction === 'decode');

  return (
    <ToolPageShell toolId="convert">
      <div className="mx-auto max-w-[1520px] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-white/70 px-2.5 py-1.5 text-xs text-muted-foreground dark:bg-slate-900/55">
          <span>字符串编解码工作台</span>
          <a
            href="https://www.baidufe.com/fehelper/endecode.html"
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-medium text-primary hover:underline"
          >
            来源参考
          </a>
        </div>

        <div className="grid min-h-[calc(100vh-10rem)] gap-2 lg:grid-cols-[minmax(0,1fr)_240px_minmax(0,1fr)]">
          <Card className="min-h-0 overflow-hidden">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-sm">输入</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1">
              <Textarea
                value={srcText}
                onChange={(e) => setSrcText(e.target.value)}
                placeholder="粘贴需要进行编解码的字符串"
                className="min-h-[300px] flex-1 resize-none font-mono text-sm lg:min-h-0"
              />
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-sm">操作</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div>
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5" />
                  编码
                </div>
                <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                  {encodeButtons.map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleEncode(item.type)}
                      className="justify-start gap-1.5"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  解码
                </div>
                <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                  {decodeButtons.map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecode(item.type)}
                      className="justify-start gap-1.5"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-0 overflow-hidden">
            <CardHeader className="border-b border-border/70">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">结果</CardTitle>
                {result && <CopyButton content={result} label="复制结果" size="sm" />}
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1">
              <Textarea
                value={result}
                readOnly
                placeholder="结果将显示在这里"
                className="min-h-[300px] flex-1 resize-none bg-muted/50 font-mono text-sm lg:min-h-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">历史记录</CardTitle>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  清除历史 ({history.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {history.slice(-10).reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="cursor-pointer rounded-md border border-border/70 bg-muted/55 p-2 text-xs transition-colors hover:bg-muted/80"
                    onClick={() => restoreHistory(entry.input)}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        {entry.metadata?.type as string || '未知'}
                      </span>
                    </div>
                    <div className="truncate font-mono">
                      {entry.input.slice(0, 50)}
                      {entry.input.length > 50 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolPageShell>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="convert" toolName="字符串编解码">
      <ConvertTool />
    </ToolErrorBoundary>,
  );
}
