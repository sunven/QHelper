import { RefreshCw, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CopyButton } from '@/components/tool/CopyButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToolState } from '@/hooks/useToolState'

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'il1Lo0O',
  ambiguous: '{}[]()/\\\'"`~,;.<>',
}

const SIMILAR_CHARS = new Set(CHAR_SETS.similar)
const AMBIGUOUS_CHARS = new Set(CHAR_SETS.ambiguous)

type PasswordOptions = {
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeSimilar: boolean
  excludeAmbiguous: boolean
}

function excludeChars(charset: string, excluded: ReadonlySet<string>): string {
  let result = ''

  for (const char of charset) {
    if (!excluded.has(char)) {
      result += char
    }
  }

  return result
}

function getPasswordCharsetGroups(options: PasswordOptions): string[] {
  const groups: string[] = []

  if (options.uppercase) groups.push(CHAR_SETS.uppercase)
  if (options.lowercase) groups.push(CHAR_SETS.lowercase)
  if (options.numbers) groups.push(CHAR_SETS.numbers)
  if (options.symbols) groups.push(CHAR_SETS.symbols)

  return groups
    .map((group) => {
      let charset = group

      if (options.excludeSimilar) {
        charset = excludeChars(charset, SIMILAR_CHARS)
      }

      if (options.excludeAmbiguous) {
        charset = excludeChars(charset, AMBIGUOUS_CHARS)
      }

      return charset
    })
    .filter(Boolean)
}

function randomIndex(maxExclusive: number): number {
  if (maxExclusive <= 1) {
    return 0
  }

  const buffer = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive
  let value = 0

  do {
    crypto.getRandomValues(buffer)
    value = buffer[0]
  } while (value >= limit)

  return value % maxExclusive
}

function shuffleChars(chars: string[]): string[] {
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]]
  }

  return chars
}

export function generatePasswordValue(
  options: PasswordOptions,
  length: number,
): string {
  const targetLength = Number.isFinite(length)
    ? Math.max(1, Math.trunc(length))
    : 16
  const selectedGroups = getPasswordCharsetGroups(options)
  const groups =
    selectedGroups.length > 0 ? selectedGroups : [CHAR_SETS.lowercase]
  const chars: string[] = []

  for (const group of groups.slice(0, targetLength)) {
    chars.push(group[randomIndex(group.length)])
  }

  const charset = groups.join('')
  while (chars.length < targetLength) {
    chars.push(charset[randomIndex(charset.length)])
  }

  return shuffleChars(chars).join('')
}

export function PasswordGenerator() {
  // 使用持久化状态保存用户配置
  const [length, setLength] = useToolState('password', 'length', 16)
  const [password, setPassword] = useState('')
  const [options, setOptions] = useToolState<PasswordOptions>(
    'password',
    'options',
    {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: false,
      excludeAmbiguous: false,
    },
  )

  // 计算密码强度
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '', icon: Shield }

    let score = 0

    // 长度得分
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1

    // 字符类型得分
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1

    if (score <= 2)
      return { level: 1, label: '弱', color: 'text-red-500', icon: ShieldAlert }
    if (score <= 4)
      return { level: 2, label: '中等', color: 'text-yellow-500', icon: Shield }
    return { level: 3, label: '强', color: 'text-green-500', icon: ShieldCheck }
  }, [password])

  // 生成密码
  const generatePassword = useCallback(() => {
    setPassword(generatePasswordValue(options, length))
  }, [length, options])

  useEffect(() => {
    generatePassword()
  }, [generatePassword])

  return (
    <div className="mx-auto grid max-w-[1200px] gap-2 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* 密码显示 */}
      <Card className="lg:col-span-2">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-sm">生成的密码</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Input
                value={password}
                readOnly
                className="font-mono text-base"
                placeholder="点击生成按钮创建密码"
              />
              <Button
                onClick={generatePassword}
                variant="outline"
                size="icon"
                aria-label="重新生成密码"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <CopyButton
                content={password}
                variant="outline"
                size="icon"
                label=""
              />
            </div>

            {/* 密码强度指示 */}
            {password && (
              <div className="flex items-center gap-2">
                <strength.icon className={`h-4 w-4 ${strength.color}`} />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-xs font-medium ${strength.color}`}>
                      {strength.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {password.length} 位
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-none bg-slate-200/80 dark:bg-slate-700">
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
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-sm">配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 长度滑块 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>密码长度</Label>
              <span className="rounded-none bg-muted px-2 py-0.5 font-mono text-xs">
                {length}
              </span>
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
          <div className="space-y-2">
            <Label>字符类型</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="uppercase"
                  checked={options.uppercase}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      uppercase: checked === true,
                    }))
                  }
                />
                <Label htmlFor="uppercase" className="cursor-pointer font-mono">
                  大写字母 (A-Z)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="lowercase"
                  checked={options.lowercase}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      lowercase: checked === true,
                    }))
                  }
                />
                <Label htmlFor="lowercase" className="cursor-pointer font-mono">
                  小写字母 (a-z)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="numbers"
                  checked={options.numbers}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      numbers: checked === true,
                    }))
                  }
                />
                <Label htmlFor="numbers" className="cursor-pointer font-mono">
                  数字 (0-9)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="symbols"
                  checked={options.symbols}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      symbols: checked === true,
                    }))
                  }
                />
                <Label htmlFor="symbols" className="cursor-pointer font-mono">
                  特殊符号 (!@#$%)
                </Label>
              </div>
            </div>
          </div>

          {/* 排除选项 */}
          <div className="space-y-2">
            <Label>排除字符</Label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="excludeSimilar"
                  checked={options.excludeSimilar}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      excludeSimilar: checked === true,
                    }))
                  }
                />
                <Label htmlFor="excludeSimilar" className="cursor-pointer">
                  排除相似字符 (i, l, 1, L, o, 0, O)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="excludeAmbiguous"
                  checked={options.excludeAmbiguous}
                  onCheckedChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      excludeAmbiguous: checked === true,
                    }))
                  }
                />
                <Label htmlFor="excludeAmbiguous" className="cursor-pointer">
                  排除易混淆字符 (&#123; &#125; &#91; &#93; &#40; &#41; / \ ' "
                  ~ , ; . &lt; &gt;)
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
  )
}
