import React, { useState, useRef } from 'react';
import { TenantProfile, DEFAULT_CLIENT_LOGO_NAME } from '../types/tenant';
import { compressImage } from '../utils/imageUtils';
import { DEFAULT_VGREEN_LOGO } from '../utils/sampleData';
import {
  X,
  Building2,
  Upload,
  Trash2,
  Check,
  Plus,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Download,
  FileCode,
  PenTool,
  Palette,
  ExternalLink,
} from 'lucide-react';

interface TenantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: TenantProfile[];
  activeProfileId: string;
  onSaveProfile: (profile: TenantProfile) => void;
  onDeleteProfile: (id: string) => void;
  onSelectActiveProfile: (id: string) => void;
  onApplyToCurrentReport: (profile: TenantProfile) => void;
  isOwner?: boolean;
}

export const TenantProfileModal: React.FC<TenantProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSaveProfile,
  onDeleteProfile,
  onSelectActiveProfile,
  onApplyToCurrentReport,
  isOwner = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeProfileId || profiles[0]?.id || '');
  const [editingProfile, setEditingProfile] = useState<TenantProfile>(() => {
    const found = profiles.find((p) => p.id === (activeProfileId || profiles[0]?.id));
    return (
      found || {
        id: `tenant-${Date.now()}`,
        name: 'PT Baru Surveyor',
        shortCode: 'PBS',
        phone: '',
        email: '',
        address: '',
        picName: '',
        picRole: 'Project Manager',
        picPhone: '',
        clientName: 'Vgreen Indonesia',
        clientLogo: DEFAULT_VGREEN_LOGO,
        reportPrefix: 'COMM-BSS',
        brandColor: 'emerald',
        footerText: 'Dokumen Inspeksi Lapangan & Commissioning Stasiun BSS',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const [activeTab, setActiveTab] = useState<'company' | 'pic' | 'client' | 'branding'>('company');
  const [isDrawingSignature, setIsDrawingSignature] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const vendorLogoInputRef = useRef<HTMLInputElement>(null);
  const clientLogoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isPaintingRef = useRef<boolean>(false);

  // Sync when selectedId changes
  const handleSelectProfile = (id: string) => {
    setSelectedId(id);
    const found = profiles.find((p) => p.id === id);
    if (found) {
      setEditingProfile({ ...found });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateNew = () => {
    const newId = `tenant-${Date.now()}`;
    const newProf: TenantProfile = {
      id: newId,
      name: 'PT Surveyor Energi Baru',
      shortCode: 'SEB',
      phone: '0812-0000-0000',
      email: 'info@perusahaan-baru.com',
      address: 'Alamat Kantor Surveyor',
      picName: 'Nama Koordinator Lapangan',
      picRole: 'Lead Commissioning Engineer',
      picPhone: '0812-0000-0000',
      clientName: 'Vgreen Indonesia',
      clientLogo: DEFAULT_VGREEN_LOGO,
      reportPrefix: 'SEB-COMM',
      brandColor: 'emerald',
      footerText: 'Dokumen Resmi Inspeksi Lapangan - PT Surveyor Energi Baru',
      approvalStatement:
        'This commissioning report has been prepared truthfully based on field inspections and testing results.',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedId(newId);
    setEditingProfile(newProf);
  };

  const handleLogoUpload = async (type: 'vendor' | 'client', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const compressed = await compressImage(files[0], 600, 300, 0.9);
      if (type === 'vendor') {
        setEditingProfile((prev) => ({ ...prev, logo: compressed }));
      } else {
        setEditingProfile((prev) => ({ ...prev, clientLogo: compressed }));
      }
      showToast(`Logo ${type === 'vendor' ? 'perusahaan' : 'klien'} berhasil diunggah!`);
    } catch (err) {
      console.error('Error uploading logo', err);
      alert('Gagal mengunggah logo');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const compressed = await compressImage(files[0], 500, 300, 0.9);
      setEditingProfile((prev) => ({ ...prev, picSignature: compressed }));
      showToast('Tanda tangan digital PIC berhasil diunggah!');
    } catch (err) {
      alert('Gagal mengunggah tanda tangan');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Canvas drawing handlers for signature pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isPaintingRef.current = true;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isPaintingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setEditingProfile((prev) => ({ ...prev, picSignature: dataUrl }));
    setIsDrawingSignature(false);
    showToast('Tanda tangan berhasil disimpan!');
  };

  const handleSave = () => {
    onSaveProfile(editingProfile);
    onSelectActiveProfile(editingProfile.id);
    showToast('Profil perusahaan & white-label berhasil disimpan!');
  };

  const handleApplyToCurrent = () => {
    handleSave();
    onApplyToCurrentReport(editingProfile);
    showToast('Identitas penyewa diterapkan ke laporan saat ini!');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(editingProfile, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `Profil_Penyewa_${editingProfile.shortCode || 'Brand'}.json`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  {isOwner
                    ? 'Pengaturan Profil Vendor & White-Label (Penjual)'
                    : 'Kop Surat & Logo Perusahaan Anda'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  {isOwner ? 'Mode Penjual' : 'Akun Penyewa'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isOwner
                  ? 'Atur branding, logo kontraktor, kop surat, dan PIC penandatangan untuk seluruh pelanggan sewa BSS.'
                  : 'Atur logo perusahaan, alamat kantor, dan tanda tangan PIC untuk kop surat laporan commissioning Anda.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Profile Selector Toolbar: ONLY FOR OWNER / SELLER */}
          {isOwner ? (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                  👑 Pilih Profil Vendor yang Disimpan (Penjual):
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedId}
                    onChange={(e) => handleSelectProfile(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 min-w-[240px]"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.shortCode || 'No Code'}) {p.id === activeProfileId ? '★ [Aktif]' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-lg transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Profil Vendor
                  </button>

                  {profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus profil "${editingProfile.name}"?`)) {
                          onDeleteProfile(editingProfile.id);
                          showToast('Profil penyewa dihapus');
                        }
                      }}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                      title="Hapus Profil Penyewa Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  title="Ekspor pengaturan ke berkas JSON"
                >
                  <Download className="w-3.5 h-3.5" /> Backup JSON
                </button>
                {editingProfile.id === activeProfileId ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Check className="w-3.5 h-3.5" /> Vendor Aktif
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectActiveProfile(editingProfile.id);
                      showToast(`"${editingProfile.name}" dijadikan profil aktif!`);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                  >
                    Jadikan Profil Utama
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-600 block text-[11px]">Kop Surat Perusahaan Anda:</span>
                  <strong className="text-slate-900 font-bold text-sm">{editingProfile.name}</strong>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] tracking-wide uppercase shadow-xs">
                Kop Surat Aktif
              </span>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            {[
              { id: 'company', label: '1. Perusahaan Penyewa & Logo' },
              { id: 'pic', label: '2. PIC Lapangan & Tanda Tangan' },
              { id: 'client', label: '3. Klien / Operator Utama' },
              { id: 'branding', label: '4. White-Label & Tema Laporan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: INFORMASI PERUSAHAAN & LOGO */}
          {activeTab === 'company' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Form fields */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Resmi Perusahaan Penyewa (Kontraktor / Surveyor) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProfile.name}
                      onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                      placeholder="Contoh: PT Sinar Energi Mandiri"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Nama ini akan muncul pada kolom "INSTALLATION VENDOR" dan pengesahan laporan PDF.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kode Singkat (Prefix)</label>
                      <input
                        type="text"
                        value={editingProfile.shortCode}
                        onChange={(e) => setEditingProfile({ ...editingProfile, shortCode: e.target.value.toUpperCase() })}
                        placeholder="Contoh: SEM / SCD"
                        maxLength={6}
                        className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telepon / WhatsApp Kantor</label>
                      <input
                        type="text"
                        value={editingProfile.phone}
                        onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                        placeholder="0812-xxxx-xxxx / 021-xxxx"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
                      <input
                        type="email"
                        value={editingProfile.email}
                        onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                        placeholder="project@perusahaan.com"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Website Perusahaan (Opsional)</label>
                      <input
                        type="text"
                        value={editingProfile.website || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, website: e.target.value })}
                        placeholder="www.perusahaan.com"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Kantor Penyewa</label>
                    <textarea
                      rows={2}
                      value={editingProfile.address}
                      onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                      placeholder="Alamat lengkap kantor pusat / cabang penyewa..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Logo Perusahaan Penyewa Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Logo Perusahaan Penyewa
                    </span>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Ditampilkan di sebelah kanan Header Halaman 1 laporan PDF. Disarankan format PNG transparan.
                    </p>

                    <div className="w-full h-36 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-3 relative group overflow-hidden">
                      {editingProfile.logo ? (
                        <img
                          src={editingProfile.logo}
                          alt="Logo Vendor"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400 space-y-1">
                          <Building2 className="w-8 h-8 mx-auto stroke-1" />
                          <span className="text-xs font-semibold block">Belum ada logo</span>
                          <span className="text-[10px] block">Klik unggah di bawah</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => vendorLogoInputRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {editingProfile.logo ? 'Ganti Logo' : 'Unggah Logo'}
                    </button>
                    {editingProfile.logo && (
                      <button
                        type="button"
                        onClick={() => setEditingProfile({ ...editingProfile, logo: undefined })}
                        className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      ref={vendorLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('vendor', e)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PIC & TANDA TANGAN DIGITAL */}
          {activeTab === 'pic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PIC Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Penanggung Jawab Lapangan (Prepared By)
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap PIC / Engineer Lapangan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProfile.picName}
                      onChange={(e) => setEditingProfile({ ...editingProfile, picName: e.target.value })}
                      placeholder="Contoh: Hendra Setiawan, S.T."
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Designation</label>
                    <input
                      type="text"
                      value={editingProfile.picRole}
                      onChange={(e) => setEditingProfile({ ...editingProfile, picRole: e.target.value })}
                      placeholder="Contoh: Project Manager / Lead Commissioning Engineer"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP / WhatsApp PIC</label>
                    <input
                      type="text"
                      value={editingProfile.picPhone}
                      onChange={(e) => setEditingProfile({ ...editingProfile, picPhone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Digital Signature Pad / Upload */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tanda Tangan Digital Default (PIC)
                      </span>
                      {editingProfile.picSignature && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Tersimpan
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Tanda tangan ini akan otomatis terpasang pada kolom "PREPARED BY (VENDOR)" lembar pengesahan.
                    </p>

                    {isDrawingSignature ? (
                      <div className="space-y-2">
                        <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <canvas
                            ref={sigCanvasRef}
                            width={340}
                            height={140}
                            className="w-full h-36 bg-white cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Hapus Goresan
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIsDrawingSignature(false)}
                              className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={saveCanvasSignature}
                              className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                            >
                              Simpan Tanda Tangan
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-3">
                        {editingProfile.picSignature ? (
                          <img
                            src={editingProfile.picSignature}
                            alt="Tanda Tangan PIC"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400 space-y-1">
                            <PenTool className="w-8 h-8 mx-auto stroke-1" />
                            <span className="text-xs font-semibold block">Belum ada tanda tangan</span>
                            <span className="text-[10px] block">Goreskan di layar atau unggah gambar</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isDrawingSignature && (
                    <div className="pt-3 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsDrawingSignature(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Goreskan Langsung
                      </button>

                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" /> Unggah File
                      </button>

                      {editingProfile.picSignature && (
                        <button
                          type="button"
                          onClick={() => setEditingProfile({ ...editingProfile, picSignature: undefined })}
                          className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KLIEN & OPERATOR UTAMA */}
          {activeTab === 'client' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold">Preset Klien BSS / EV Charging:</span>
                  <p className="text-emerald-800 mt-0.5">
                    Penyewa dapat memilih siapa pemilik stasiun atau pihak yang memesan pekerjaan survei/commissioning.
                  </p>
                </div>
              </div>

              {/* Quick client presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Vgreen Indonesia', code: 'VGREEN' },
                  { name: 'PLN Icon Plus / EV', code: 'PLN' },
                  { name: 'Pertamina Patra Niaga', code: 'PERTAMINA' },
                  { name: 'Shell Recharge', code: 'SHELL' },
                ].map((cli) => (
                  <button
                    key={cli.name}
                    type="button"
                    onClick={() => {
                      setEditingProfile({
                        ...editingProfile,
                        clientName: cli.name,
                      });
                      showToast(`Klien diset ke ${cli.name}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editingProfile.clientName === cli.name
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-800">{cli.name}</span>
                    <span className="text-[10px] text-slate-500">Preset Klien</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Klien / Operator Utama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingProfile.clientName}
                    onChange={(e) => setEditingProfile({ ...editingProfile, clientName: e.target.value })}
                    placeholder="Contoh: Vgreen Indonesia"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ditampilkan pada kolom CUSTOMER dan logo sebelah kiri halaman pertama.
                  </p>
                </div>

                {/* Logo Klien Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Logo Klien (Kolom Kiri Header)
                    </span>
                    <div className="w-full h-28 rounded-lg border border-slate-300 bg-white flex items-center justify-center p-2 mb-3">
                      {editingProfile.clientLogo ? (
                        <img
                          src={editingProfile.clientLogo}
                          alt="Logo Klien"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Belum ada logo</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => clientLogoInputRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" /> Ganti Logo Klien
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile({ ...editingProfile, clientLogo: DEFAULT_VGREEN_LOGO })}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="Kembalikan ke Logo Default V-GREEN"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={clientLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload('client', e)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHITE-LABEL & TEMA */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Brand Color selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    Warna Aksen Branding Laporan:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
                      { key: 'blue', label: 'Navy Deep Blue', bg: 'bg-blue-600', ring: 'ring-blue-500' },
                      { key: 'teal', label: 'Electric Teal', bg: 'bg-teal-600', ring: 'ring-teal-500' },
                      { key: 'slate', label: 'Corporate Charcoal', bg: 'bg-slate-800', ring: 'ring-slate-600' },
                    ].map((col) => (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => setEditingProfile({ ...editingProfile, brandColor: col.key as any })}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          editingProfile.brandColor === col.key
                            ? `border-slate-800 bg-slate-50 ring-2 ${col.ring}`
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${col.bg} shrink-0`} />
                        <span className="text-xs font-bold text-slate-800">{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Prefix */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Format Awalan Nomor Dokumen (Report Prefix)
                  </label>
                  <input
                    type="text"
                    value={editingProfile.reportPrefix}
                    onChange={(e) => setEditingProfile({ ...editingProfile, reportPrefix: e.target.value })}
                    placeholder="Contoh: VMN-COMM / SCD-BSS"
                    className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digunakan saat membuat laporan otomatis: <span className="font-mono text-slate-700">{editingProfile.reportPrefix}-2026-001</span>
                  </p>
                </div>
              </div>

              {/* Custom Footer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kaki Laporan Resmi (Document Footer Text)
                </label>
                <input
                  type="text"
                  value={editingProfile.footerText || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, footerText: e.target.value })}
                  placeholder="Contoh: Dokumen Hasil Uji Resmi - PT Sinar Energi Mandiri • Hak Cipta Dilindungi"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Custom Approval Statement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pernyataan Legalitas Berita Acara (Approval Statement)
                </label>
                <textarea
                  rows={3}
                  value={editingProfile.approvalStatement || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, approvalStatement: e.target.value })}
                  placeholder="Pernyataan keabsahan hasil pengujian lapangan..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Profil aktif saat ini:{' '}
            <span className="font-bold text-slate-800">{editingProfile.name || 'Belum diisi'}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Simpan Profil Saja
            </button>

            <button
              type="button"
              onClick={handleApplyToCurrent}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ke Laporan Saat Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
