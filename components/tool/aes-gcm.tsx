import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  UnlockKeyhole,
} from 'lucide-react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { CopyButton } from '@/components/tool/CopyButton'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_AES_GCM_ITERATIONS,
  decryptAesGcmText,
  encryptAesGcmText,
} from '@/lib/utils/aes-gcm'

type Status = 'idle' | 'success' | 'error'

export function AesGcmTool() {
  const [plainText, setPlainText] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [payload, setPayload] = useState('')
  const [decryptPayload, setDecryptPayload] = useState('')
  const [decryptPassphrase, setDecryptPassphrase] = useState('')
  const [decryptedText, setDecryptedText] = useState('')
  const [encryptStatus, setEncryptStatus] = useState<Status>('idle')
  const [decryptStatus, setDecryptStatus] = useState<Status>('idle')
  const [encryptError, setEncryptError] = useState('')
  const [decryptError, setDecryptError] = useState('')
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  async function handleEncrypt() {
    setEncryptStatus('idle')
    setEncryptError('')

    if (!passphrase) {
      setEncryptStatus('error')
      setEncryptError('请输入口令')
      return
    }

    setIsEncrypting(true)

    try {
      const nextPayload = await encryptAesGcmText(plainText, passphrase)
      setPayload(nextPayload)
      setDecryptPayload(nextPayload)
      setEncryptStatus('success')
    } catch {
      setEncryptStatus('error')
      setEncryptError('加密失败，请稍后重试')
    } finally {
      setIsEncrypting(false)
    }
  }

  async function handleDecrypt() {
    setDecryptStatus('idle')
    setDecryptError('')
    setDecryptedText('')

    if (!decryptPayload || !decryptPassphrase) {
      setDecryptStatus('error')
      setDecryptError('请填写 Payload 和口令')
      return
    }

    setIsDecrypting(true)

    try {
      const nextPlainText = await decryptAesGcmText(
        decryptPayload,
        decryptPassphrase,
      )
      setDecryptedText(nextPlainText)
      setDecryptStatus('success')
    } catch {
      setDecryptStatus('error')
      setDecryptError('解密失败，请检查 Payload 或口令')
    } finally {
      setIsDecrypting(false)
    }
  }

  return (
    <ToolPageShell toolId="aes-gcm">
      <div className="mx-auto grid max-w-[1280px] gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LockKeyhole className="h-4 w-4" />
                加密文本
              </CardTitle>
              {payload && (
                <CopyButton content={payload} label="复制 Payload" size="sm" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="aes-gcm-plain-text">明文</Label>
              <Textarea
                id="aes-gcm-plain-text"
                value={plainText}
                onChange={(event) => {
                  setPlainText(event.target.value)
                  setEncryptStatus('idle')
                }}
                placeholder="输入要加密的文本"
                className="min-h-36 resize-y font-mono text-sm"
                spellCheck={false}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aes-gcm-passphrase">口令</Label>
              <Input
                id="aes-gcm-passphrase"
                type="password"
                value={passphrase}
                onChange={(event) => {
                  setPassphrase(event.target.value)
                  setEncryptStatus('idle')
                }}
                placeholder="用于派生 AES 密钥"
                autoComplete="off"
                className="font-mono"
              />
            </div>

            <Button
              type="button"
              onClick={handleEncrypt}
              disabled={isEncrypting || !passphrase}
              className="gap-2"
            >
              {isEncrypting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              加密
            </Button>

            {encryptStatus === 'success' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>加密完成</AlertDescription>
              </Alert>
            )}

            {encryptStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{encryptError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="aes-gcm-payload">Payload JSON</Label>
              <Textarea
                id="aes-gcm-payload"
                value={payload}
                readOnly
                placeholder="加密结果会显示在这里"
                className="min-h-32 resize-y bg-muted/50 font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/70">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UnlockKeyhole className="h-4 w-4" />
                解密 Payload
              </CardTitle>
              {decryptedText && (
                <CopyButton content={decryptedText} label="复制明文" size="sm" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="aes-gcm-decrypt-payload">Payload JSON</Label>
              <Textarea
                id="aes-gcm-decrypt-payload"
                value={decryptPayload}
                onChange={(event) => {
                  setDecryptPayload(event.target.value)
                  setDecryptStatus('idle')
                }}
                placeholder='{"v":1,"alg":"AES-GCM",...}'
                className="min-h-36 resize-y font-mono text-xs"
                spellCheck={false}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aes-gcm-decrypt-passphrase">口令</Label>
              <Input
                id="aes-gcm-decrypt-passphrase"
                type="password"
                value={decryptPassphrase}
                onChange={(event) => {
                  setDecryptPassphrase(event.target.value)
                  setDecryptStatus('idle')
                }}
                placeholder="输入加密时使用的口令"
                autoComplete="off"
                className="font-mono"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDecrypt}
              disabled={isDecrypting || !decryptPayload || !decryptPassphrase}
              className="gap-2"
            >
              {isDecrypting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UnlockKeyhole className="h-4 w-4" />
              )}
              解密
            </Button>

            {decryptStatus === 'success' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>解密完成</AlertDescription>
              </Alert>
            )}

            {decryptStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{decryptError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="aes-gcm-decrypted-text">明文结果</Label>
              <Textarea
                id="aes-gcm-decrypted-text"
                value={decryptedText}
                readOnly
                placeholder="解密后的明文会显示在这里"
                className="min-h-32 resize-y bg-muted/50 font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="font-medium text-foreground">参数</p>
              <p>AES-256-GCM</p>
              <p>PBKDF2-SHA-256</p>
              <p>{DEFAULT_AES_GCM_ITERATIONS.toLocaleString()} iterations</p>
              <p>16 byte salt / 12 byte IV</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">注意</p>
              <p>口令和明文只保存在当前页面状态。</p>
              <p>同一明文每次加密都会生成不同 Payload。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolId="aes-gcm" toolName="AES-GCM 加解密">
      <AesGcmTool />
    </ToolErrorBoundary>
  )
}
