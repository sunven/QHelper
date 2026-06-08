import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToolState } from '@/hooks/useToolState'
import { copyToClipboard, formatFileSize } from '@/lib/utils'
import {
  AlertCircle,
  Camera,
  Copy,
  Download,
  FileImage,
  LoaderCircle,
  QrCode,
  RotateCcw,
  ScanQrCode,
  Upload,
  VideoOff,
} from 'lucide-react'
import type { Html5Qrcode as Html5QrcodeInstance } from 'html5-qrcode'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

type QrCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

const QR_LEVELS: Array<{ value: QrCorrectionLevel; label: string }> = [
  { value: 'L', label: 'L · 低' },
  { value: 'M', label: 'M · 中' },
  { value: 'Q', label: 'Q · 较高' },
  { value: 'H', label: 'H · 高' },
]

const DEFAULT_QR_TEXT = 'https://github.com/sunven/QHelper'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function QrCodeTool() {
  const [qrText, setQrText] = useToolState('qrcode', 'text', DEFAULT_QR_TEXT)
  const [size, setSize] = useToolState('qrcode', 'size', 280)
  const [level, setLevel] = useToolState<QrCorrectionLevel>(
    'qrcode',
    'level',
    'M',
  )
  const [foreground, setForeground] = useToolState(
    'qrcode',
    'foreground',
    '#111827',
  )
  const [background, setBackground] = useToolState(
    'qrcode',
    'background',
    '#ffffff',
  )
  const [marginSize, setMarginSize] = useToolState('qrcode', 'marginSize', 4)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [decodedText, setDecodedText] = useState('')
  const [decodeStatus, setDecodeStatus] = useState('')
  const [decodeError, setDecodeError] = useState('')
  const [isScanningFile, setIsScanningFile] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cameraScannerRef = useRef<Html5QrcodeInstance | null>(null)
  const reactId = useId()
  const safeId = useMemo(() => reactId.replace(/[^a-zA-Z0-9_-]/g, ''), [reactId])
  const fileReaderId = `qhelper-qrcode-file-reader-${safeId}`
  const cameraReaderId = `qhelper-qrcode-camera-reader-${safeId}`
  const hasQrText = qrText.length > 0

  const stopCamera = useCallback(async () => {
    const scanner = cameraScannerRef.current
    cameraScannerRef.current = null
    setIsStartingCamera(false)
    setIsCameraActive(false)

    if (!scanner) {
      return
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
    } catch {
      // The scanner can already be stopped when a decode callback races cleanup.
    }

    try {
      scanner.clear()
    } catch {
      // clear() is best-effort because html5-qrcode may already have emptied it.
    }
  }, [])

  useEffect(() => {
    return () => {
      void stopCamera()
    }
  }, [stopCamera])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const selectFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setDecodeError('请选择图片文件')
      return
    }

    setSelectedFile(file)
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return URL.createObjectURL(file)
    })
    setDecodedText('')
    setDecodeStatus('')
    setDecodeError('')
  }, [])

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      selectFile(file)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files[0]

    if (file) {
      selectFile(file)
    }
  }

  async function scanImageFile() {
    if (!selectedFile || isScanningFile) {
      return
    }

    setIsScanningFile(true)
    setDecodeError('')
    setDecodeStatus('正在识别图片')

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        'html5-qrcode'
      )
      const scanner = new Html5Qrcode(fileReaderId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })

      try {
        const result = await scanner.scanFile(selectedFile, false)
        setDecodedText(result)
        setDecodeStatus('图片识别完成')
      } finally {
        scanner.clear()
      }
    } catch (error) {
      setDecodeError(getErrorMessage(error, '未识别到二维码'))
      setDecodeStatus('')
    } finally {
      setIsScanningFile(false)
    }
  }

  async function startCamera() {
    if (isStartingCamera || isCameraActive) {
      return
    }

    setIsStartingCamera(true)
    setDecodeError('')
    setDecodeStatus('正在启动摄像头')

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        'html5-qrcode'
      )
      const scanner = new Html5Qrcode(cameraReaderId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })

      cameraScannerRef.current = scanner
      setIsCameraActive(true)

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          disableFlip: false,
        },
        (result) => {
          setDecodedText(result)
          setDecodeStatus('摄像头识别完成')
          void stopCamera()
        },
        () => undefined,
      )

      if (cameraScannerRef.current === scanner) {
        setDecodeStatus('摄像头扫描中')
      }
    } catch (error) {
      setDecodeError(getErrorMessage(error, '无法启动摄像头'))
      setDecodeStatus('')
      await stopCamera()
    } finally {
      setIsStartingCamera(false)
    }
  }

  function resetScan() {
    void stopCamera()
    setSelectedFile(null)
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return ''
    })
    setDecodedText('')
    setDecodeStatus('')
    setDecodeError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function copyGeneratedText() {
    if (qrText) {
      await copyToClipboard(qrText)
    }
  }

  async function copyDecodedText() {
    if (decodedText) {
      await copyToClipboard(decodedText)
    }
  }

  function downloadSvg() {
    const svg = svgRef.current

    if (!svg) {
      return
    }

    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const source = new XMLSerializer().serializeToString(clone)
    downloadBlob(
      new Blob([source], { type: 'image/svg+xml;charset=utf-8' }),
      'qrcode.svg',
    )
  }

  return (
    <ToolPageShell toolId="qrcode">
      <div className="mx-auto grid max-w-[1320px] gap-2 xl:grid-cols-[minmax(320px,0.95fr)_minmax(300px,0.7fr)_minmax(420px,1.15fr)]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" />
              生成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="qrcode-input">内容</Label>
              <Textarea
                id="qrcode-input"
                className="h-[min(32vh,260px)] font-mono text-xs"
                onChange={(event) => setQrText(event.target.value)}
                placeholder="输入文本或 URL"
                value={qrText}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="qrcode-size">尺寸</Label>
                <Input
                  id="qrcode-size"
                  max={512}
                  min={128}
                  onChange={(event) => setSize(Number(event.target.value))}
                  type="number"
                  value={size}
                />
              </div>
              <div className="space-y-1.5">
                <Label>纠错</Label>
                <Select
                  onValueChange={(value) =>
                    setLevel(value as QrCorrectionLevel)
                  }
                  value={level}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QR_LEVELS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qrcode-foreground">前景</Label>
                <Input
                  id="qrcode-foreground"
                  onChange={(event) => setForeground(event.target.value)}
                  type="color"
                  value={foreground}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qrcode-background">背景</Label>
                <Input
                  id="qrcode-background"
                  onChange={(event) => setBackground(event.target.value)}
                  type="color"
                  value={background}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qrcode-margin">留白</Label>
                <Input
                  id="qrcode-margin"
                  max={8}
                  min={0}
                  onChange={(event) =>
                    setMarginSize(Number(event.target.value))
                  }
                  type="number"
                  value={marginSize}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={!hasQrText} onClick={copyGeneratedText} size="sm">
                <Copy className="mr-2 h-4 w-4" />
                复制内容
              </Button>
              <Button
                disabled={!hasQrText}
                onClick={downloadSvg}
                size="sm"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                下载 SVG
              </Button>
              <Button
                onClick={() => setQrText(DEFAULT_QR_TEXT)}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" />
              预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[min(54vh,520px)] items-center justify-center overflow-hidden border border-border bg-muted/20 p-4">
              {hasQrText ? (
                <QRCodeSVG
                  ref={svgRef}
                  bgColor={background}
                  className="h-auto max-h-[min(48vh,460px)] max-w-full"
                  fgColor={foreground}
                  level={level}
                  marginSize={marginSize}
                  size={Math.max(128, Math.min(512, size || 280))}
                  title="QHelper QR Code"
                  value={qrText}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <QrCode className="h-8 w-8" />
                  <span className="text-sm">等待输入</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanQrCode className="h-4 w-4" />
              识别
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="flex min-h-[150px] items-center justify-center overflow-hidden border-2 border-dashed border-border bg-muted/20"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <img
                  alt="二维码预览"
                  className="max-h-[220px] w-full object-contain"
                  src={previewUrl}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                  <FileImage className="h-7 w-7" />
                  <span className="text-sm">拖拽或选择图片</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
              type="file"
            />
            <div className="hidden" id={fileReaderId} />

            {selectedFile && (
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">文件</span>
                <span className="truncate font-medium">{selectedFile.name}</span>
                <span className="text-muted-foreground">大小</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileInputRef.current?.click()} size="sm">
                <Upload className="mr-2 h-4 w-4" />
                选择图片
              </Button>
              <Button
                disabled={!selectedFile || isScanningFile}
                onClick={scanImageFile}
                size="sm"
                variant="outline"
              >
                {isScanningFile ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ScanQrCode className="mr-2 h-4 w-4" />
                )}
                识别图片
              </Button>
              <Button
                disabled={isStartingCamera || isCameraActive}
                onClick={startCamera}
                size="sm"
                variant="outline"
              >
                {isStartingCamera ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                摄像头
              </Button>
              <Button
                disabled={!isCameraActive && !isStartingCamera}
                onClick={() => void stopCamera()}
                size="sm"
                variant="outline"
              >
                <VideoOff className="mr-2 h-4 w-4" />
                停止
              </Button>
              <Button onClick={resetScan} size="sm" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                清空
              </Button>
            </div>

            <div
              className="flex min-h-[190px] items-center justify-center overflow-hidden border border-border bg-muted/20 text-muted-foreground [&_video]:max-h-[260px] [&_video]:w-full"
              id={cameraReaderId}
            >
              {!isCameraActive && !isStartingCamera ? (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-7 w-7" />
                  <span className="text-sm">摄像头未启动</span>
                </div>
              ) : null}
            </div>

            {decodeStatus && (
              <div className="text-xs text-muted-foreground">{decodeStatus}</div>
            )}

            {decodeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>识别失败</AlertTitle>
                <AlertDescription>{decodeError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Textarea
                className="h-[min(24vh,180px)] font-mono text-xs"
                onChange={(event) => setDecodedText(event.target.value)}
                placeholder="识别结果"
                value={decodedText}
              />
              <div className="flex justify-end">
                <Button disabled={!decodedText} onClick={copyDecodedText} size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  复制结果
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolId="qrcode" toolName="二维码">
      <QrCodeTool />
    </ToolErrorBoundary>
  )
}
