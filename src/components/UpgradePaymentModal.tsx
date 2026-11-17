import React, { useState, useEffect } from 'react';
import {
  RentalTenant,
  RentalTier,
  DEFAULT_TIER_FEATURES,
  SellerSettings,
  PaymentRequest,
} from '../types/rental';
import {
  getLocalSellerSettings,
  getSellerSettingsFromFirestore,
  subscribeToSellerSettings,
  compressBillingImage,
  createOrUpdatePaymentRequest,
  formatWhatsappNumber,
} from '../firebase/billingService';
import {
  X,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertCircle,
  Send,
} from 'lucide-react';

interface UpgradePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: RentalTenant;
  onSubmitted?: (req: PaymentRequest) => void;
}

const PAID_TIERS: Array<'starter' | 'pro' | 'enterprise'> = ['starter', 'pro', 'enterprise'];

export const UpgradePaymentModal: React.FC<UpgradePaymentModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSubmitted,
}) => {
  const [sellerSettings, setSellerSettings] = useState<SellerSettings>(() => getLocalSellerSettings());
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>(() => {
    if (tenant.tier === 'starter' || tenant.tier === 'pro' || tenant.tier === 'enterprise') {
      return tenant.tier;
    }
    return 'pro';
  });
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [senderBankOrName, setSenderBankOrName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<PaymentRequest | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getSellerSettingsFromFirestore().then(setSellerSettings).catch(() => {});
    const unsub = subscribeToSellerSettings((updated) => setSellerSettings(updated));
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const tierConfig = DEFAULT_TIER_FEATURES[selectedTier];
  let discPct = 0;
  if (durationMonths === 3) discPct = 5;
  if (durationMonths === 6) discPct = 10;
  if (durationMonths === 12) discPct = 20;

  const rawTotal = tierConfig.price * durationMonths;
  const totalAmount = Math.round(rawTotal - (rawTotal * discPct) / 100);
  const requestType =
    tenant.tier === 'trial'
      ? 'upgrade'
      : tenant.tier === selectedTier
      ? 'renewal'
      : 'upgrade';

  const handleCopy = (label: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setIsCompressing(true);
    try {
      const compressed = await compressBillingImage(file, 1000, 0.72);
      setProofImage(compressed);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses gambar bukti transfer.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!senderBankOrName.trim()) {
      setErrorMessage('Mohon isi nama pengirim / bank asal transfer.');
      return;
    }
    if (!proofImage) {
      setErrorMessage('Mohon unggah foto atau screenshot bukti transfer terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const newReq: PaymentRequest = {
        id: `pay-${Date.now()}`,
        tenantId: tenant.id,
        companyName: tenant.companyName,
        shortCode: tenant.shortCode || 'BSS',
        picName: tenant.picName,
        phone: tenant.phone,
        email: tenant.email,
        requestType,
        currentTier: tenant.tier,
        requestedTier: selectedTier,
        requestedTierName: tierConfig.name,
        durationMonths,
        amount: totalAmount,
        senderBankOrName: senderBankOrName.trim(),
        proofImage,
        notes: notes.trim(),
        status: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const saved = await createOrUpdatePaymentRequest(newReq);
      setSubmittedSuccess(saved);
      if (onSubmitted) onSubmitted(saved);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengirim bukti pembayaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWA = (req?: PaymentRequest) => {
    const adminWa = formatWhatsappNumber(sellerSettings.adminWhatsapp);
    const msg = encodeURIComponent(
      `Halo ${sellerSettings.businessName || 'Admin VoltCheck'},\n\n` +
        `Saya dari *${tenant.companyName}* (${tenant.shortCode}) telah mengirim bukti pembayaran sewa / upgrade paket:\n` +
        `• Paket Dipilih: ${tierConfig.name}\n` +
        `• Durasi: ${durationMonths} Bulan\n` +
        `• Total Transfer: Rp ${totalAmount.toLocaleString('id-ID')}\n` +
        (req?.senderBankOrName ? `• Pengirim: ${req.senderBankOrName}\n` : '') +
        (req?.id ? `• ID Transaksi: ${req.id}\n` : '') +
        `\nMohon dicek dan di-ACC pada Dashboard Admin. Terima kasih!`
    );
    window.open(`https://wa.me/${adminWa}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Upgrade Paket & Upload Bukti Pembayaran
              </h2>
              <p className="text-xs text-slate-400">
                {tenant.companyName} • Paket saat ini: <strong className="text-emerald-400">{tenant.tierName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Bukti Pembayaran Berhasil Dikirim!</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                Pengajuan untuk paket <strong className="text-emerald-300">{submittedSuccess.requestedTierName} ({submittedSuccess.durationMonths} Bulan)</strong> sebesar{' '}
                <strong className="text-white">Rp {submittedSuccess.amount.toLocaleString('id-ID')}</strong> sedang menunggu konfirmasi Admin. Kuota & masa aktif akan langsung bertambah otomatis setelah di-ACC.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleOpenWA(submittedSuccess)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Konfirmasi Cepat via WhatsApp Admin
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Select Package & Duration */}
            <div className="space-y-3">
              <h3 className="font-black uppercase tracking-wider text-emerald-400 text-[11px]">
                1. Pilih Paket & Durasi Langganan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PAID_TIERS.map((tierKey) => {
                  const conf = DEFAULT_TIER_FEATURES[tierKey];
                  const isSelected = selectedTier === tierKey;
                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setSelectedTier(tierKey)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{conf.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="text-base font-black text-emerald-300 mt-1">
                          Rp {conf.price.toLocaleString('id-ID')}
                          <span className="text-[10px] font-normal text-slate-400"> / bln</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                        Kuota: <strong>{conf.quota === -1 ? 'Unlimited' : `${conf.quota} Laporan/bln`}</strong>
                        {conf.features.canWhiteLabel ? ' • White-Label Logo & ZIP' : ' • Fitur Standar'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { m: 1, label: '1 Bulan', disc: '' },
                  { m: 3, label: '3 Bulan', disc: 'Hemat 5%' },
                  { m: 6, label: '6 Bulan', disc: 'Hemat 10%' },
                  { m: 12, label: '12 Bulan', disc: 'Hemat 20%' },
                ].map((opt) => (
                  <button
                    key={opt.m}
                    type="button"
                    onClick={() => setDurationMonths(opt.m)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      durationMonths === opt.m
                        ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>{opt.label}</div>
                    {opt.disc && <div className="text-[10px] text-emerald-400 font-bold">{opt.disc}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Seller Bank Accounts & Total */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Tagihan Transfer:</span>
                  <span className="text-xl font-black text-emerald-400">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                  {discPct > 0 && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                      Diskon {discPct}% diterapkan
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenWA()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Tanya Admin via WA
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Primary Bank */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Rekening Utama ({sellerSettings.bankPrimaryName || 'Bank'})
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-sm text-white select-all">
                      {sellerSettings.bankPrimaryAccount || '-'}
                    </span>
                    {sellerSettings.bankPrimaryAccount && (
                      <button
                        type="button"
                        onClick={() => handleCopy('bank1', sellerSettings.bankPrimaryAccount)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAccount === 'bank1' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Salin
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    a/n <strong className="text-slate-200">{sellerSettings.bankPrimaryHolder || '-'}</strong>
                  </div>
                </div>

                {/* Secondary Bank if configured */}
                {sellerSettings.bankSecondaryAccount && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Rekening Alternatif ({sellerSettings.bankSecondaryName || 'Bank'})
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-sm text-white select-all">
                        {sellerSettings.bankSecondaryAccount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('bank2', sellerSettings.bankSecondaryAccount || '')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAccount === 'bank2' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Salin
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      a/n <strong className="text-slate-200">{sellerSettings.bankSecondaryHolder || '-'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {sellerSettings.qrisImage && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
                  <img
                    src={sellerSettings.qrisImage}
                    alt="QRIS Pembayaran"
                    className="w-24 h-24 object-contain bg-white rounded-lg p-1 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-white text-xs">Scan QRIS Resmi {sellerSettings.businessName}</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Anda juga dapat scan kode QRIS di samping menggunakan aplikasi e-Wallet atau Mobile Banking.
                    </p>
                  </div>
                </div>
              )}

              {sellerSettings.paymentNotes && (
                <p className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2">
                  ℹ️ {sellerSettings.paymentNotes}
                </p>
              )}
            </div>

            {/* Step 3: Upload Bukti Transfer */}
            <div className="space-y-3">
              <h3 className="font-black uppercase tracking-wider text-emerald-400 text-[11px]">
                2. Unggah Bukti Transfer Pembayaran
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Pengirim / Bank Asal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={senderBankOrName}
                    onChange={(e) => setSenderBankOrName(e.target.value)}
                    placeholder="Contoh: BCA a/n PT Banyu Mas Satria"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Transfer via m-BCA jam 14:20"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Foto / Screenshot Bukti Transfer <span className="text-rose-400">*</span>
                </label>
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-950/60 cursor-pointer transition-colors">
                  {isCompressing ? (
                    <span className="text-slate-400">Mengompresi gambar bukti transfer...</span>
                  ) : proofImage ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                      <img
                        src={proofImage}
                        alt="Preview Bukti Transfer"
                        className="w-28 h-28 object-cover rounded-xl border border-slate-700"
                      />
                      <div className="text-center sm:text-left">
                        <div className="text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Bukti transfer siap dikirim
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Klik kotak ini jika ingin mengganti foto bukti transfer.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1.5 py-2">
                      <Upload className="w-7 h-7 text-emerald-400 mx-auto" />
                      <div className="font-bold text-slate-200">Klik untuk pilih foto / screenshot bukti bayar</div>
                      <div className="text-[11px] text-slate-500">Format JPG / PNG — Otomatis terkompresi</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim Bukti...' : 'Kirim Bukti Pembayaran'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
