import React, { useState } from 'react';
import { RentalTenant, AuthSession } from '../types/rental';
import { getDaysRemaining } from '../utils/rentalStorage';
import {
  Clock,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Lock,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Info,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TenantRentalBannerProps {
  session: AuthSession;
  tenant?: RentalTenant;
  onOpenLogin: () => void;
  onSwitchToOwner?: () => void;
}

export const TenantRentalBanner: React.FC<TenantRentalBannerProps> = ({
  session,
  tenant,
  onOpenLogin,
  onSwitchToOwner,
}) => {
  const [showLimitsModal, setShowLimitsModal] = useState(false);

  // If logged in as Owner, show subtle seller bar
  if (session.role === 'owner') {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 text-amber-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-amber-500/20 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase rounded">
            👑 Mode Penjual (Owner)
          </span>
          <span className="text-slate-300 font-medium hidden sm:inline">
            Anda sedang login sebagai Pemilik Platform / Penjual Sewa. Memiliki akses penuh ke seluruh fitur dan kontrol customer.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulasi Login Customer
          </button>
        </div>
      </div>
    );
  }

  // If logged in as Tenant
  if (!tenant) return null;

  const daysLeft = getDaysRemaining(tenant.endDate);
  const isExpired = tenant.status === 'expired' || daysLeft <= 0;
  const isSuspended = tenant.status === 'suspended';
  const quotaUsed = tenant.reportsUsed;
  const quotaTotal = tenant.reportsQuota;
  const isQuotaFull = quotaTotal !== -1 && quotaUsed >= quotaTotal;

  const handleContactSellerWA = () => {
    const cleanPhone = tenant.phone.replace(/[^0-9]/g, '');
    const phoneFormatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const message = encodeURIComponent(
      `Halo Pengelola V-Green System,\n\nSaya ingin konfirmasi perpanjangan sewa / upgrade fitur aplikasi:\n` +
        `• Perusahaan: ${tenant.companyName}\n` +
        `• Paket Sekarang: ${tenant.tierName}\n` +
        `• Sisa Waktu: ${daysLeft} hari\n\n` +
        `Mohon info rekening dan paket perpanjangan. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${message}`, '_blank');
  };

  return (
    <>
      <div
        className={`px-4 py-2 text-xs border-b shadow-sm transition-colors ${
          isSuspended || isExpired
            ? 'bg-rose-900 text-rose-100 border-rose-800'
            : daysLeft <= 7
            ? 'bg-amber-900/90 text-amber-100 border-amber-800'
            : 'bg-slate-900 text-slate-100 border-slate-800'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Tenant Identity & Package */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1 bg-white/10 rounded-md">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </span>
            <span className="font-bold text-white text-sm">{tenant.companyName}</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase rounded-full border border-emerald-500/30">
              {tenant.tierName}
            </span>

            {/* Countdown Days */}
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                isExpired || isSuspended
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : daysLeft <= 7
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold animate-pulse'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              {isSuspended
                ? 'Sewa Ditangguhkan'
                : isExpired
                ? 'Masa Sewa Telah Habis'
                : `Sisa Masa Sewa: ${daysLeft} Hari (s/d ${tenant.endDate})`}
            </span>

            {/* Quota info */}
            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-full ${
                isQuotaFull
                  ? 'bg-rose-500/40 text-rose-200 font-bold'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              Kuota: {quotaUsed}/{quotaTotal === -1 ? '∞ Unlimited' : `${quotaTotal} Laporan`}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setShowLimitsModal(true)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Batasan Fitur Paket
            </button>

            <button
              type="button"
              onClick={handleContactSellerWA}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Perpanjang / Hubungi Penjual
            </button>

            {session.impersonatedByOwner ? (
              <button
                type="button"
                onClick={onSwitchToOwner}
                className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 flex items-center gap-1 transition-colors"
              >
                Kembali ke Mode Penjual
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-2 py-1 text-slate-400 hover:text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="Ganti Akun atau Login Penjual"
              >
                <LogOut className="w-3.5 h-3.5" />
                Ganti Akun
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Limits Modal for Tenant */}
      {showLimitsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Hak Akses & Batasan Fitur Anda</h3>
                  <p className="text-xs text-slate-300">
                    {tenant.companyName} • {tenant.tierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLimitsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <LogOut className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Masa Berlaku Sewa:</span>
                  <span className="font-bold text-slate-800">Sampai {tenant.endDate} ({daysLeft} hari lagi)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Kuota Laporan Terpakai:</span>
                  <span className="font-bold text-slate-800">
                    {quotaUsed} / {quotaTotal === -1 ? 'Unlimited' : `${quotaTotal} Laporan`}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                  Status Izin Fitur Aplikasi:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-medium text-slate-700">Export / Cetak Dokumen PDF Resmi BAST</span>
                    {tenant.features.canExportPdf ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Terkunci (Draft Mode)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-medium text-slate-700">White-Label (Ganti Logo Perusahaan & Tanda Tangan)</span>
                    {tenant.features.canWhiteLabel ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Terkunci (Default V-Green)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-medium text-slate-700">Download Arsip File ZIP Seluruh Foto HD</span>
                    {tenant.features.canExportZip ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Terkunci (Paket Pro)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-medium text-slate-700">Evaluasi Kelistrikan PUIL & Grounding Gauge</span>
                    {tenant.features.canUseAuditTools ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Terkunci (Paket Pro)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-medium text-slate-700">Modul Punchlist & Catatan Temuan Lapangan</span>
                    {tenant.features.canUsePunchlist ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 font-bold rounded flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Terkunci
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLimitsModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLimitsModal(false);
                    handleContactSellerWA();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Upgrade Fitur via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
