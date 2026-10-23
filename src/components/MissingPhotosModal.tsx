import React, { useState } from 'react';
import { CommissioningReport, PhotoItem } from '../types/report';
import { X, CheckCircle2, AlertCircle, Camera, ArrowRight, Filter } from 'lucide-react';

interface MissingPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CommissioningReport;
  onNavigateToTab: (tabIndex: number) => void;
}

interface PhotoAuditEntry {
  sectionIndex: number;
  sectionName: string;
  item: PhotoItem;
  isFilled: boolean;
}

export const MissingPhotosModal: React.FC<MissingPhotosModalProps> = ({
  isOpen,
  onClose,
  report,
  onNavigateToTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'missing' | 'filled'>('missing');

  if (!isOpen) return null;

  // Build complete list
  const allPhotos: PhotoAuditEntry[] = [
    // Tab 1: BSS Visual
    ...Object.values(report.bssVisual).map((item) => ({
      sectionIndex: 1,
      sectionName: '1. Battery Swap Station',
      item,
      isFilled: Boolean(item.imageData),
    })),
    // Tab 2: SIM Card
    ...Object.values(report.simCardVisual).map((item) => ({
      sectionIndex: 2,
      sectionName: '2. SIM Card',
      item,
      isFilled: Boolean(item.imageData),
    })),
    // Tab 3: Grounding
    ...Object.values(report.groundingVisual).map((item) => ({
      sectionIndex: 3,
      sectionName: '3. Grounding System',
      item,
      isFilled: Boolean(item.imageData),
    })),
    // Tab 4: Panel & KWH
    ...Object.values(report.kwhAndPanelVisual).map((item) => ({
      sectionIndex: 4,
      sectionName: '4. Panel & KWH Meter',
      item,
      isFilled: Boolean(item.imageData),
    })),
    // Tab 5: AC Panel Testing
    ...Object.values(report.acPanelTesting).map((item) => ({
      sectionIndex: 5,
      sectionName: '5. Testing Panel AC',
      item,
      isFilled: Boolean(item.imageData),
    })),
    // Tab 6: Cables
    ...Object.values(report.cablesVisual).map((item) => ({
      sectionIndex: 6,
      sectionName: '6. Kabel & Routing',
      item,
      isFilled: Boolean(item.imageData),
    })),
  ];

  const filledCount = allPhotos.filter((p) => p.isFilled).length;
  const missingCount = allPhotos.length - filledCount;
  const percent = Math.round((filledCount / allPhotos.length) * 100);

  const filteredPhotos = allPhotos.filter((p) => {
    if (filter === 'missing') return !p.isFilled;
    if (filter === 'filled') return p.isFilled;
    return true;
  });

  const handleJump = (sectionIndex: number) => {
    onNavigateToTab(sectionIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-base">Audit Kelengkapan Foto Inspeksi</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {percent}% Selesai
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {filledCount} foto terisi, <strong>{missingCount} foto masih kosong</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Tampilan:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFilter('missing')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === 'missing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Terisi ({missingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('filled')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === 'filled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sudah Terisi ({filledCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({allPhotos.length})
            </button>
          </div>
        </div>

        {/* Photo Checklist List */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {filter === 'missing'
                  ? 'Luar biasa! Semua 34 foto inspeksi sudah terisi lengkap.'
                  : 'Tidak ada foto pada filter ini.'}
              </p>
            </div>
          ) : (
            filteredPhotos.map((entry, idx) => (
              <div
                key={`${entry.sectionIndex}-${entry.item.id}-${idx}`}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  entry.isFilled
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {entry.isFilled ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">
                        {entry.item.label}
                      </span>
                      {entry.item.measurementValue && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                          {entry.item.measurementValue} {entry.item.measurementUnit}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Bagian: {entry.sectionName}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJump(entry.sectionIndex)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    entry.isFilled
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {entry.isFilled ? 'Lihat' : 'Isi Foto'}
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
