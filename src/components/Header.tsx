import React from 'react';
import { CommissioningReport } from '../types/report';
import {
  FileText,
  Printer,
  Sparkles,
  RotateCcw,
  FolderOpen,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  Share2,
  Download,
  Copy,
  AlertCircle,
  Archive,
  Building2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  LogOut,
  Crown,
} from 'lucide-react';

interface HeaderProps {
  report: CommissioningReport;
  onOpenDrafts: () => void;
  onLoadSample: () => void;
  onNewReport: () => void;
  onCloneReport: () => void;
  onOpenPrintView: () => void;
  onOpenMissingPhotos: () => void;
  onShareWhatsApp: () => void;
  onExportZip: () => void;
  isExportingZip: boolean;
  withWatermark: boolean;
  onToggleWatermark: () => void;
  filledPhotosCount: number;
  totalPhotosCount: number;
  onOpenTenantProfile?: () => void;
  activeTenantName?: string;
  tenantTierName?: string;
  tenantDaysLeft?: number;
  // Auth & Rental SaaS controls
  onOpenLogin: () => void;
  onLogout?: () => void;
  onOpenOwnerDashboard?: () => void;
  onBackToDashboard?: () => void;
  isOwner: boolean;
  canExportZip?: boolean;
  canExportPdf?: boolean;
  canWhiteLabel?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  report,
  onOpenDrafts,
  onLoadSample,
  onNewReport,
  onCloneReport,
  onOpenPrintView,
  onOpenMissingPhotos,
  onShareWhatsApp,
  onExportZip,
  isExportingZip,
  withWatermark,
  onToggleWatermark,
  filledPhotosCount,
  totalPhotosCount,
  onOpenTenantProfile,
  activeTenantName,
  tenantTierName,
  tenantDaysLeft,
  onOpenLogin,
  onLogout,
  onOpenOwnerDashboard,
  onBackToDashboard,
  isOwner,
  canExportZip = true,
  canExportPdf = true,
  canWhiteLabel = true,
}) => {
  const percent = Math.round((filledPhotosCount / (totalPhotosCount || 1)) * 100);
  const missingCount = totalPhotosCount - filledPhotosCount;

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        
        {/* Bar 1: Top Bar with Navigation, Title, and User Identity */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          
          {/* Left: Back Navigation & App Brand */}
          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0 shadow-xs ${
                  isOwner
                    ? 'bg-amber-500/10 text-amber-950 border-amber-300 hover:bg-amber-500/20'
                    : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                }`}
                title={isOwner ? 'Kembali ke Dashboard Penjual (Kelola Sewa & Customer)' : 'Kembali ke Portal Kontraktor / Surveyor'}
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="font-bold">
                  {isOwner ? 'Dashboard Penjual' : 'Kembali ke Portal'}
                </span>
              </button>
            )}

            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
                isOwner ? 'bg-slate-900 text-amber-400' : 'bg-emerald-600 text-white shadow-emerald-600/20'
              }`}
            >
              {isOwner ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <svg viewBox="0 0 100 80" className="w-5 h-5 fill-current">
                  <path d="M 30 15 C 45 28 65 38 60 62 C 56 72 42 72 35 64 C 27 56 22 40 30 15 Z" />
                  <path
                    d="M 22 28 C 30 38 38 50 30 65"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-slate-900 text-sm md:text-base tracking-tight">
                  V-GREEN COMM TEST REPORT
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase border ${
                    isOwner
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {isOwner ? '👑 MODE PENJUAL' : '🏢 PORTAL SURVEYOR'}
                </span>
                {report.generalInfo.plantName && (
                  <span className="text-xs text-slate-600 font-semibold truncate max-w-[180px] sm:max-w-[240px]">
                    • {report.generalInfo.plantName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isOwner
                  ? 'Area Penjual (Admin Sewa): Kontrol master template, audit PUIL, dan pengaturan white-label vendor'
                  : `Kontraktor Lapangan: ${activeTenantName || 'Penyewa'} • Pengisian Dokumen & BAST Resmi`}
              </p>
            </div>
          </div>

          {/* Right: Active Role Pill & Print PDF Button */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            {isOwner ? (
              /* Penjual (Admin) Pill */
              <div className="flex items-center gap-2 bg-slate-900 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-400/30 text-xs font-bold shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Akun Penjual (Admin)</span>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-0.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              /* Penyewa (Customer) Pill */
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="truncate max-w-[140px]">{activeTenantName || 'Customer'}</span>
                {tenantTierName && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-black rounded uppercase">
                    {tenantTierName}
                  </span>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="ml-1 p-0.5 text-emerald-700 hover:text-rose-600 rounded transition-colors"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Big Print PDF Button */}
            <button
              type="button"
              onClick={onOpenPrintView}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                canExportPdf
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-700/20'
              }`}
              title="Pratinjau formulir dan cetak dokumen PDF resmi"
            >
              {!canExportPdf && <Lock className="w-3.5 h-3.5 text-white/90" />}
              <Printer className="w-4 h-4" />
              <span>{canExportPdf ? 'Pratinjau / Cetak PDF' : 'Pratinjau (Watermark)'}</span>
            </button>
          </div>
        </div>

        {/* Bar 2: Role-Separated Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
          
          {/* Action Tools: Custom tailored based on Role */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* ======================================================== */}
            {/* FITUR KHUSUS PENJUAL (HANYA MUNCUL UNTUK PENJUAL)        */}
            {/* ======================================================== */}
            {isOwner && (
              <div className="flex items-center gap-1.5 p-1 bg-amber-50 border border-amber-300 rounded-xl">
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Fitur Penjual
                </span>

                {/* Dashboard Sewa Owner */}
                {onOpenOwnerDashboard && (
                  <button
                    type="button"
                    onClick={onOpenOwnerDashboard}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors"
                    title="Buka Dashboard Manajemen Sewa & Pengguna"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dashboard Sewa</span>
                  </button>
                )}

                {/* Kelola White-Label Semua Vendor */}
                {onOpenTenantProfile && (
                  <button
                    type="button"
                    onClick={onOpenTenantProfile}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-amber-200/60 rounded-lg transition-colors"
                    title="Kelola Profil dan Logo Semua Perusahaan Vendor"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-800" />
                    <span>Profil & White-Label</span>
                  </button>
                )}

                {/* Muat Contoh Laporan (Hanya untuk Testing Penjual) */}
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="Muat data contoh pengujian (Hanya untuk Penjual)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Contoh</span>
                </button>

                {/* Reset Formulir Baru (Hanya untuk Penjual) */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Kosongkan formulir dan buat laporan baru?')) {
                      onNewReport();
                    }
                  }}
                  className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                  title="Reset Formulir Kosong Baru (Penjual)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* FITUR KOP SURAT PENYEWA (HANYA KOP SURAT PERUSAHAAN SENDIRI) */}
            {/* ======================================================== */}
            {!isOwner && onOpenTenantProfile && (
              <button
                type="button"
                onClick={
                  canWhiteLabel
                    ? onOpenTenantProfile
                    : () =>
                        alert(
                          'Fitur Kustom Logo Perusahaan terkunci pada paket sewa ini. Hubungi penjual aplikasi untuk upgrade ke Paket Pro.'
                        )
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  canWhiteLabel
                    ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800 shadow-xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={
                  canWhiteLabel
                    ? 'Atur logo perusahaan dan penandatangan PIC Anda'
                    : 'Fitur logo kustom terkunci pada paket sewa Anda'
                }
              >
                {!canWhiteLabel ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="truncate max-w-[140px] font-bold">
                  {activeTenantName || 'Kop Surat'}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    canWhiteLabel
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-500 line-through'
                  }`}
                >
                  {canWhiteLabel ? 'Logo' : 'Kunci'}
                </span>
              </button>
            )}

            {/* ======================================================== */}
            {/* ALAT INSPEKSI LAPANGAN (DIGUNAKAN OLEH SURVEYOR / PENYEWA) */}
            {/* ======================================================== */}
            {/* Audit Kelengkapan Foto Lapangan */}
            <button
              type="button"
              onClick={onOpenMissingPhotos}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                missingCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
              title="Periksa foto inspeksi lapangan yang belum lengkap"
            >
              {missingCount > 0 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Audit ({missingCount} Kosong)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Foto Lengkap</span>
                </>
              )}
            </button>

            {/* GPS Watermark Toggle */}
            <button
              type="button"
              onClick={onToggleWatermark}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                withWatermark
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Aktifkan atau nonaktifkan cap watermark tanggal & GPS pada foto"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Watermark GPS</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={onShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              title="Kirim ringkasan laporan inspeksi via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WA</span>
            </button>

            {/* Export Foto ZIP */}
            <button
              type="button"
              onClick={
                canExportZip
                  ? onExportZip
                  : () =>
                      alert(
                        'Fitur Unduh ZIP Foto terkunci pada paket sewa ini. Hubungi penjual untuk upgrade ke Paket Pro.'
                      )
              }
              disabled={isExportingZip}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                !canExportZip
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title={
                canExportZip
                  ? 'Unduh seluruh foto lapangan dalam satu berkas ZIP'
                  : 'Fitur Unduh ZIP terkunci di paket ini'
              }
            >
              {!canExportZip ? (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{isExportingZip ? 'Mengompres...' : 'ZIP Foto'}</span>
            </button>

            {/* Kloning Stasiun */}
            <button
              type="button"
              onClick={onCloneReport}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              title="Duplikasi data vendor untuk stasiun BSS baru"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Kloning</span>
            </button>

            {/* Draf Tersimpan */}
            <button
              type="button"
              onClick={onOpenDrafts}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              title="Lihat daftar draf laporan"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Draf</span>
            </button>
          </div>

          {/* Audit Progress Bar */}
          <div className="flex items-center gap-3 text-xs shrink-0 self-end sm:self-center">
            <span className="font-semibold text-slate-600">Foto:</span>
            <span className="font-mono font-bold text-emerald-700">
              {filledPhotosCount}/{totalPhotosCount} ({percent}%)
            </span>
            <div className="w-24 md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
