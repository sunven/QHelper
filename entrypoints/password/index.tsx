import { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Copy, RefreshCw, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToolState } from '@/hooks/useToolState';
import { CopyButton } from '@/components/tool/CopyButton';
import '../../index.css';

function PasswordGenerator() {
  // 使用持久化状态保存用户配置
  const [length, setLength] = useToolState('password', 'length', 16);
  const [password, setPassword] = useState('');
  const [options, setOptions] = useToolState('password', 'options', {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });

  // 字符集定义
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similar: 'il1Lo0O',
    ambiguous: '{}[]()/\\\'"`~,;.<>',
  };

  // 计算密码强度
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '', icon: Shield };

    let score = 0;

    // 长度得分
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // 字符类型得分
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) return { level: 1, label: '弱', color: 'text-red-500', icon: ShieldAlert };
    if (score <= 4) return { level: 2, label: '中等', color: 'text-yellow-500', icon: Shield };
    return { level: 3, label: '强', color: 'text-green-500', icon: ShieldCheck };
  }, [password]);

  // 生成密码
  useEffect(() => {
    generatePassword();
  }, [length, options]);

  function generatePassword() {
    let charset = '';

    if (options.uppercase) charset += CHAR_SETS.uppercase;
    if (options.lowercase) charset += CHAR_SETS.lowercase;
    if (options.numbers) charset += CHAR_SETS.numbers;
    if (options.symbols) charset += CHAR_SETS.symbols;

    if (options.excludeSimilar) {
      for (const char of CHAR_SETS.similar) {
        charset = charset.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    if (options.excludeAmbiguous) {
      for (const char of CHAR_SETS.ambiguous) {
        charset = charset.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    if (charset.length === 0) {
      charset = CHAR_SETS.lowercase;
    }

    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }

    setPassword(result);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">密码生成器</h1>
          <p className="text-sm text-muted-foreground">生成安全的随机密码</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 密码显示 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">生成的密码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={password}
                  readOnly
                  className="font-mono text-lg"
                  placeholder="点击生成按钮创建密码"
                />
                <Button onClick={generatePassword} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <CopyButton content={password} variant="outline" size="icon" label="" />
              </div>

              {/* 密码强度指示 */}
              {password && (
                <div className="flex items-center gap-3">
                  <strength.icon className={`w-5 h-5 ${strength.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${strength.color}`}>{strength.label}</span>
                      <span className="text-xs text-muted-foreground">{password.length} 位</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          strength.level === 1
                            ? 'bg-red-500 w-1/3'
                            : strength.level === 2
                              ? 'bg-yellow-500 w-2/3'
                              : 'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 配置选项 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 长度滑块 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>密码长度</Label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{length}</span>
              </div>
              <Slider
                value={[length]}
                onValueChange={([value]) => setLength(value)}
                min={4}
                max={64}
                step={1}
                className="w-full"
              />
            </div>

            {/* 字符类型选项 */}
            <div className="space-y-3">
              <Label>字符类型</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="uppercase"
                    checked={options.uppercase}
                    onCheckedChange={(checked) => setOptions({ ...options, uppercase: checked === true })}
                  />
                  <Label htmlFor="uppercase" className="cursor-pointer font-mono">
                    大写字母 (A-Z)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="lowercase"
                    checked={options.lowercase}
                    onCheckedChange={(checked) => setOptions({ ...options, lowercase: checked === true })}
                  />
                  <Label htmlFor="lowercase" className="cursor-pointer font-mono">
                    小写字母 (a-z)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="numbers"
                    checked={options.numbers}
                    onCheckedChange={(checked) => setOptions({ ...options, numbers: checked === true })}
                  />
                  <Label htmlFor="numbers" className="cursor-pointer font-mono">
                    数字 (0-9)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="symbols"
                    checked={options.symbols}
                    onCheckedChange={(checked) => setOptions({ ...options, symbols: checked === true })}
                  />
                  <Label htmlFor="symbols" className="cursor-pointer font-mono">
                    特殊符号 (!@#$%)
                  </Label>
                </div>
              </div>
            </div>

            {/* 排除选项 */}
            <div className="space-y-3">
              <Label>排除字符</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="excludeSimilar"
                    checked={options.excludeSimilar}
                    onCheckedChange={(checked) => setOptions({ ...options, excludeSimilar: checked === true })}
                  />
                  <Label htmlFor="excludeSimilar" className="cursor-pointer">
                    排除相似字符 (i, l, 1, L, o, 0, O)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="excludeAmbiguous"
                    checked={options.excludeAmbiguous}
                    onCheckedChange={(checked) => setOptions({ ...options, excludeAmbiguous: checked === true })}
                  />
                  <Label htmlFor="excludeAmbiguous" className="cursor-pointer">
                    排除易混淆字符 (&123; &125; &91; &93; &40; &41; / \ ' " ~ , ; . &lt; &gt;)
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全提示 */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">安全提示：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>使用至少 12 位的密码</li>
                <li>包含大小写字母、数字和特殊符号</li>
                <li>为每个账户使用不同的密码</li>
                <li>使用密码管理器存储密码</li>
                <li>定期更换重要账户的密码</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="password" toolName="密码生成器">
      <PasswordGenerator />
    </ToolErrorBoundary>,
  );
}
