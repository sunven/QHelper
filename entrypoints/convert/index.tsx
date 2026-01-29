import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Code, Lock, Key, FileCode } from 'lucide-react';
import { md5 } from '@/lib/utils/md5';
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
  const [srcText, setSrcText] = useState('');
  const [result, setResult] = useState('');

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
        htmlEscape();
        break;
      case 'uniEncode':
        uniEncode();
        break;
      case 'utf8Encode':
        utf8Encode();
        break;
      case 'base64Encode':
        base64Encode();
        break;
      case 'md5Encode':
        md5Encode();
        break;
      case 'html2js':
        html2js();
        break;
    }
  }

  function handleDecode(type: EncodeType) {
    switch (type) {
      case 'htmlUnescape':
        htmlUnescape();
        break;
      case 'uniDecode':
        uniDecode();
        break;
      case 'utf8Decode':
        utf8Decode();
        break;
      case 'base64Decode':
        base64Decode();
        break;
    }
  }

  const encodeButtons = encodeItems.filter((item) => item.direction === 'encode');
  const decodeButtons = encodeItems.filter((item) => item.direction === 'decode');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-2">字符串编解码</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        源自：
        <a
          href="https://www.baidufe.com/fehelper/endecode.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          https://www.baidufe.com/fehelper/endecode.html
        </a>
      </p>

      <div className="space-y-6">
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={srcText}
              onChange={(e) => setSrcText(e.target.value)}
              placeholder="粘贴需要进行编解码的字符串"
              className="h-32 font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* 编码按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="w-4 h-4" />
              编码
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {encodeButtons.map((item) => (
                <Button
                  key={item.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleEncode(item.type)}
                  className="gap-1.5"
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 解码按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeft className="w-4 h-4" />
              解码
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {decodeButtons.map((item) => (
                <Button
                  key={item.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecode(item.type)}
                  className="gap-1.5"
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 结果区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">结果</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={result}
              readOnly
              placeholder="结果将显示在这里"
              className="h-32 font-mono text-sm bg-muted/50"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<ConvertTool />);
}
