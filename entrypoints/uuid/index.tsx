import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>(['']);
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [withoutHyphens, setWithoutHyphens] = useState(false);

  /**
   * 生成 UUID v4
   */
  function generateUUID(): string {
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

    uuid = uuid.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    if (withoutHyphens) {
      uuid = uuid.replace(/-/g, '');
    }

    return uppercase ? uuid.toUpperCase() : uuid;
  }

  /**
   * 生成指定数量的 UUID
   */
  function handleGenerate() {
    const newUuids = Array.from({ length: count }, () => generateUUID());
    setUuids(newUuids);
  }

  /**
   * 复制单个 UUID
   */
  async function handleCopy(uuid: string) {
    await navigator.clipboard.writeText(uuid);
  }

  /**
   * 复制所有 UUID
   */
  async function handleCopyAll() {
    const text = uuids.join('\n');
    await navigator.clipboard.writeText(text);
  }

  /**
   * 清空
   */
  function handleClear() {
    setUuids(['']);
    setCount(1);
  }

  return (
    <ToolPageShell toolId="uuid">
      <div className="mx-auto grid max-w-[1200px] gap-2 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-2">
          {/* 配置区域 */}
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-sm">配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div className="grid gap-2">
                <Label htmlFor="count">生成数量</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="uppercase"
                    checked={uppercase}
                    onCheckedChange={(checked) => setUppercase(checked === true)}
                  />
                  <Label htmlFor="uppercase" className="cursor-pointer">
                    大写
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="no-hyphens"
                    checked={withoutHyphens}
                    onCheckedChange={(checked) => setWithoutHyphens(checked === true)}
                  />
                  <Label htmlFor="no-hyphens" className="cursor-pointer">
                    无连字符
                  </Label>
                </div>
              </div>

              <div className="flex gap-1.5">
                <Button onClick={handleGenerate} className="gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  生成
                </Button>
                <Button variant="outline" onClick={handleClear} className="gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 说明 */}
          <Card>
            <CardContent className="py-2">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>UUID v4</strong> 基于随机数生成：
                </p>
                <span className="block rounded-md bg-muted px-2 py-1 font-mono text-[11px]">
                  xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
                </span>
                <p>4xxx 表示版本，y 表示变体。</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 结果区域 */}
        <Card className="min-h-[calc(100vh-11rem)] overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">生成结果 ({uuids.filter((u) => u).length})</CardTitle>
              {uuids.some((u) => u) && (
                <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
                  <Copy className="w-4 h-4" />
                  复制全部
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1.5">
              {uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 rounded-md border border-border/70 bg-muted/50 px-2.5 py-1.5"
                >
                  <code className="flex-1 font-mono text-sm">{uuid || '点击生成按钮创建 UUID'}</code>
                  {uuid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(uuid)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
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
    <ToolErrorBoundary toolId="uuid" toolName="UUID 生成器">
      <UUIDGenerator />
    </ToolErrorBoundary>,
  );
}
