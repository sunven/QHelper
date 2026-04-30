import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

function URLParser() {
  const [input, setInput] = useState('');

  const parsed = useMemo(() => {
    try {
      const url = new URL(input);
      return {
        valid: true,
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        origin: url.origin,
        href: url.href,
        username: url.username,
        password: url.password,
        params: Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value })),
      };
    } catch {
      return { valid: false };
    }
  }, [input]);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <ToolPageShell toolId="urlparser">
      <div className="mx-auto grid max-w-[1320px] gap-2 lg:grid-cols-[minmax(360px,0.72fr)_minmax(520px,1.28fr)]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">输入 URL</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入 URL，例如：https://example.com:8080/path/to/page?query=value#section"
              className="min-h-[calc(100vh-12rem)] font-mono text-sm lg:min-h-[min(62vh,620px)]"
            />
          </CardContent>
        </Card>

        {parsed.valid && (
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">解析结果</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">协议 (Protocol)</label>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                    <code className="text-sm">{parsed.protocol}</code>
                    <Button variant="ghost" size="sm" onClick={() => parsed.protocol && handleCopy(parsed.protocol)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">主机名 (Hostname)</label>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                    <code className="text-sm">{parsed.hostname}</code>
                    <Button variant="ghost" size="sm" onClick={() => parsed.hostname && handleCopy(parsed.hostname)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {parsed.port && (
                  <div>
                    <label className="text-xs text-muted-foreground">端口 (Port)</label>
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                      <code className="text-sm">{parsed.port}</code>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(parsed.port)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground">来源 (Origin)</label>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                    <code className="text-sm">{parsed.origin}</code>
                    <Button variant="ghost" size="sm" onClick={() => parsed.origin && handleCopy(parsed.origin)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">路径 (Pathname)</label>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                  <code className="text-sm">{parsed.pathname || '/'}</code>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(parsed.pathname || '/')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {parsed.params && parsed.params.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">查询参数 (Query Params)</label>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    {parsed.params.map((param, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/55 px-2 py-1"
                      >
                        <code className="min-w-0 flex-1 truncate text-sm">
                          <span className="text-blue-600 dark:text-blue-400">{param.key}</span>
                          <span className="text-gray-500">=</span>
                          <span className="text-green-600 dark:text-green-400">{param.value}</span>
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(`${param.key}=${param.value}`)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.hash && (
                <div>
                  <label className="text-xs text-muted-foreground">哈希 (Hash)</label>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                    <code className="text-sm">{parsed.hash}</code>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(parsed.hash)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground">完整 URL (Href)</label>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-muted/45 px-2 py-1">
                  <code className="break-all text-sm">{parsed.href}</code>
                  <Button variant="ghost" size="sm" onClick={() => parsed.href && handleCopy(parsed.href)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
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
    <ToolErrorBoundary toolId="urlparser" toolName="URL 解析器">
      <URLParser />
    </ToolErrorBoundary>,
  );
}
