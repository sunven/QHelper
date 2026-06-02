import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Hash, KeyRound, Loader2, XCircle } from 'lucide-react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { CopyButton } from '@/components/tool/CopyButton'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useToolState } from '@/hooks/useToolState'
import {
  DEFAULT_BCRYPT_ROUNDS,
  MAX_BCRYPT_ROUNDS,
  MIN_BCRYPT_ROUNDS,
  createBcryptHash,
  getBcryptHashRounds,
  isBcryptHash,
  normalizeBcryptRounds,
  verifyBcryptHash,
} from '@/lib/utils/bcrypt'

type VerifyStatus = 'idle' | 'match' | 'mismatch' | 'invalid'

function getRoundsHint(rounds: number) {
  if (rounds <= 8) {
    return '快速校验，适合临时测试'
  }

  if (rounds <= 12) {
    return '推荐区间，速度和强度较均衡'
  }

  return '更慢，浏览器中可能需要等待'
}

export function BcryptHashTool() {
  const [plainText, setPlainText] = useState('')
  const [hashValue, setHashValue] = useState('')
  const [verifyText, setVerifyText] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [isHashing, setIsHashing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [hashError, setHashError] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [rounds, setRounds] = useToolState(
    'bcrypt-hash',
    'rounds',
    DEFAULT_BCRYPT_ROUNDS,
  )

  const normalizedRounds = normalizeBcryptRounds(rounds)
  const verifyHashRounds = getBcryptHashRounds(verifyHash)

  async function handleHash() {
    if (!plainText) {
      setHashError('请输入需要加密的明文')
      return
    }

    setIsHashing(true)
    setHashError('')

    try {
      const nextHash = await createBcryptHash(plainText, normalizedRounds)
      setHashValue(nextHash)
      setVerifyHash(nextHash)
      setVerifyText(plainText)
      setVerifyStatus('idle')
    } catch {
      setHashError('生成失败，请稍后重试')
    } finally {
      setIsHashing(false)
    }
  }

  async function handleVerify() {
    setVerifyStatus('idle')

    if (!verifyText || !verifyHash) {
      setVerifyStatus('invalid')
      return
    }

    if (!isBcryptHash(verifyHash)) {
      setVerifyStatus('invalid')
      return
    }

    setIsVerifying(true)

    try {
      const matched = await verifyBcryptHash(verifyText, verifyHash)
      setVerifyStatus(matched ? 'match' : 'mismatch')
    } catch {
      setVerifyStatus('invalid')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <ToolPageShell toolId="bcrypt-hash">
      <div className="mx-auto grid max-w-[1280px] gap-2 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4" />
                生成 Bcrypt Hash
              </CardTitle>
              {hashValue && (
                <CopyButton content={hashValue} label="复制 Hash" size="sm" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bcrypt-plain-text">明文</Label>
              <Textarea
                id="bcrypt-plain-text"
                value={plainText}
                onChange={(event) => setPlainText(event.target.value)}
                placeholder="输入需要生成 Bcrypt Hash 的字符串"
                className="min-h-36 resize-y font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="bcrypt-rounds">Salt rounds</Label>
                <span className="rounded-none bg-muted px-2 py-0.5 font-mono text-xs">
                  {normalizedRounds}
                </span>
              </div>
              <Slider
                id="bcrypt-rounds"
                value={[normalizedRounds]}
                min={MIN_BCRYPT_ROUNDS}
                max={MAX_BCRYPT_ROUNDS}
                step={1}
                onValueChange={([value]) => setRounds(value)}
              />
              <p className="text-xs text-muted-foreground">
                {getRoundsHint(normalizedRounds)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleHash}
                disabled={isHashing || !plainText}
                className="gap-2"
              >
                {isHashing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                生成 Hash
              </Button>
              {hashError && (
                <span className="text-xs text-destructive">{hashError}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bcrypt-result">结果</Label>
              <Textarea
                id="bcrypt-result"
                value={hashValue}
                readOnly
                placeholder="生成后的 Bcrypt Hash 会显示在这里"
                className="min-h-24 resize-y bg-muted/50 font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-2">
          <Card>
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                校验 Hash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bcrypt-verify-text">待校验明文</Label>
                <Input
                  id="bcrypt-verify-text"
                  value={verifyText}
                  onChange={(event) => {
                    setVerifyText(event.target.value)
                    setVerifyStatus('idle')
                  }}
                  placeholder="输入原始字符串"
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bcrypt-verify-hash">Bcrypt Hash</Label>
                <Textarea
                  id="bcrypt-verify-hash"
                  value={verifyHash}
                  onChange={(event) => {
                    setVerifyHash(event.target.value)
                    setVerifyStatus('idle')
                  }}
                  placeholder="$2b$10$..."
                  className="min-h-24 resize-y font-mono text-xs"
                />
                {verifyHash && verifyHashRounds && (
                  <p className="text-xs text-muted-foreground">
                    Hash rounds: {verifyHashRounds}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleVerify}
                disabled={isVerifying || !verifyText || !verifyHash}
                className="w-full gap-2"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                校验
              </Button>

              {verifyStatus === 'match' && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>明文与 Hash 匹配</AlertDescription>
                </Alert>
              )}

              {verifyStatus === 'mismatch' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>明文与 Hash 不匹配</AlertDescription>
                </Alert>
              )}

              {verifyStatus === 'invalid' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    请填写明文和有效的 Bcrypt Hash
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">说明：</p>
              <ul className="list-inside list-disc space-y-1">
                <li>明文只保存在当前页面状态，不写入扩展存储</li>
                <li>每次生成都会使用新的 salt，相同明文会得到不同 Hash</li>
                <li>Bcrypt 最多只使用密码前 72 字节，长文本请先评估用途</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolName="Bcrypt Hash">
      <BcryptHashTool />
    </ToolErrorBoundary>
  )
}
