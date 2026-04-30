import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Download, Trash2, Settings } from 'lucide-react';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

interface ImageItem {
  id: string;
  src: string;
  width: number;
  height: number;
}

function SortableItem({ id, src, onRemove }: { id: string; src: string; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group cursor-move">
      <img src={src} alt="" className="w-32 h-32 object-cover rounded-md border" />
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

function PictureSplicingTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [gap, setGap] = useState(0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [canvasUrl, setCanvasUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const newItem: ImageItem = {
          id: Date.now().toString() + Math.random(),
          src: e.target?.result as string,
          width: img.width,
          height: img.height,
        };
        setImages((prev) => [...prev, newItem]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            processFile(file);
          }
        }
      }
    };

    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', (e) => e.preventDefault());
    };
  }, [processFile]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        processFile(files[i]);
      }
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function clearImages() {
    setImages([]);
    setCanvasUrl('');
  }

  function generateCanvas() {
    if (images.length === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (direction === 'horizontal') {
      const totalWidth = images.reduce((sum, img) => sum + img.width + gap, 0) - gap;
      const maxHeight = Math.max(...images.map((img) => img.height));
      canvas.width = totalWidth;
      canvas.height = maxHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalWidth, maxHeight);

      let loadedCount = 0;
      let x = 0;
      images.forEach((img) => {
        const imageObj = new Image();
        imageObj.onload = () => {
          ctx.drawImage(imageObj, x, 0);
          loadedCount++;
          if (loadedCount === images.length) {
            setCanvasUrl(canvas.toDataURL('image/png'));
          }
        };
        imageObj.src = img.src;
        x += img.width + gap;
      });
    } else {
      const totalHeight = images.reduce((sum, img) => sum + img.height + gap, 0) - gap;
      const maxWidth = Math.max(...images.map((img) => img.width));
      canvas.width = maxWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      let loadedCount = 0;
      let y = 0;
      images.forEach((img) => {
        const imageObj = new Image();
        imageObj.onload = () => {
          ctx.drawImage(imageObj, 0, y);
          loadedCount++;
          if (loadedCount === images.length) {
            setCanvasUrl(canvas.toDataURL('image/png'));
          }
        };
        imageObj.src = img.src;
        y += img.height + gap;
      });
    }
  }

  function downloadCanvas() {
    if (!canvasUrl) return;
    const link = document.createElement('a');
    link.href = canvasUrl;
    link.download = 'spliced-image.png';
    link.click();
  }

  return (
    <ToolPageShell toolId="pictureSplicing" description="上传、排序并生成拼接图，适合快速合并截图、海报或长图素材。">
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
            <Button onClick={() => fileInputRef.current?.click()} size="sm" className="w-full">
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
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as 'horizontal' | 'vertical')}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="horizontal">水平拼接</option>
                    <option value="vertical">垂直拼接</option>
                  </select>
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
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-md border"
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex max-h-[calc(100vh-14rem)] flex-wrap gap-2 overflow-y-auto">
                    {images.map((img) => (
                      <SortableItem key={img.id} id={img.id} src={img.src} onRemove={removeImage} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <p className="mt-2 text-xs text-muted-foreground">拖拽图片可以调整顺序</p>
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
              <img src={canvasUrl} alt="拼接结果" className="max-h-[calc(100vh-14rem)] w-full rounded-lg border border-border/70 object-contain" />

              <div className="flex gap-2">
                <Button onClick={downloadCanvas} size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  下载拼接结果
                </Button>
                <Button onClick={clearImages} variant="outline" size="sm" className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除并重新开始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolPageShell>
  );
}

const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(
    <ToolErrorBoundary toolId="pictureSplicing" toolName="图片拼接">
      <PictureSplicingTool />
    </ToolErrorBoundary>,
  );
}
