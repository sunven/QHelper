import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
      <img src={src} alt="" className="w-32 h-32 object-cover rounded border" />
      <button
        onClick={() => onRemove(id)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
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
  }, []);

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function processFile(file: File) {
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
    <div className="p-4">
      {/* 上传按钮 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        选择图片
      </button>

      {/* 拖拽排序区域 */}
      {images.length > 0 && !canvasUrl && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
            <div className="flex gap-2 flex-wrap mb-4">
              {images.map((img) => (
                <SortableItem key={img.id} id={img.id} src={img.src} onRemove={removeImage} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 设置面板 */}
      {images.length > 0 && !canvasUrl && (
        <div className="p-4 bg-white border rounded shadow-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">拼接方向</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'horizontal' | 'vertical')}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="horizontal">水平拼接</option>
              <option value="vertical">垂直拼接</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">图片间距（px）</label>
            <input
              type="number"
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">背景颜色</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-10 cursor-pointer"
            />
          </div>

          <button
            onClick={generateCanvas}
            className="w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            生成拼接
          </button>
        </div>
      )}

      {/* 结果预览 */}
      {canvasUrl && (
        <div className="mt-4">
          <img src={canvasUrl} alt="拼接结果" className="max-w-full border" />
          <div className="mt-4 flex gap-4">
            <button
              onClick={downloadCanvas}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              下载拼接结果
            </button>
            <button
              onClick={clearImages}
              className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              清除
            </button>
          </div>
        </div>
      )}

      {/* 拖拽提示 */}
      {images.length > 0 && !canvasUrl && (
        <p className="text-gray-500 text-sm mt-2">拖拽图片可以调整顺序</p>
      )}
    </div>
  );
}

// Mount the React app
const root = document.getElementById('app');
if (root) {
  ReactDOM.createRoot(root).render(<PictureSplicingTool />);
}
