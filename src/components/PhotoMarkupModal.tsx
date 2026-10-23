import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Pencil,
  ArrowRight,
  Circle,
  Square,
  Type,
  Stamp,
  Undo2,
  Trash2,
  Palette,
} from 'lucide-react';

interface PhotoMarkupModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  onSave: (annotatedDataUrl: string) => void;
  title?: string;
}

type ToolType = 'pen' | 'arrow' | 'circle' | 'rect' | 'text' | 'stamp_ok' | 'stamp_check' | 'stamp_fail';

export const PhotoMarkupModal: React.FC<PhotoMarkupModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  onSave,
  title = 'Anotasi & Coret Foto Lapangan',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('arrow');
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444'); // Default vibrant red
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [textInput, setTextInput] = useState<string>('PERIKSA');
  const [history, setHistory] = useState<ImageData[]>([]);
  const isDrawing = useRef(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotBeforeDrag = useRef<ImageData | null>(null);

  const colors = [
    { label: 'Merah', hex: '#ef4444' },
    { label: 'Kuning', hex: '#facc15' },
    { label: 'Hijau', hex: '#22c55e' },
    { label: 'Biru', hex: '#3b82f6' },
    { label: 'Putih', hex: '#ffffff' },
    { label: 'Hitam', hex: '#000000' },
  ];

  // Initialize canvas with photo
  useEffect(() => {
    if (!isOpen || !photoUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fit within max dimensions while preserving ratio
      const maxW = 900;
      const maxH = 650;
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);
      const initialSnapshot = ctx.getImageData(0, 0, w, h);
      setHistory([initialSnapshot]);
    };
    img.src = photoUrl;
  }, [isOpen, photoUrl]);

  if (!isOpen) return null;

  const saveHistoryStep = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), snap]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextHistory = [...history];
    nextHistory.pop(); // Remove current
    const previous = nextHistory[nextHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(nextHistory);
  };

  const handleReset = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(history[0], 0, 0);
    setHistory([history[0]]);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    startPos.current = coords;
    isDrawing.current = true;
    snapshotBeforeDrag.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (activeTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (activeTool.startsWith('stamp_')) {
      // Place stamp directly at click
      drawStamp(ctx, coords.x, coords.y, activeTool);
      isDrawing.current = false;
      saveHistoryStep();
    } else if (activeTool === 'text') {
      drawText(ctx, coords.x, coords.y, textInput || 'CATATAN');
      isDrawing.current = false;
      saveHistoryStep();
    }
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (activeTool === 'pen') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (snapshotBeforeDrag.current) {
      // Restore before drawing preview
      ctx.putImageData(snapshotBeforeDrag.current, 0, 0);

      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      if (activeTool === 'arrow') {
        drawArrow(ctx, startPos.current.x, startPos.current.y, coords.x, coords.y);
      } else if (activeTool === 'circle') {
        const radiusX = Math.abs(coords.x - startPos.current.x) / 2;
        const radiusY = Math.abs(coords.y - startPos.current.y) / 2;
        const centerX = Math.min(startPos.current.x, coords.x) + radiusX;
        const centerY = Math.min(startPos.current.y, coords.y) + radiusY;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === 'rect') {
        const x = Math.min(startPos.current.x, coords.x);
        const y = Math.min(startPos.current.y, coords.y);
        const w = Math.abs(coords.x - startPos.current.x);
        const h = Math.abs(coords.y - startPos.current.y);
        ctx.strokeRect(x, y, w, h);
      }
    }
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    saveHistoryStep();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 16 + lineWidth * 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.fillStyle = selectedColor;
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, stampType: ToolType) => {
    ctx.save();
    let text = '✓ OK / VERIFIKASI';
    let bgColor = 'rgba(34, 197, 94, 0.9)';
    if (stampType === 'stamp_check') {
      text = '⚠ PERIKSA KEMBALI';
      bgColor = 'rgba(234, 179, 8, 0.95)';
    } else if (stampType === 'stamp_fail') {
      text = '✕ REVISI / PERBAIKI';
      bgColor = 'rgba(239, 68, 68, 0.95)';
    }

    ctx.font = 'bold 16px sans-serif';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 14;
    const paddingY = 8;
    const boxW = textWidth + paddingX * 2;
    const boxH = 34;

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawText = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 10;
    const boxW = textWidth + paddingX * 2;
    const boxH = 32;

    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(x, y - 22, boxW, boxH, 6);
    ctx.fill();

    // Text with selected color
    ctx.fillStyle = selectedColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + paddingX, y - 6);
    ctx.restore();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">
                Gambar panah, lingkaran sorot, teks keterangan, atau stempel inspeksi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tool selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'arrow' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Panah Penunjuk"
            >
              <ArrowRight className="w-4 h-4" /> Panah
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('circle')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'circle' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Lingkaran Sorot"
            >
              <Circle className="w-4 h-4" /> Lingkar
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('rect')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'rect' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Kotak"
            >
              <Square className="w-4 h-4" /> Kotak
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'pen' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Coretan Bebas"
            >
              <Pencil className="w-4 h-4" /> Spidol
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'text' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Teks Catatan"
            >
              <Type className="w-4 h-4" /> Teks
            </button>
          </div>

          {/* Stamps */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTool('stamp_ok')}
              className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                activeTool === 'stamp_ok' ? 'bg-green-600 text-white' : 'text-green-400 hover:bg-slate-800'
              }`}
            >
              ✓ OK
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('stamp_check')}
              className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                activeTool === 'stamp_check' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
              }`}
            >
              ⚠ Cek
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('stamp_fail')}
              className={`px-2 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                activeTool === 'stamp_fail' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-slate-800'
              }`}
            >
              ✕ Revisi
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setSelectedColor(c.hex)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  selectedColor === c.hex ? 'scale-115 border-white ring-2 ring-emerald-500' : 'border-slate-500'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>

          {/* Text Input when text tool active */}
          {activeTool === 'text' && (
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ketik teks & klik foto..."
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-emerald-500 max-w-[150px]"
            />
          )}

          {/* Undo and reset */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="Hapus Semua Coretan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="flex-1 bg-black/60 p-4 flex items-center justify-center overflow-auto">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={drawMove}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={drawMove}
            onTouchEnd={endDraw}
            className="max-h-[60vh] max-w-full rounded-lg shadow-lg border border-slate-700 cursor-crosshair touch-none bg-black"
          />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {activeTool === 'text'
              ? 'Ketik teks lalu klik pada foto di area yang diinginkan.'
              : activeTool.startsWith('stamp_')
              ? 'Klik di foto untuk menempatkan stempel verifikasi.'
              : 'Tarik mouse atau jari Anda pada foto untuk menggambar.'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
            >
              <Check className="w-4 h-4" /> Simpan Anotasi Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
