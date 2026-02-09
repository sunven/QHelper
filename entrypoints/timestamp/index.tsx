import { useState, useEffect } from 'react';
import { useToolState } from '@/hooks/useToolState';
import ReactDOM from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { ToolNavigation } from '@/components/ToolNavigation';
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
    <>
      <ToolNavigation />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-center mb-2">时间戳转换</h1>
        <p className="text-sm text-center text-muted-foreground mb-6">
          源自：
          <a href="https://github.com/zxlie/FeHelper" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            https://github.com/zxlie/FeHelper
          </a>
        </p>

        <div className="space-y-6">
          {/* 当前时间 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                当前时间
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">当地时间</label>
                <Input value={nowDate} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unix 时间戳</label>
                <Input value={now} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Unix时间戳 → 当地时间 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="w-4 h-4" />
                Unix 时间戳 → 当地时间
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">时间戳</label>
                <Input
                  value={srcStamp}
                  onChange={(e) => setSrcStamp(e.target.value)}
                  placeholder="例如：1507722100"
                />
              </div>
              <Button onClick={stampToDate} variant="default">
                转换
              </Button>
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">结果</label>
                <Input value={desDate} disabled placeholder="转换结果" />
              </div>
            </CardContent>
          </Card>

          {/* 当地时间 → Unix时间戳 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowLeft className="w-4 h-4" />
                当地时间 → Unix 时间戳
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">时间</label>
                <Input
                  value={srcLocale}
                  onChange={(e) => setSrcLocale(e.target.value)}
                  placeholder="例如：2017-10-11 19:42:00"
                />
              </div>
              <Button onClick={dateToStamp} variant="default">
                转换
              </Button>
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium">结果</label>
                <Input value={desStamp} disabled placeholder="转换结果" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
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
