import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { copyToClipboard } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Copy, Play } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

const UGLIFY_REQUEST_TYPE = 'QHELPER_UGLIFY_MINIFY';
const UGLIFY_RESULT_TYPE = 'QHELPER_UGLIFY_RESULT';
const UGLIFY_READY_TYPE = 'QHELPER_UGLIFY_READY';
const SANDBOX_PAGE = 'uglify-worker.html';

interface UglifyOptions {
  compress?:
    | boolean
    | {
        drop_console?: boolean;
        drop_debugger?: boolean;
      };
  mangle?:
    | boolean
    | {
        reserved?: string[];
      };
  output?: {
    beautify?: boolean;
    comments?: boolean;
  };
}

interface UglifyResultMessage {
  type: typeof UGLIFY_RESULT_TYPE;
  requestId: string;
  code?: string;
  error?: string;
}

interface UglifyReadyMessage {
  type: typeof UGLIFY_READY_TYPE;
}

let sandboxFramePromise: Promise<HTMLIFrameElement> | undefined;

function isUglifyResultMessage(value: unknown): value is UglifyResultMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Record<string, unknown>;
  return message.type === UGLIFY_RESULT_TYPE && typeof message.requestId === 'string';
}

function isUglifyReadyMessage(value: unknown): value is UglifyReadyMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (value as Record<string, unknown>).type === UGLIFY_READY_TYPE;
}

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSandboxUrl() {
  if (!chrome?.runtime?.getURL) {
    throw new Error('当前环境不支持扩展沙箱');
  }

  return chrome.runtime.getURL(SANDBOX_PAGE);
}

function getSandboxFrame() {
  if (sandboxFramePromise) {
    return sandboxFramePromise;
  }

  sandboxFramePromise = new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    let settled = false;

    function cleanup() {
      window.clearTimeout(timeoutId);
      iframe.removeEventListener('error', handleError);
      window.removeEventListener('message', handleReadyMessage);
    }

    function handleReadyMessage(event: MessageEvent<unknown>) {
      if (event.source !== iframe.contentWindow || !isUglifyReadyMessage(event.data)) {
        return;
      }

      settled = true;
      cleanup();
      resolve(iframe);
    }

    function handleError() {
      settled = true;
      cleanup();
      iframe.remove();
      sandboxFramePromise = undefined;
      reject(new Error('压缩沙箱加载失败'));
    }

    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }

      cleanup();
      iframe.remove();
      sandboxFramePromise = undefined;
      reject(new Error('压缩沙箱初始化超时，请重启开发服务或重新加载扩展'));
    }, 30000);

    window.addEventListener('message', handleReadyMessage);
    iframe.addEventListener('error', handleError);
    iframe.title = 'uglify sandbox';
    iframe.hidden = true;
    iframe.src = getSandboxUrl();
    document.body.appendChild(iframe);
  });

  return sandboxFramePromise;
}

async function minifyInSandbox(source: string, options: UglifyOptions): Promise<string> {
  const iframe = await getSandboxFrame();
  const targetWindow = iframe.contentWindow;

  if (!targetWindow) {
    sandboxFramePromise = undefined;
    throw new Error('压缩沙箱不可用');
  }

  const requestId = createRequestId();

  return new Promise((resolve, reject) => {
    function cleanup() {
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
    }

    function handleMessage(event: MessageEvent<unknown>) {
      if (event.source !== targetWindow || !isUglifyResultMessage(event.data)) {
        return;
      }

      if (event.data.requestId !== requestId) {
        return;
      }

      cleanup();

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      resolve(event.data.code ?? '');
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('压缩执行超时'));
    }, 30000);

    window.addEventListener('message', handleMessage);
    targetWindow.postMessage(
      {
        type: UGLIFY_REQUEST_TYPE,
        requestId,
        source,
        options,
      },
      '*',
    );
  });
}

function UglifyTool() {
  const [source, setSource] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mangle, setMangle] = useState(true);
  const [compress, setCompress] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  async function doUglify() {
    if (!source.trim()) {
      setError('请输入代码');
      return;
    }

    setIsRunning(true);
    setError('');

    try {
      const code = await minifyInSandbox(source, {
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

      setOutput(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setOutput('');
    } finally {
      setIsRunning(false);
    }
  }

  function handleCopy() {
    copyToClipboard(output).then(() => {
      alert('已复制到剪贴板');
    });
  }

  return (
    <ToolPageShell toolId="uglify" description="通过 UglifyJS 压缩、保留或混淆 JavaScript 输出，适合快速试验压缩策略。">
      <div className="mx-auto max-w-[1440px] space-y-2">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Zap className="h-4 w-4" />
              选项
            </div>
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

            <Button onClick={doUglify} size="sm" className="ml-auto" disabled={isRunning}>
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? '压缩中' : '执行压缩'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Card className="h-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">源代码</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="在这里粘贴需要进行压缩的 JavaScript 代码"
                className="h-[min(62vh,620px)] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">压缩结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {error && (
                <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Textarea
                value={output}
                readOnly
                placeholder="压缩结果将显示在这里"
                className="h-[min(58vh,580px)] bg-muted/50 font-mono text-sm"
              />
              {output && (
                <Button onClick={handleCopy} variant="outline" size="sm" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  复制结果
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolPageShell>
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
