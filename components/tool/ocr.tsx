import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Copy,
  Download,
  FileImage,
  Languages,
  LoaderCircle,
  RotateCcw,
  ScanText,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type Tesseract from 'tesseract.js'

type OcrLanguage = {
  code: string
  label: string
}

const OCR_LANGUAGES: OcrLanguage[] = [
  { code: 'eng', label: 'English' },
  { code: 'chi_sim', label: '简体中文' },
  { code: 'chi_tra', label: '繁體中文' },
  { code: 'jpn', label: '日本語' },
  { code: 'kor', label: '한국어' },
]

const OCR_ASSET_BASE = 'libs/tesseract'

function getExtensionAssetUrl(path: string) {
  const runtime = globalThis.chrome?.runtime

  if (runtime?.getURL) {
    return runtime.getURL(path)
  }

  return `/${path}`
}

function getTesseractWorkerOptions(
  onProgress: (message: Tesseract.LoggerMessage) => void,
): Partial<Tesseract.WorkerOptions> {
  const assetBase = getExtensionAssetUrl(OCR_ASSET_BASE)

  return {
    workerPath: `${assetBase}/worker.min.js`,
    corePath: assetBase,
    workerBlobURL: false,
    logger: onProgress,
  }
}

function downloadTextFile(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function OcrTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [language, setLanguage] = useToolState('ocr', 'language', 'eng')
  const [result, setResult] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [statusText, setStatusText] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Tesseract.Worker | null>(null)
  const workerLanguageRef = useRef('')
  const jobIdRef = useRef(0)

  const clearWorker = useCallback(async () => {
    const worker = workerRef.current
    workerRef.current = null
    workerLanguageRef.current = ''

    if (worker) {
      await worker.terminate()
    }
  }, [])

  useEffect(() => {
    return () => {
      void clearWorker()
    }
  }, [clearWorker])

  const selectFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    setSelectedFile(file)
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return URL.createObjectURL(file)
    })
    setResult('')
    setConfidence(null)
    setError('')
    setStatusText('')
    setProgress(0)
  }, [])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith('image/'),
      )
      const file = imageItem?.getAsFile()

      if (file) {
        selectFile(file)
      }
    }

    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [selectFile])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function getWorker(jobId: number) {
    if (workerRef.current && workerLanguageRef.current === language) {
      return workerRef.current
    }

    await clearWorker()
    setStatusText('正在加载 OCR 引擎')
    setProgress(0)

    const { createWorker, PSM } = await import('tesseract.js')
    const worker = await createWorker(
      language,
      undefined,
      getTesseractWorkerOptions((message) => {
        if (jobIdRef.current !== jobId) {
          return
        }

        setStatusText(message.status)
        setProgress(Math.round(message.progress * 100))
      }),
    )

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
    })

    workerRef.current = worker
    workerLanguageRef.current = language
    return worker
  }

  async function recognizeImage() {
    if (!selectedFile || isProcessing) {
      return
    }

    const jobId = jobIdRef.current + 1
    jobIdRef.current = jobId
    setIsProcessing(true)
    setError('')
    setResult('')
    setConfidence(null)
    setProgress(0)
    setStatusText('准备识别')

    try {
      const worker = await getWorker(jobId)
      const { data } = await worker.recognize(selectedFile)

      if (jobIdRef.current !== jobId) {
        return
      }

      setResult(data.text.trim())
      setConfidence(data.confidence)
      setStatusText('识别完成')
      setProgress(100)
    } catch (err) {
      if (jobIdRef.current === jobId) {
        setError(err instanceof Error ? err.message : 'OCR 识别失败')
        setStatusText('')
      }
    } finally {
      if (jobIdRef.current === jobId) {
        setIsProcessing(false)
      }
    }
  }

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

  function reset() {
    jobIdRef.current += 1
    setSelectedFile(null)
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return ''
    })
    setResult('')
    setConfidence(null)
    setStatusText('')
    setProgress(0)
    setError('')
    setIsProcessing(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function copyResult() {
    if (result) {
      await copyToClipboard(result)
    }
  }

  const progressLabel = isProcessing
    ? `${statusText || '正在识别'} ${progress}%`
    : statusText

  return (
    <ToolPageShell toolId="ocr">
      <div className="mx-auto grid max-w-[1320px] gap-2 xl:grid-cols-[minmax(300px,0.9fr)_minmax(260px,0.55fr)_minmax(420px,1.15fr)]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileImage className="h-4 w-4" />
              图片
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              className="flex min-h-[min(44vh,420px)] items-center justify-center overflow-hidden rounded-none border-2 border-dashed border-border bg-muted/20"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="OCR 预览"
                  className="max-h-[min(54vh,520px)] w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">拖拽、粘贴或选择图片</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => fileInputRef.current?.click()} size="sm">
                <Upload className="mr-2 h-4 w-4" />
                选择图片
              </Button>
              <Button
                disabled={!selectedFile || isProcessing}
                onClick={reset}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                重置
              </Button>
            </div>

            {selectedFile && (
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">文件</span>
                <span className="truncate font-medium">{selectedFile.name}</span>
                <span className="text-muted-foreground">大小</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanText className="h-4 w-4" />
              识别
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Languages className="h-4 w-4" />
                语言
              </label>
              <Select
                disabled={isProcessing}
                value={language}
                onValueChange={setLanguage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCR_LANGUAGES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              disabled={!selectedFile || isProcessing}
              onClick={recognizeImage}
              size="sm"
            >
              {isProcessing ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ScanText className="mr-2 h-4 w-4" />
              )}
              开始识别
            </Button>

            {progressLabel && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressLabel}</span>
                  {confidence !== null && (
                    <span>可信度 {confidence.toFixed(1)}%</span>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-none bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>识别失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              图片内容只在当前浏览器页面中识别。首次使用会加载 OCR 引擎和语言模型，后续会使用浏览器缓存。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanText className="h-4 w-4" />
              识别结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              className="h-[min(56vh,560px)] font-mono text-xs"
              placeholder="OCR 结果将显示在这里"
              readOnly
              value={result}
            />

            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={!result} onClick={copyResult} size="sm">
                <Copy className="mr-2 h-4 w-4" />
                复制
              </Button>
              <Button
                disabled={!result}
                onClick={() => downloadTextFile(result, 'ocr-result.txt')}
                size="sm"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                下载文本
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolId="ocr" toolName="OCR 文字识别">
      <OcrTool />
    </ToolErrorBoundary>
  )
}
