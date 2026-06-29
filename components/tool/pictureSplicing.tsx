import {
  Download,
  Image as ImageIcon,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ImageItem {
  id: string
  src: string
  width: number
  height: number
}

function ImageListItem({
  id,
  src,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}: {
  id: string
  src: string
  isDragging: boolean
  onDragStart: (id: string) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (id: string) => void
  onDragEnd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(id)}
      onDragEnd={onDragEnd}
      className={`relative group cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <img
        src={src}
        alt=""
        className="w-32 h-32 object-cover rounded-none border"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(id)
        }}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  )
}

export function PictureSplicingTool() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null)
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>(
    'horizontal',
  )
  const [gap, setGap] = useState(0)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [canvasUrl, setCanvasUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const newItem: ImageItem = {
          id: Date.now().toString() + Math.random(),
          src: e.target?.result as string,
          width: img.width,
          height: img.height,
        }
        setImages((prev) => [...prev, newItem])
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer?.files
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.type.startsWith('image/')) {
            processFile(file)
          }
        }
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('drop', handleDrop)
    document.addEventListener('dragover', handleDragOver)

    return () => {
      document.removeEventListener('drop', handleDrop)
      document.removeEventListener('dragover', handleDragOver)
    }
  }, [processFile])

  function moveImage(activeId: string, overId: string) {
    if (activeId === overId) return

    setImages((items) => {
      const oldIndex = items.findIndex((item) => item.id === activeId)
      const newIndex = items.findIndex((item) => item.id === overId)
      if (oldIndex === -1 || newIndex === -1) return items

      const next = [...items]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files) {
      for (let i = 0; i < files.length; i++) {
        processFile(files[i])
      }
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  function clearImages() {
    setImages([])
    setCanvasUrl('')
  }

  function generateCanvas() {
    if (images.length === 0) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (direction === 'horizontal') {
      const totalWidth =
        images.reduce((sum, img) => sum + img.width + gap, 0) - gap
      const maxHeight = Math.max(...images.map((img) => img.height))
      canvas.width = totalWidth
      canvas.height = maxHeight

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, totalWidth, maxHeight)

      let loadedCount = 0
      let x = 0
      images.forEach((img) => {
        const imageObj = new Image()
        imageObj.onload = () => {
          ctx.drawImage(imageObj, x, 0)
          loadedCount++
          if (loadedCount === images.length) {
            setCanvasUrl(canvas.toDataURL('image/png'))
          }
        }
        imageObj.src = img.src
        x += img.width + gap
      })
    } else {
      const totalHeight =
        images.reduce((sum, img) => sum + img.height + gap, 0) - gap
      const maxWidth = Math.max(...images.map((img) => img.width))
      canvas.width = maxWidth
      canvas.height = totalHeight

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, maxWidth, totalHeight)

      let loadedCount = 0
      let y = 0
      images.forEach((img) => {
        const imageObj = new Image()
        imageObj.onload = () => {
          ctx.drawImage(imageObj, 0, y)
          loadedCount++
          if (loadedCount === images.length) {
            setCanvasUrl(canvas.toDataURL('image/png'))
          }
        }
        imageObj.src = img.src
        y += img.height + gap
      })
    }
  }

  function downloadCanvas() {
    if (!canvasUrl) return
    const link = document.createElement('a')
    link.href = canvasUrl
    link.download = 'spliced-image.png'
    link.click()
  }

  return (
    <ToolPageShell
      toolId="pictureSplicing"
      description="上传、排序并生成拼接图，适合快速合并截图、海报或长图素材。"
    >
      <div className="mx-auto grid max-w-[1320px] gap-2 lg:grid-cols-[minmax(360px,0.78fr)_minmax(520px,1.22fr)]">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-4 h-4" />
              上传图片
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              选择图片
            </Button>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              支持拖拽或 Ctrl + V 粘贴
            </p>
          </CardContent>

          {images.length > 0 && !canvasUrl && (
            <CardContent className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Settings className="h-4 w-4" />
                拼接设置
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">拼接方向</label>
                  <Select
                    value={direction}
                    onValueChange={(value) =>
                      setDirection(value as 'horizontal' | 'vertical')
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal">水平拼接</SelectItem>
                      <SelectItem value="vertical">垂直拼接</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">图片间距（px）</label>
                  <Input
                    type="number"
                    value={gap}
                    onChange={(e) => setGap(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">背景颜色</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer p-1"
                    />
                    <Input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={generateCanvas} size="sm" className="w-full">
                生成拼接图片
              </Button>
            </CardContent>
          )}
        </Card>

        {images.length > 0 && !canvasUrl && (
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4" />
                图片列表 ({images.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex max-h-[calc(100vh-14rem)] flex-wrap gap-2 overflow-y-auto">
                {images.map((img) => (
                  <ImageListItem
                    key={img.id}
                    id={img.id}
                    src={img.src}
                    isDragging={draggedImageId === img.id}
                    onDragStart={setDraggedImageId}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(overId) => {
                      if (draggedImageId) {
                        moveImage(draggedImageId, overId)
                      }
                    }}
                    onDragEnd={() => setDraggedImageId(null)}
                    onRemove={removeImage}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                拖拽图片可以调整顺序
              </p>
            </CardContent>
          </Card>
        )}

        {canvasUrl && (
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4" />
                拼接结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <img
                src={canvasUrl}
                alt="拼接结果"
                className="max-h-[calc(100vh-14rem)] w-full rounded-none border border-border/70 object-contain"
              />

              <div className="flex gap-2">
                <Button onClick={downloadCanvas} size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  下载拼接结果
                </Button>
                <Button
                  onClick={clearImages}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除并重新开始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolId="pictureSplicing" toolName="图片拼接">
      <PictureSplicingTool />
    </ToolErrorBoundary>
  )
}
