import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, ArrowRight } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

function ColorTransformTool() {
  const [srcRgb, setSrcRgb] = useState(['', '', '']);
  const [desHex, setDesHex] = useState('');
  const [srcHex, setSrcHex] = useState('');
  const [desRgbR, setDesRgbR] = useState('');
  const [desRgbG, setDesRgbG] = useState('');
  const [desRgbB, setDesRgbB] = useState('');
  const [color, setColor] = useState('#000000');

  function rgbToHex() {
    const [r, g, b] = srcRgb;
    const hexR = parseInt(r || '0').toString(16).padStart(2, '0');
    const hexG = parseInt(g || '0').toString(16).padStart(2, '0');
    const hexB = parseInt(b || '0').toString(16).padStart(2, '0');
    const hex = `#${hexR}${hexG}${hexB}`;
    setDesHex(hex);
    setColor(hex);
  }

  function hexToRgb() {
    if (!srcHex.startsWith('#')) {
      return;
    }
    const hex = srcHex.slice(1);
    if (hex.length !== 6) {
      return;
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    setDesRgbR(r.toString());
    setDesRgbG(g.toString());
    setDesRgbB(b.toString());
    setColor(srcHex);
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setColor(value);
    setSrcHex(value);
    hexToRgb();
  }

  return (
    <ToolPageShell toolId="colorTransform">
      <div className="mx-auto grid max-w-[1160px] gap-2 lg:grid-cols-[minmax(260px,0.7fr)_minmax(520px,1.3fr)]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="w-4 h-4" />
              颜色预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-36 flex-1 rounded-lg border border-border/70" style={{ backgroundColor: color }} />
              <input
                type="color"
                value={color}
                onChange={handleColorChange}
                className="h-16 w-16 cursor-pointer rounded-lg border border-border/70 bg-white/75"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="w-4 h-4" />
              RGB → HEX
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="flex gap-2">
              <Input
                type="text"
                value={srcRgb[0]}
                onChange={(e) => setSrcRgb([e.target.value, srcRgb[1], srcRgb[2]])}
                placeholder="R"
                className="w-20"
              />
              <Input
                type="text"
                value={srcRgb[1]}
                onChange={(e) => setSrcRgb([srcRgb[0], e.target.value, srcRgb[2]])}
                placeholder="G"
                className="w-20"
              />
              <Input
                type="text"
                value={srcRgb[2]}
                onChange={(e) => setSrcRgb([srcRgb[0], srcRgb[1], e.target.value])}
                placeholder="B"
                className="w-20"
              />
            </div>
            <Button onClick={rgbToHex}>转换</Button>
            <Input
              type="text"
              value={desHex}
              disabled
              placeholder="#RRGGBB"
              className="flex-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="w-4 h-4" />
              HEX → RGB
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <Input
              type="text"
              value={srcHex}
              onChange={(e) => setSrcHex(e.target.value)}
              placeholder="#RRGGBB"
              className="w-32"
            />
            <Button onClick={hexToRgb}>转换</Button>
            <Input value={desRgbR} disabled placeholder="R" className="w-20" />
            <Input value={desRgbG} disabled placeholder="G" className="w-20" />
            <Input value={desRgbB} disabled placeholder="B" className="w-20" />
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
    <ToolErrorBoundary toolId="colorTransform" toolName="颜色转换">
      <ColorTransformTool />
    </ToolErrorBoundary>,
  );
}
