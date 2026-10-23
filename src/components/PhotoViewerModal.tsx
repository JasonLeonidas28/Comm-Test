import React from 'react';
import { X, Calendar, Download } from 'lucide-react';
import { PhotoItem } from '../types/report';

interface PhotoViewerModalProps {
  item: PhotoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen || !item || !item.imageData) return null;

  const handleDownload = () => {
    if (!item.imageData) return;
    const a = document.createElement('a');
    a.href = item.imageData;
    a.download = `${item.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{item.label}</h3>
            {item.sublabel && (
              <p className="text-xs text-slate-400 mt-0.5">{item.sublabel}</p>
            )}
            {item.measurementValue && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                Nilai Terukur: {item.measurementValue} {item.measurementUnit}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
              title="Unduh Foto"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 overflow-auto p-2 bg-black flex items-center justify-center min-h-[300px]">
          <img
            src={item.imageData}
            alt={item.label}
            className="max-w-full max-h-[70vh] object-contain rounded"
          />
        </div>

        {/* Footer info */}
        {item.timestamp && (
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Diambil pada: <strong className="text-slate-200">{item.timestamp}</strong>
            </span>
            <span className="font-mono text-[11px] text-slate-500">V-GREEN COMMISSIONING VERIFIED</span>
          </div>
        )}
      </div>
    </div>
  );
};
