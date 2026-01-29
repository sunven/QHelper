import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Link2 } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
          <Link2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">URL 解析器</h1>
          <p className="text-sm text-muted-foreground">解析 URL 各个组成部分</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入 URL</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入 URL，例如：https://example.com:8080/path/to/page?query=value#section"
              className="font-mono text-sm"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* 解析结果 */}
        {parsed.valid && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">解析结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">协议 (Protocol)</label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm">{parsed.protocol}</code>
                    <Button variant="ghost" size="sm" onClick={() => parsed.protocol && handleCopy(parsed.protocol)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">主机名 (Hostname)</label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm">{parsed.hostname}</code>
                    <Button variant="ghost" size="sm" onClick={() => parsed.hostname && handleCopy(parsed.hostname)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {parsed.port && (
                  <div>
                    <label className="text-xs text-muted-foreground">端口 (Port)</label>
                    <div className="flex items-center justify-between mt-1">
                      <code className="text-sm">{parsed.port}</code>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(parsed.port)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground">来源 (Origin)</label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm">{parsed.origin}</code>
                    <Button variant="ghost" size="sm" onClick={() => parsed.origin && handleCopy(parsed.origin)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 路径 */}
              <div>
                <label className="text-xs text-muted-foreground">路径 (Pathname)</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm">{parsed.pathname || '/'}</code>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(parsed.pathname || '/')}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 查询参数 */}
              {parsed.params && parsed.params.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">查询参数 (Query Params)</label>
                  <div className="mt-2 space-y-2">
                    {parsed.params.map((param, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <code className="flex-1 text-sm">
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

              {/* 哈希 */}
              {parsed.hash && (
                <div>
                  <label className="text-xs text-muted-foreground">哈希 (Hash)</label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm">{parsed.hash}</code>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(parsed.hash)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* 完整 URL */}
              <div>
                <label className="text-xs text-muted-foreground">完整 URL (Href)</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm break-all">{parsed.href}</code>
                  <Button variant="ghost" size="sm" onClick={() => parsed.href && handleCopy(parsed.href)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<URLParser />);
}
