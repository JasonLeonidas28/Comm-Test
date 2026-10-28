import React, { useState } from 'react';
import { RentalTenant, RentalTier, DEFAULT_TIER_FEATURES } from '../types/rental';
import { saveRentalTenant } from '../utils/rentalStorage';
import { saveTenantToFirestore } from '../firebase/tenantService';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  MapPin,
  Clock,
  Zap,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Crown,
  Lock,
} from 'lucide-react';

interface NewCustomerOnboardingModalProps {
  isOpen: boolean;
  userEmail: string;
  userDisplayName?: string;
  userUid?: string;
  onComplete: (tenant: RentalTenant) => void;
  onCancel: () => void;
}

export const NewCustomerOnboardingModal: React.FC<NewCustomerOnboardingModalProps> = ({
  isOpen,
  userEmail,
  userDisplayName = '',
  userUid = '',
  onComplete,
  onCancel,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [picName, setPicName] = useState(userDisplayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedTier, setSelectedTier] = useState<RentalTier>('trial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Auto-fill shortCode suggestion when typing company name
  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    if (!shortCode || shortCode.length <= 4) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      let autoCode = '';
      if (words.length >= 2) {
        // e.g. "PT Banyu Mas Satria" -> "BMS"
        const relevantWords = words.filter((w) => !['pt', 'cv', 'ud', 'tbk'].includes(w.toLowerCase()));
        autoCode = relevantWords.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
      } else if (words.length === 1 && words[0].length >= 3) {
        autoCode = words[0].slice(0, 3).toUpperCase();
      }
      if (autoCode) {
        setShortCode(autoCode);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!companyName.trim()) {
      setErrorMessage('Nama perusahaan atau kontraktor wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Nomor WhatsApp PIC wajib diisi untuk koordinasi & invoice.');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const durationDays = selectedTier === 'trial' ? 7 : 30;
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + durationDays);
      const endDateStr = endDate.toISOString().split('T')[0];

      const cleanCode = (shortCode.trim() || companyName.slice(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const tenantId = `tenant-${Date.now()}`;

      const tierConfig = DEFAULT_TIER_FEATURES[selectedTier];

      const newTenant: RentalTenant = {
        id: tenantId,
        companyName: companyName.trim(),
        shortCode: cleanCode || 'BSS',
        email: userEmail.toLowerCase().trim(),
        picName: picName.trim() || userDisplayName || 'PIC Pelaksana',
        phone: phone.trim(),
        address: address.trim() || 'Indonesia',
        tier: selectedTier,
        tierName: tierConfig.name,
        status: 'active',
        rentalFeeMonthly: tierConfig.price,
        paymentStatus: selectedTier === 'trial' ? 'paid' : 'pending',
        startDate: todayStr,
        endDate: endDateStr,
        // Free trial gets exactly 1 token; paid packages get their full quota upon payment approval or 1 token trial right away
        reportsQuota: selectedTier === 'trial' ? 1 : tierConfig.quota,
        reportsUsed: 0,
        features: { ...tierConfig.features },
        brandColor: 'emerald',
        reportPrefix: `${cleanCode || 'BSS'}-COMM`,
        notes: `Pendaftaran baru via portal. Paket dipilih: ${tierConfig.name}`,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      };

      // 1. Save to local storage
      saveRentalTenant(newTenant);

      // 2. Persist to Firestore Cloud Database
      await saveTenantToFirestore(newTenant);

      // 3. Complete onboarding
      onComplete(newTenant);
    } catch (err: any) {
      console.error('Error during customer onboarding:', err);
      setErrorMessage(err?.message || 'Gagal menyimpan profil pelanggan baru. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactAdminWA = () => {
    const tierName = DEFAULT_TIER_FEATURES[selectedTier].name;
    const priceFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
      DEFAULT_TIER_FEATURES[selectedTier].price
    );
    const text = encodeURIComponent(
      `Halo Pengelola VoltCheck System,\n\nSaya ${picName || userDisplayName} dari ${companyName || 'Perusahaan Baru'} ingin mendaftar dan berlangganan:\n` +
      `• Paket: ${tierName} (${priceFormatted})\n` +
      `• Email Terdaftar: ${userEmail}\n` +
      `• No. WhatsApp: ${phone}\n\n` +
      `Mohon info instruksi pembayaran / aktivasi kuota. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-fade-in my-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-6 border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Registrasi Pelanggan Baru & Aktivasi Layanan
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VoltCheck BSS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lengkapi profil perusahaan kontraktor Anda dan tentukan paket layanan untuk mulai membuat laporan.
              </p>
            </div>
          </div>

          <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Akun Terhubung: <strong>{userEmail}</strong></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Profil Perusahaan */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 1. Data Perusahaan & Kontak PIC
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Perusahaan / Kontraktor Lapangan <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    placeholder="Contoh: PT Banyu Mas Satria"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Singkatan / Inisial Stasiun (Prefix) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: BMS"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Maksimal 4-5 huruf (digunakan pada nomor laporan)</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama PIC / Penanggung Jawab Lapangan <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.T."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nomor WhatsApp PIC <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alamat Kantor / Workshop
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Industri Raya No. 12, Jakarta Timur"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pilihan Paket Layanan */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> 2. Pilih Paket Langganan Aplikasi
              </h3>
              <span className="text-[11px] text-slate-400">
                Pilih <strong>Free Trial (1 Token)</strong> untuk mencoba tanpa biaya.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Card 1: Free Trial (1 Token) */}
              <div
                onClick={() => setSelectedTier('trial')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedTier === 'trial'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                  Coba Gratis
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">Free Trial</span>
                    {selectedTier === 'trial' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <div className="mt-2">
                    <div className="text-lg font-black text-white">Rp 0</div>
                    <span className="text-[10px] text-slate-400">Aktif 7 Hari</span>
                  </div>

                  <div className="mt-3 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                    <span className="text-xs font-black text-emerald-300 block">1 Token Laporan</span>
                    <span className="text-[9px] text-slate-400">1 Laporan Stasiun BSS</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[10px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Dokumentasi 34+ Foto</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Evaluasi PUIL & Grounding</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Pratinjau & Cetak PDF BAST</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-semibold text-center">
                  Langsung Aktif Instan!
                </div>
              </div>

              {/* Card 2: Starter Surveyor */}
              <div
                onClick={() => setSelectedTier('starter')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'starter'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Starter</span>
                    {selectedTier === 'starter' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <div className="mt-2">
                    <div className="text-base font-black text-white">Rp 350.000</div>
                    <span className="text-[10px] text-slate-400">per bulan (30 hari)</span>
                  </div>

                  <div className="mt-3 p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs font-black text-white block">5 Laporan / bln</span>
                    <span className="text-[9px] text-slate-400">Kuota 5 Stasiun BSS</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[10px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>5 Laporan Commissioning</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Audit Kelengkapan Foto</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Scanner Barcode & GPS</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 3: Pro Commissioning (Popular) */}
              <div
                onClick={() => setSelectedTier('pro')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedTier === 'pro'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                  Populer
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Pro Vendor</span>
                    {selectedTier === 'pro' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <div className="mt-2">
                    <div className="text-base font-black text-white">Rp 850.000</div>
                    <span className="text-[10px] text-slate-400">per bulan (30 hari)</span>
                  </div>

                  <div className="mt-3 p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs font-black text-white block">20 Laporan / bln</span>
                    <span className="text-[9px] text-slate-400">Kuota 20 Stasiun BSS</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[10px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Kustom Logo Kop Surat Sendiri</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Download ZIP Foto Lengkap</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>PDF Resmi Bebas Watermark</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 4: Enterprise Unlimited */}
              <div
                onClick={() => setSelectedTier('enterprise')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'enterprise'
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Enterprise</span>
                    {selectedTier === 'enterprise' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <div className="mt-2">
                    <div className="text-base font-black text-white">Rp 2.500.000</div>
                    <span className="text-[10px] text-slate-400">per bulan</span>
                  </div>

                  <div className="mt-3 p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-xs font-black text-white block">Unlimited</span>
                    <span className="text-[9px] text-slate-400">Laporan Tanpa Batas</span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-[10px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Semua Fitur Pro</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Multi-Team Lapangan</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Prioritas Support 24/7</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Paid Tier Notice & WA Payment option */}
          {selectedTier !== 'trial' && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Konfirmasi Pembayaran Paket Berbayar
                </span>
                <button
                  type="button"
                  onClick={handleContactAdminWA}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Hubungi Pengelola via WA
                </button>
              </div>
              <p className="text-slate-400 text-[11px]">
                Untuk paket {DEFAULT_TIER_FEATURES[selectedTier].name}, akun Anda akan langsung aktif dengan <strong>1 Token Free Trial</strong> untuk inspeksi pertama saat menunggu verifikasi pembayaran oleh Admin.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Batal & Keluar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/20 flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>
                {isSubmitting
                  ? 'Mendaftarkan Akun...'
                  : selectedTier === 'trial'
                  ? 'Aktivasi Free Trial (1 Token) & Mulai'
                  : 'Daftar & Mulai dengan Free Trial'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
