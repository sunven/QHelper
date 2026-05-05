import { useState, useEffect } from 'react';
import { useToolState } from '@/hooks/useToolState';
import ReactDOM from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

function TimestampTool() {
  const [nowDate, setNowDate] = useState('');
  const [now, setNow] = useState('');
  const [srcStamp, setSrcStamp] = useToolState('timestamp', 'srcStamp', '');
  const [desDate, setDesDate] = useState('');
  const [srcLocale, setSrcLocale] = useToolState('timestamp', 'srcLocale', '');
  const [desStamp, setDesStamp] = useState('');

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  function updateTime() {
    const now = new Date();
    setNowDate(formatDate(now));
    setNow(Math.floor(now.getTime() / 1000).toString());
  }

  function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }

  function stampToDate() {
    const stamp = parseInt(srcStamp);
    if (isNaN(stamp)) {
      setDesDate('');
      return;
    }
    const date = new Date(stamp * 1000);
    setDesDate(formatDate(date));
  }

  function dateToStamp() {
    const match = srcLocale.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!match) {
      setDesStamp('');
      return;
    }
    const [, y, m, d, h, min, s] = match;
    const date = new Date(
      parseInt(y),
      parseInt(m) - 1,
      parseInt(d),
      parseInt(h),
      parseInt(min),
      parseInt(s),
    );
    setDesStamp(Math.floor(date.getTime() / 1000).toString());
  }

  return (
    <ToolPageShell toolId="timestamp">
      <div className="mx-auto max-w-[1200px] space-y-2">
          {/* 当前时间 */}
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4" />
                当前时间
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">当地时间</label>
                <Input value={nowDate} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Unix 时间戳</label>
                <Input value={now} disabled />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-2 lg:grid-cols-2">
          {/* Unix时间戳 → 当地时间 */}
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <ArrowRight className="w-4 h-4" />
                Unix 时间戳 → 当地时间
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-end gap-2">
              <div className="w-full space-y-1">
                <label className="text-xs font-medium">时间戳</label>
                <Input
                  value={srcStamp}
                  onChange={(e) => setSrcStamp(e.target.value)}
                  placeholder="例如：1507722100"
                />
              </div>
              <Button onClick={stampToDate} variant="default">
                转换
              </Button>
              <div className="w-full space-y-1">
                <label className="text-xs font-medium">结果</label>
                <Input value={desDate} disabled placeholder="转换结果" />
              </div>
            </CardContent>
          </Card>

          {/* 当地时间 → Unix时间戳 */}
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <ArrowLeft className="w-4 h-4" />
                当地时间 → Unix 时间戳
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-end gap-2">
              <div className="w-full space-y-1">
                <label className="text-xs font-medium">时间</label>
                <Input
                  value={srcLocale}
                  onChange={(e) => setSrcLocale(e.target.value)}
                  placeholder="例如：2017-10-11 19:42:00"
                />
              </div>
              <Button onClick={dateToStamp} variant="default">
                转换
              </Button>
              <div className="w-full space-y-1">
                <label className="text-xs font-medium">结果</label>
                <Input value={desStamp} disabled placeholder="转换结果" />
              </div>
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
    <ToolErrorBoundary toolId="timestamp" toolName="时间戳转换">
      <TimestampTool />
    </ToolErrorBoundary>,
  );
}
