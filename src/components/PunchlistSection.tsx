import React, { useState, useRef } from 'react';
import { PunchlistItem } from '../types/report';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  Calendar,
} from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface PunchlistSectionProps {
  items: PunchlistItem[];
  onChange: (items: PunchlistItem[]) => void;
}

export const PunchlistSection: React.FC<PunchlistSectionProps> = ({ items, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Minor' | 'Major'>('Minor');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<'Open' | 'In Progress' | 'Resolved'>('Open');
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 1000, 1000, 0.85);
      setPhotoData(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newItem: PunchlistItem = {
      id: `punch-${Date.now()}`,
      description: description.trim(),
      severity,
      targetDate: targetDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString('id-ID'),
      status,
      photoData,
      createdAt: new Date().toLocaleDateString('id-ID'),
    };

    onChange([...items, newItem]);
    setDescription('');
    setPhotoData(undefined);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    onChange(
      items.map((i) => {
        if (i.id === id) {
          const nextStatus: 'Open' | 'In Progress' | 'Resolved' =
            i.status === 'Open'
              ? 'In Progress'
              : i.status === 'In Progress'
              ? 'Resolved'
              : 'Open';
          return { ...i, status: nextStatus };
        }
        return i;
      })
    );
  };

  const openCount = items.filter((i) => i.status !== 'Resolved').length;
  const resolvedCount = items.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">
              Catatan Temuan Lapangan & Punchlist (Defects)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar temuan teknis atau ketidaksesuaian instalasi yang memerlukan tindak lanjut sebelum serah terima final
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
            {openCount} Open
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
            {resolvedCount} Selesai
          </span>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Temuan
          </button>
        </div>
      </div>

      {/* Form Tambah Temuan */}
      {isAdding && (
        <form
          onSubmit={handleAddItem}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Formulir Tambah Temuan Baru
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Temuan / Masalah <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Klem kabel pada jalur trench grounding belum terkunci rapat, perlu penambahan klem..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Urgensi</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="Minor">Minor (Perapian / Estetika)</option>
                  <option value="Major">Major (Kritikal / Keamanan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Penyelesaian</label>
                <input
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                {photoData ? 'Ganti Foto Bukti' : 'Unggah Foto Bukti (Opsional)'}
              </button>
              {photoData && (
                <span className="text-xs text-emerald-600 font-semibold">✓ Foto terpilih</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Simpan Temuan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Daftar Item Punchlist */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-60" />
          <p className="font-semibold text-slate-600">Nihil Temuan (Nil Defect)</p>
          <p className="text-[11px] text-slate-400">Tidak ada catatan perbaikan terbuka untuk stasiun ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                item.status === 'Resolved'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : item.severity === 'Major'
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                {item.photoData && (
                  <img
                    src={item.photoData}
                    alt="Bukti Temuan"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-xs text-slate-900">Temuan #{idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.severity === 'Major'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-600 text-white'
                          : item.status === 'In Progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                      title="Klik untuk ubah status"
                    >
                      Status: {item.status} (Klik ubah)
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{item.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                    <span>Target: <strong className="text-slate-600">{item.targetDate}</strong></span>
                    {item.createdAt && <span>Dibuat: {item.createdAt}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus Temuan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
