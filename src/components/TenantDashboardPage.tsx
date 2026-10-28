import React, { useState } from 'react';
import { RentalTenant, AuthSession } from '../types/rental';
import { CommissioningReport } from '../types/report';
import { getDaysRemaining } from '../utils/rentalStorage';
import {
  Building2,
  Clock,
  Plus,
  FileText,
  Printer,
  Copy,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Info,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';

interface TenantDashboardPageProps {
  session: AuthSession;
  tenant: RentalTenant;
  reports: CommissioningReport[];
  onOpenReportEditor: (reportId?: string) => void;
  onOpenPrintReport: (report: CommissioningReport) => void;
  onNewReport: () => void;
  onCloneReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onLogout: () => void;
  onSwitchToOwner?: () => void;
}

export const TenantDashboardPage: React.FC<TenantDashboardPageProps> = ({
  session,
  tenant,
  reports,
  onOpenReportEditor,
  onOpenPrintReport,
  onNewReport,
  onCloneReport,
  onDeleteReport,
  onLogout,
  onSwitchToOwner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLimitsModal, setShowLimitsModal] = useState(false);

  const daysLeft = getDaysRemaining(tenant.endDate);
  const isExpired = tenant.status === 'expired' || daysLeft <= 0;
  const isSuspended = tenant.status === 'suspended';
  const isQuotaFull = tenant.reportsQuota !== -1 && tenant.reportsUsed >= tenant.reportsQuota;

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const query = searchQuery.toLowerCase();
    const name = (r.generalInfo.plantName || '').toLowerCase();
    const code = (r.generalInfo.snChargerUnit || '').toLowerCase();
    const vendor = (r.generalInfo.installationVendor || '').toLowerCase();
    return name.includes(query) || code.includes(query) || vendor.includes(query);
  });

  const handleContactSellerWA = () => {
    const cleanPhone = tenant.phone.replace(/[^0-9]/g, '');
    const phoneFormatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const message = encodeURIComponent(
      `Halo Pengelola VoltCheck System,\n\nSaya dari ${tenant.companyName} ingin konfirmasi perpanjangan sewa / upgrade fitur aplikasi:\n` +
        `• Paket: ${tenant.tierName}\n` +
        `• Status: ${isExpired ? 'Habis (Expired)' : `Tersisa ${daysLeft} hari`}\n` +
        `• Kuota: ${tenant.reportsUsed}/${tenant.reportsQuota === -1 ? 'Unlimited' : tenant.reportsQuota} laporan\n\n` +
        `Mohon info perpanjangan dan nomor rekening. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white uppercase">
                  {tenant.companyName}
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded">
                  {tenant.tierName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Portal Surveyor & Kontraktor Lapangan • PIC: {tenant.picName} ({tenant.phone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowLimitsModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Batasan Fitur Paket
            </button>

            <button
              type="button"
              onClick={handleContactSellerWA}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Perpanjang Sewa
            </button>

            {session.impersonatedByOwner && onSwitchToOwner ? (
              <button
                type="button"
                onClick={onSwitchToOwner}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Kembali ke Mode Penjual
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                title="Keluar dari akun penyewa"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* Rental Subscription Alert Banner */}
        {isExpired ? (
          <div className="bg-rose-950/80 border-2 border-rose-600 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-900 rounded-xl text-rose-300">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm">Masa Sewa Aplikasi Telah Berakhir</h3>
                <p className="text-xs text-rose-300 mt-0.5">
                  Masa aktif sewa akun Anda telah berakhir pada {tenant.endDate}. Pembuatan laporan baru dan fitur ekspor ditangguhkan sementara.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleContactSellerWA}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Perpanjang Sekarang via WhatsApp
            </button>
          </div>
        ) : isSuspended ? (
          <div className="bg-amber-950/80 border-2 border-amber-600 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-900 rounded-xl text-amber-300">
                <Lock className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-white text-sm">Akun Sedang Ditangguhkan</h3>
                <p className="text-xs text-amber-300 mt-0.5">
                  Akses Anda sementara ditangguhkan oleh pengelola sewa. Silakan hubungi penjual untuk membuka kembali akses.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleContactSellerWA}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Hubungi Pengelola
            </button>
          </div>
        ) : (
          <>
            {/* Quota Exhausted Warning Banner for Trial or Limited Plans */}
            {isQuotaFull && (
              <div className="bg-amber-950/80 border-2 border-amber-500 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 animate-fade-in shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-amber-900 rounded-xl text-amber-300 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>
                        {tenant.tier === 'trial'
                          ? 'Kuota Free Trial 1 Token Anda Telah Habis'
                          : 'Batas Kuota Paket Telah Tercapai'}
                      </span>
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold">
                        {tenant.reportsUsed} / {tenant.reportsQuota} Laporan Terpakai
                      </span>
                    </h3>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      {tenant.tier === 'trial'
                        ? 'Anda telah menggunakan kuota uji coba 1 token laporan. Untuk melanjutkan membuat laporan stasiun berikutnya tanpa batas, silakan upgrade ke Paket Starter, Pro, atau Enterprise.'
                        : 'Seluruh kuota laporan pada paket langganan Anda telah digunakan. Hubungi admin untuk menambah kuota (top-up) atau upgrade paket.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContactSellerWA}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs rounded-xl shrink-0 flex items-center gap-2 shadow-md shadow-emerald-900/30 cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Upgrade Paket Berbayar</span>
                </button>
              </div>
            )}

            {/* Active Subscription Card */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl">
                  {tenant.shortCode || 'BSS'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Status Lisensi Sewa Anda</h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      tenant.tier === 'trial'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {tenant.tier === 'trial' ? '🎁 Free Trial 1 Token' : 'Aktif'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Sisa {daysLeft} Hari (s/d {tenant.endDate})
                    </span>
                    <span>•</span>
                    <span>
                      {tenant.tier === 'trial' ? 'Token Uji Coba: ' : 'Kuota Terpakai: '}
                      <strong className={`font-mono ${isQuotaFull ? 'text-rose-400 font-bold' : 'text-white'}`}>
                        {tenant.reportsUsed}
                      </strong> / {tenant.reportsQuota === -1 ? 'Unlimited' : `${tenant.reportsQuota} Laporan`}
                      {tenant.tier === 'trial' && (
                        <span className="ml-1.5 text-amber-300 font-medium">
                          ({Math.max(0, 1 - tenant.reportsUsed)} token tersisa)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onNewReport}
                  disabled={isExpired || isSuspended || isQuotaFull}
                  className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                    isQuotaFull
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] cursor-pointer'
                  }`}
                  title={
                    isQuotaFull
                      ? 'Kuota laporan telah habis. Upgrade paket untuk membuat laporan baru.'
                      : 'Buat laporan baru'
                  }
                >
                  <Plus className="w-4 h-4" />
                  + Buat Laporan Commissioning Baru
                </button>
              </div>
            </div>
          </>
        )}

        {/* Reports Header & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div>
            <h3 className="text-lg font-bold text-white">Daftar Laporan Stasiun BSS</h3>
            <p className="text-xs text-slate-400">
              Formulir dan dokumentasi foto commissioning untuk unit swap station Anda di lapangan.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama stasiun atau lokasi..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p className="text-sm font-semibold">Belum ada laporan yang sesuai pencarian.</p>
              <button
                type="button"
                onClick={onNewReport}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Mulai Formulir Laporan Baru
              </button>
            </div>
          ) : (
            filteredReports.map((rep) => {
              const totalPhotos = 34;
              let filled = 0;
              Object.values(rep.bssVisual || {}).forEach((i) => i.imageData && filled++);
              Object.values(rep.simCardVisual || {}).forEach((i) => i.imageData && filled++);
              Object.values(rep.groundingVisual || {}).forEach((i) => i.imageData && filled++);
              Object.values(rep.kwhAndPanelVisual || {}).forEach((i) => i.imageData && filled++);
              Object.values(rep.cablesVisual || {}).forEach((i) => i.imageData && filled++);
              const pct = Math.round((filled / totalPhotos) * 100);
              const isSigned = Boolean(rep.approval?.preparedBy?.signatureImage);

              return (
                <div
                  key={rep.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-sm line-clamp-1">
                        {rep.generalInfo.plantName || 'Nama Stasiun Belum Diisi'}
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded shrink-0">
                        {rep.generalInfo.snChargerUnit || 'BSS-01'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Alamat: {rep.generalInfo.plantAddress || 'Alamat belum diatur'}
                    </p>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Kelengkapan Foto:</span>
                        <span className="font-mono text-white font-bold">
                          {filled} / {totalPhotos} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-500">Tanda Tangan BAST:</span>
                        <span
                          className={`font-semibold ${
                            isSigned ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isSigned ? 'Sudah Ditandatangani' : 'Belum Ditandatangani'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReportEditor(rep.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Buka & Edit Formulir
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPrintReport(rep)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors"
                      title="Pratinjau / Cetak Dokumen PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onCloneReport(rep.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-colors"
                      title="Kloning data stasiun baru"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const name = rep.generalInfo.plantName || 'stasiun ini';
                        if (confirm(`Yakin ingin menghapus laporan commissioning "${name}" secara permanen? Data yang dihapus tidak akan muncul kembali saat halaman di-refresh.`)) {
                          onDeleteReport(rep.id);
                        }
                      }}
                      className="p-2 bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-800 rounded-xl transition-colors"
                      title="Hapus laporan secara permanen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Feature Limits Modal */}
      {showLimitsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Batasan Fitur Paket Sewa Anda</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLimitsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Paket Sewa:</span>
                  <span className="font-bold text-white">{tenant.tierName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Masa Aktif:</span>
                  <span className="font-bold text-white">s/d {tenant.endDate} ({daysLeft} hari lagi)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kuota Laporan:</span>
                  <span className="font-bold text-white">
                    {tenant.reportsUsed} / {tenant.reportsQuota === -1 ? 'Unlimited' : `${tenant.reportsQuota} Laporan`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">Ekspor Dokumen PDF BAST Resmi</span>
                  {tenant.features.canExportPdf ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-500 font-bold rounded">
                      Terkunci (Mode Draf)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">White-Label (Kustom Logo Vendor & PIC)</span>
                  {tenant.features.canWhiteLabel ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-500 font-bold rounded">
                      Terkunci (Paket Pro)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">Download ZIP Arsip Seluruh Foto HD</span>
                  {tenant.features.canExportZip ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-500 font-bold rounded">
                      Terkunci (Paket Pro)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-slate-300">Evaluasi PUIL & Grounding Gauge</span>
                  {tenant.features.canUseAuditTools ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-500 font-bold rounded">
                      Terkunci (Paket Pro)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLimitsModal(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLimitsModal(false);
                    handleContactSellerWA();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Upgrade Fitur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
