import React, { useState, useMemo } from 'react';
import { RentalTenant, RentalTier, RentalStatus, TenantFeatures, DEFAULT_TIER_FEATURES } from '../types/rental';
import {
  getRentalTenants,
  saveRentalTenant,
  deleteRentalTenant,
  renewTenantRental,
  toggleTenantStatus,
  getDaysRemaining,
} from '../utils/rentalStorage';
import {
  X,
  Building2,
  Users,
  CreditCard,
  FileCheck2,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Phone,
  Mail,
  Edit2,
  Trash2,
  RefreshCw,
  MessageSquare,
  Lock,
  Unlock,
  Sliders,
  DollarSign,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface RentalDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonateTenant: (tenant: RentalTenant) => void;
}

export const RentalDashboardModal: React.FC<RentalDashboardModalProps> = ({
  isOpen,
  onClose,
  onImpersonateTenant,
}) => {
  const [tenants, setTenants] = useState<RentalTenant[]>(() => getRentalTenants());
  const [activeTab, setActiveTab] = useState<'tenants' | 'tiers' | 'invoice'>('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'suspended'>('all');

  // Modal State for Add / Edit Tenant
  const [editingTenant, setEditingTenant] = useState<RentalTenant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<RentalTenant | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Quick Action notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Invoice generator state
  const [selectedInvoiceTenantId, setSelectedInvoiceTenantId] = useState<string>('');
  const [invoiceMonths, setInvoiceMonths] = useState<number>(3);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const refreshTenants = () => {
    setTenants(getRentalTenants());
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalTenants = tenants.length;
    let activeTenants = 0;
    let expiringTenants = 0;
    let expiredTenants = 0;
    let totalMRR = 0;
    let totalReportsUsed = 0;

    tenants.forEach((t) => {
      const daysLeft = getDaysRemaining(t.endDate);
      totalReportsUsed += t.reportsUsed || 0;

      if (t.status === 'suspended') {
        // suspended
      } else if (t.status === 'expired' || daysLeft <= 0) {
        expiredTenants++;
      } else {
        activeTenants++;
        totalMRR += t.rentalFeeMonthly || 0;
        if (daysLeft <= 7) {
          expiringTenants++;
        }
      }
    });

    return {
      totalTenants,
      activeTenants,
      expiringTenants,
      expiredTenants,
      totalMRR,
      totalReportsUsed,
    };
  }, [tenants]);

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.includes(searchQuery) ||
        t.shortCode.toLowerCase().includes(searchQuery.toLowerCase());

      const daysLeft = getDaysRemaining(t.endDate);

      let matchStatus = true;
      if (statusFilter === 'active') {
        matchStatus = t.status === 'active' && daysLeft > 0;
      } else if (statusFilter === 'expiring') {
        matchStatus = t.status === 'active' && daysLeft > 0 && daysLeft <= 7;
      } else if (statusFilter === 'expired') {
        matchStatus = t.status === 'expired' || daysLeft <= 0;
      } else if (statusFilter === 'suspended') {
        matchStatus = t.status === 'suspended';
      }

      return matchSearch && matchStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  if (!isOpen) return null;

  // Handlers
  const handleRenew = (tenant: RentalTenant, days: number) => {
    renewTenantRental(tenant.id, days);
    refreshTenants();
    showToast(`Masa sewa ${tenant.companyName} berhasil diperpanjang +${days} hari!`);
  };

  const handleToggleSuspend = (tenant: RentalTenant) => {
    const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    toggleTenantStatus(tenant.id, nextStatus);
    refreshTenants();
    showToast(
      `Status sewa ${tenant.companyName} diubah menjadi: ${
        nextStatus === 'suspended' ? 'Ditangguhkan (Terkunci)' : 'Aktif Kembali'
      }`
    );
  };

  const handleDelete = (tenant: RentalTenant) => {
    setConfirmDeleteId(tenant.id);
  };

  const handleDirectDelete = (tenantId: string, companyName: string) => {
    deleteRentalTenant(tenantId);
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    setTenantToDelete(null);
    setConfirmDeleteId(null);
    setIsFormOpen(false);
    showToast(`Data penyewa "${companyName}" telah berhasil dihapus.`);
  };

  const handleConfirmDelete = () => {
    if (!tenantToDelete) return;
    handleDirectDelete(tenantToDelete.id, tenantToDelete.companyName);
  };

  const handleOpenWhatsAppReminder = (tenant: RentalTenant) => {
    const daysLeft = getDaysRemaining(tenant.endDate);
    const cleanPhone = tenant.phone.replace(/[^0-9]/g, '');
    const phoneFormatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const message = encodeURIComponent(
      `Halo Bapak/Ibu ${tenant.picName} (${tenant.companyName}),\n\n` +
        `Kami dari Pengelola Sistem Aplikasi Commissioning Test BSS ingin menginformasikan masa sewa aplikasi Anda:\n` +
        `• Paket: ${tenant.tierName}\n` +
        `• Jatuh Tempo: ${tenant.endDate} (${
          daysLeft <= 0 ? 'Sudah Jatuh Tempo' : `Sisa ${daysLeft} hari lagi`
        })\n` +
        `• Kuota Laporan: ${tenant.reportsUsed}/${tenant.reportsQuota === -1 ? 'Unlimited' : tenant.reportsQuota} terpakai\n\n` +
        `Untuk melanjutkan kelancaran inspeksi dan pembuatan laporan tim surveyor Anda di lapangan, silakan konfirmasi perpanjangan sewa melalui pesan ini.\n\n` +
        `Terima kasih!\nPengelola V-Green Commissioning System`
    );

    window.open(`https://wa.me/${phoneFormatted}?text=${message}`, '_blank');
  };

  const handleSaveTenantForm = (tenantData: RentalTenant) => {
    saveRentalTenant(tenantData);
    refreshTenants();
    setIsFormOpen(false);
    setEditingTenant(null);
    showToast(`Data penyewa "${tenantData.companyName}" berhasil disimpan!`);
  };

  const handleNewTenantClick = () => {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 30);

    const emptyTenant: RentalTenant = {
      id: `tenant-${Date.now()}`,
      companyName: '',
      shortCode: '',
      email: '',
      password: 'password123',
      picName: '',
      phone: '',
      address: '',
      tier: 'pro',
      tierName: 'Pro Commissioning',
      status: 'active',
      rentalFeeMonthly: 850000,
      paymentStatus: 'paid',
      startDate: today,
      endDate: end.toISOString().split('T')[0],
      reportsQuota: 20,
      reportsUsed: 0,
      features: { ...DEFAULT_TIER_FEATURES.pro.features },
      brandColor: 'emerald',
      reportPrefix: 'COMM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingTenant(emptyTenant);
    setIsFormOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-7xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-16 z-50 px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 border-b border-slate-700 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Shield className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight">Dashboard Pengelola Sewa (Owner / Seller Hub)</h1>
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-md">
                    👑 Penjual (Admin)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pusat kendali persewaan aplikasi: pantau customer, atur batasan fitur, masa sewa, kuota, dan penagihan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={handleNewTenantClick}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Customer Sewa Baru
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Tutup Dashboard"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Top SaaS KPI Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                <span>Customer Penyewa</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {metrics.activeTenants}
                <span className="text-xs text-slate-300 font-normal ml-1">/ {metrics.totalTenants} Total</span>
              </div>
              <div className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {metrics.activeTenants} Aktif Berlangganan
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                <span>Estimasi MRR (Pendapatan Bulanan)</span>
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                Rp {metrics.totalMRR.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Dari {metrics.activeTenants} kontrak sewa berjalan
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                <span>Total Laporan Dibuat</span>
                <FileCheck2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {metrics.totalReportsUsed}
                <span className="text-xs text-slate-300 font-normal ml-1">Laporan Commissioning</span>
              </div>
              <div className="text-[11px] text-blue-300 mt-1">
                Oleh seluruh surveyor di lapangan
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-slate-300 text-xs font-medium">
                <span>Perlu Perpanjangan Segera</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-300 mt-1">
                {metrics.expiringTenants + metrics.expiredTenants}
                <span className="text-xs text-slate-300 font-normal ml-1">Customer</span>
              </div>
              <div className="text-[11px] text-rose-300 mt-1">
                {metrics.expiringTenants} jatuh tempo &lt;7 hari, {metrics.expiredTenants} expired
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('tenants')}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'tenants'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Daftar Customer Penyewa ({tenants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tiers')}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'tiers'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Konfigurasi Paket & Batasan Fitur (Feature Gating)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoice')}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'invoice'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Generator Penawaran & Invoice Sewa WA
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama PT, PIC, no. telepon, atau kode..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({tenants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      statusFilter === 'active'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Aktif ({metrics.activeTenants})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('expiring')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      statusFilter === 'expiring'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Jatuh Tempo &lt;7 Hari ({metrics.expiringTenants})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('expired')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      statusFilter === 'expired'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Expired ({metrics.expiredTenants})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('suspended')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                      statusFilter === 'suspended'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Ditangguhkan
                  </button>
                </div>
              </div>

              {/* Tenants Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Nama Perusahaan / Penyewa</th>
                        <th className="py-3 px-3">Paket & Biaya Sewa</th>
                        <th className="py-3 px-3">Masa Berlaku Sewa</th>
                        <th className="py-3 px-3">Kuota Laporan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Batasan Fitur</th>
                        <th className="py-3 px-4 text-right">Aksi Penjual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTenants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            Tidak ada customer penyewa yang sesuai dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredTenants.map((t) => {
                          const daysLeft = getDaysRemaining(t.endDate);
                          const isExpired = t.status === 'expired' || daysLeft <= 0;
                          const isSuspended = t.status === 'suspended';

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Company Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-start gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                                    {t.shortCode || t.companyName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">{t.companyName}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                      <span>PIC: {t.picName}</span>
                                      <span>•</span>
                                      <span className="font-mono">{t.phone}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      Login: {t.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Tier & Fee */}
                              <td className="py-3.5 px-3">
                                <div>
                                  <span
                                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full mb-1 ${
                                      t.tier === 'enterprise'
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                        : t.tier === 'pro'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {t.tierName}
                                  </span>
                                  <div className="font-bold text-slate-800">
                                    Rp {t.rentalFeeMonthly.toLocaleString('id-ID')}{' '}
                                    <span className="text-[10px] font-normal text-slate-500">/bln</span>
                                  </div>
                                </div>
                              </td>

                              {/* Dates & Countdown */}
                              <td className="py-3.5 px-3">
                                <div className="space-y-0.5">
                                  <div
                                    className={`font-bold flex items-center gap-1 ${
                                      isSuspended
                                        ? 'text-slate-500'
                                        : isExpired
                                        ? 'text-rose-600'
                                        : daysLeft <= 7
                                        ? 'text-amber-600'
                                        : 'text-emerald-700'
                                    }`}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    {isSuspended
                                      ? 'Ditangguhkan'
                                      : isExpired
                                      ? 'Masa Sewa Habis'
                                      : `Sisa ${daysLeft} Hari`}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Sampai: <span className="font-mono">{t.endDate}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Reports Quota */}
                              <td className="py-3.5 px-3">
                                <div className="space-y-1">
                                  <div className="font-mono font-bold text-slate-800">
                                    {t.reportsUsed} /{' '}
                                    {t.reportsQuota === -1 ? 'Unlimited (∞)' : `${t.reportsQuota} Lap.`}
                                  </div>
                                  {t.reportsQuota !== -1 && (
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          t.reportsUsed >= t.reportsQuota
                                            ? 'bg-rose-500'
                                            : t.reportsUsed / t.reportsQuota > 0.8
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            Math.round((t.reportsUsed / t.reportsQuota) * 100)
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    isSuspended
                                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                      : isExpired
                                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                >
                                  {isSuspended ? (
                                    <>
                                      <Lock className="w-3 h-3" />
                                      Terkunci
                                    </>
                                  ) : isExpired ? (
                                    <>
                                      <AlertTriangle className="w-3 h-3" />
                                      Expired
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Aktif
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* Feature Limitations Tags */}
                              <td className="py-3.5 px-3">
                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                  <span
                                    title="White-label Logo Sendiri"
                                    className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                                      t.features.canWhiteLabel
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-400 line-through'
                                    }`}
                                  >
                                    Logo
                                  </span>
                                  <span
                                    title="Export PDF BAST"
                                    className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                                      t.features.canExportPdf
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-400 line-through'
                                    }`}
                                  >
                                    PDF
                                  </span>
                                  <span
                                    title="Download ZIP Semua Foto"
                                    className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                                      t.features.canExportZip
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-400 line-through'
                                    }`}
                                  >
                                    ZIP
                                  </span>
                                  <span
                                    title="Audit Kelistrikan PUIL"
                                    className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                                      t.features.canUseAuditTools
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-400 line-through'
                                    }`}
                                  >
                                    PUIL
                                  </span>
                                </div>
                              </td>

                              {/* Actions for Seller */}
                              <td className="py-3.5 px-4 text-right">
                                {confirmDeleteId === t.id ? (
                                  <div className="inline-flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-300 rounded-xl shadow-md animate-fade-in">
                                    <span className="text-[11px] text-rose-800 font-bold px-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                      Hapus {t.shortCode}?
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDirectDelete(t.id, t.companyName)}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
                                      title="Konfirmasi hapus akun permanen"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Ya, Hapus
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    {/* Impersonate / Switch to this tenant */}
                                    <button
                                      type="button"
                                      onClick={() => onImpersonateTenant(t)}
                                      title="Masuk sebagai penyewa ini (Lihat batasan fiturnya)"
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-emerald-200 transition-colors"
                                    >
                                      <Zap className="w-3 h-3 text-emerald-600" />
                                      Masuk Akun Ini
                                    </button>

                                    {/* Quick Renew +30 Days */}
                                    <button
                                      type="button"
                                      onClick={() => handleRenew(t, 30)}
                                      title="Perpanjang +30 Hari"
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-blue-200 transition-colors"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      +30H
                                    </button>

                                    {/* WhatsApp Reminder */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenWhatsAppReminder(t)}
                                      title="Kirim pengingat tagihan/salam via WhatsApp"
                                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Edit settings */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTenant(t);
                                        setIsFormOpen(true);
                                      }}
                                      title="Edit data dan batasan fitur"
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Toggle Suspend */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSuspend(t)}
                                      title={isSuspended ? 'Buka Kunci' : 'Tangguhkan Akun'}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        isSuspended
                                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {isSuspended ? (
                                        <Unlock className="w-3.5 h-3.5" />
                                      ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDeleteId(t.id);
                                        setTenantToDelete(t);
                                      }}
                                      title="Hapus data penyewa"
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Feature Gating & Tier Matrix */}
          {activeTab === 'tiers' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  Konsep Batasan Fitur (*Feature Gating Matrix*) untuk Bisnis Sewa
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Sebagai penjual, Anda dapat menentukan hak akses tiap customer berdasarkan paket yang mereka sewa. Saat customer login, tombol atau menu yang terkunci akan otomatis dinonaktifkan atau memunculkan pemberitahuan paket sewa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Starter Tier */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                        Paket Dasar
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Starter</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mt-2">Starter Surveyor</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cocok untuk surveyor independen atau uji coba proyek skala kecil (1 lokasi).
                    </p>
                    <div className="text-2xl font-black text-slate-900 mt-3">
                      Rp 350.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Maksimal <strong>5 Laporan</strong> / bulan</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Ekspor & Cetak PDF Standar</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Kamera & Geotagging GPS</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="line-through">White-Label Logo Perusahaan Sendiri</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="line-through">Download ZIP Seluruh Foto</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="line-through">Evaluasi PUIL & Grounding Gauge</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tier (Best Seller) */}
                <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-md flex flex-col justify-between relative">
                  <div className="absolute -top-3 right-5 px-3 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-sm">
                    Paling Diminati
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                        Paket Vendor
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Pro</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mt-2">Pro Commissioning</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilihan standar kontraktor instalasi dan vendor commissioning resmi.
                    </p>
                    <div className="text-2xl font-black text-slate-900 mt-3">
                      Rp 850.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Maksimal <strong>20 Laporan</strong> / bulan</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>White-Label</strong> Logo & PIC Tanda Tangan</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Download <strong>ZIP Foto HD</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Banner <strong>Evaluasi PUIL & Grounding</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Modul <strong>Punchlist</strong> & Checklist</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enterprise Tier */}
                <div className="bg-white rounded-2xl border-2 border-purple-300 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">
                        Korporat / EPC
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Enterprise</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mt-2">Enterprise Unlimited</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Untuk perusahaan EPC dengan puluhan stasiun swap baterai bulanan.
                    </p>
                    <div className="text-2xl font-black text-slate-900 mt-3">
                      Rp 2.500.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>Unlimited Laporan (Tanpa Batas Kuota)</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Seluruh Fitur Pro Aktif Penuh</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Dukungan Teknis Prioritas WA 24/7</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Custom Template Logo Client</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Invoice & Quotation Generator */}
          {activeTab === 'invoice' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Generator Penawaran & Invoice Sewa via WhatsApp
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pilih penyewa dan buat draf tagihan/penawaran sewa otomatis siap kirim.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Customer Penyewa
                    </label>
                    <select
                      value={selectedInvoiceTenantId || (tenants[0]?.id ?? '')}
                      onChange={(e) => setSelectedInvoiceTenantId(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.companyName} ({t.tierName} - Rp {t.rentalFeeMonthly.toLocaleString('id-ID')}/bln)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Durasi Penagihan Sewa
                    </label>
                    <select
                      value={invoiceMonths}
                      onChange={(e) => setInvoiceMonths(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    >
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan (Diskon 5%)</option>
                      <option value={6}>6 Bulan (Diskon 10%)</option>
                      <option value={12}>12 Bulan / 1 Tahun (Diskon 20%)</option>
                    </select>
                  </div>
                </div>

                {/* Generated Text Preview */}
                {(() => {
                  const targetTenant =
                    tenants.find((t) => t.id === selectedInvoiceTenantId) || tenants[0];
                  if (!targetTenant) return null;

                  const monthlyFee = targetTenant.rentalFeeMonthly;
                  let discountPercent = 0;
                  if (invoiceMonths === 3) discountPercent = 5;
                  if (invoiceMonths === 6) discountPercent = 10;
                  if (invoiceMonths === 12) discountPercent = 20;

                  const rawTotal = monthlyFee * invoiceMonths;
                  const discountAmount = (rawTotal * discountPercent) / 100;
                  const finalTotal = rawTotal - discountAmount;

                  const invoiceText =
                    `*INVOICE PERSEWAAN APLIKASI COMMISSIONING TEST BSS*\n` +
                    `No. Inv: INV-SEWA-${targetTenant.shortCode}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}\n` +
                    `Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\n\n` +
                    `Kepada Yth,\n` +
                    `*${targetTenant.companyName}*\n` +
                    `Attn: Bpk/Ibu ${targetTenant.picName}\n` +
                    `WhatsApp: ${targetTenant.phone}\n\n` +
                    `Berikut rincian biaya sewa lisensi aplikasi:\n` +
                    `----------------------------------------\n` +
                    `• Paket: ${targetTenant.tierName}\n` +
                    `• Durasi Sewa: ${invoiceMonths} Bulan\n` +
                    `• Kuota Laporan: ${targetTenant.reportsQuota === -1 ? 'Unlimited' : `${targetTenant.reportsQuota} lap/bulan`}\n` +
                    `• Biaya / Bulan: Rp ${monthlyFee.toLocaleString('id-ID')}\n` +
                    (discountPercent > 0 ? `• Diskon Paket (${discountPercent}%): -Rp ${discountAmount.toLocaleString('id-ID')}\n` : '') +
                    `----------------------------------------\n` +
                    `*TOTAL PEMBAYARAN: Rp ${finalTotal.toLocaleString('id-ID')}*\n\n` +
                    `Pembayaran dapat ditransfer ke rekening resmi kami:\n` +
                    `Bank BCA: 123-456-7890 a/n PT V-Green Sistem Mandiri\n` +
                    `Bank Mandiri: 987-00-1234567-8 a/n PT V-Green Sistem Mandiri\n\n` +
                    `Setelah transfer, mohon kirim bukti pembayaran agar masa aktif aplikasi otomatis diperpanjang.\n\n` +
                    `Terima kasih atas kerja samanya!`;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Draf Pesan WhatsApp:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(invoiceText);
                              setCopiedInvoice(true);
                              setTimeout(() => setCopiedInvoice(false), 2000);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            {copiedInvoice ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Tersalin!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Salin Teks
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = targetTenant.phone.replace(/[^0-9]/g, '');
                              const phoneFormatted = cleanPhone.startsWith('0')
                                ? '62' + cleanPhone.slice(1)
                                : cleanPhone;
                              window.open(
                                `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(invoiceText)}`,
                                '_blank'
                              );
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Kirim ke WhatsApp Penyewa
                          </button>
                        </div>
                      </div>

                      <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-700">
                        {invoiceText}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Edit / Add Tenant Modal Sub-Component */}
        {isFormOpen && editingTenant && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">
                    {editingTenant.companyName ? `Edit Penyewa: ${editingTenant.companyName}` : 'Daftarkan Customer Sewa Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Vendor</label>
                    <input
                      type="text"
                      required
                      value={editingTenant.companyName}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, companyName: e.target.value })
                      }
                      placeholder="PT Sinar Energi Mandiri"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Singkat (Prefix)</label>
                    <input
                      type="text"
                      required
                      value={editingTenant.shortCode}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, shortCode: e.target.value.toUpperCase() })
                      }
                      placeholder="SEM"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama PIC Lapangan</label>
                    <input
                      type="text"
                      value={editingTenant.picName}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, picName: e.target.value })
                      }
                      placeholder="Budi Santoso"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No WhatsApp</label>
                    <input
                      type="text"
                      value={editingTenant.phone}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, phone: e.target.value })
                      }
                      placeholder="0812-3456-7890"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Login</label>
                    <input
                      type="email"
                      value={editingTenant.email}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, email: e.target.value })
                      }
                      placeholder="budi@sinarenergi.com"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Package & Rental Settings */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    Paket Sewa & Durasi Lisensi
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Paket Sewa</label>
                      <select
                        value={editingTenant.tier}
                        onChange={(e) => {
                          const tier = e.target.value as RentalTier;
                          const tierConf = DEFAULT_TIER_FEATURES[tier];
                          setEditingTenant({
                            ...editingTenant,
                            tier,
                            tierName: tierConf.name,
                            rentalFeeMonthly: tierConf.price,
                            reportsQuota: tierConf.quota,
                            features: { ...tierConf.features },
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="starter">Starter Surveyor (Rp 350.000)</option>
                        <option value="pro">Pro Commissioning (Rp 850.000)</option>
                        <option value="enterprise">Enterprise Unlimited (Rp 2.500.000)</option>
                        <option value="custom">Paket Kustom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Biaya Sewa / Bulan (Rp)</label>
                      <input
                        type="number"
                        value={editingTenant.rentalFeeMonthly}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            rentalFeeMonthly: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kuota Laporan (-1 = Unlimited)
                      </label>
                      <input
                        type="number"
                        value={editingTenant.reportsQuota}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            reportsQuota: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Sewa</label>
                      <input
                        type="date"
                        value={editingTenant.startDate}
                        onChange={(e) =>
                          setEditingTenant({ ...editingTenant, startDate: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                      <input
                        type="date"
                        value={editingTenant.endDate}
                        onChange={(e) =>
                          setEditingTenant({ ...editingTenant, endDate: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status Sewa</label>
                      <select
                        value={editingTenant.status}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            status: e.target.value as RentalStatus,
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="active">Aktif</option>
                        <option value="trial">Masa Percobaan (Trial)</option>
                        <option value="expired">Masa Sewa Habis (Expired)</option>
                        <option value="suspended">Ditangguhkan / Terkunci</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Feature Gating Checklist */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Izin Fitur Khusus (Feature Gating)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTenant.features.canExportPdf}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            features: {
                              ...editingTenant.features,
                              canExportPdf: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Cetak & Export PDF Resmi</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTenant.features.canWhiteLabel}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            features: {
                              ...editingTenant.features,
                              canWhiteLabel: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>White-Label (Ganti Logo & TTD Sendiri)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTenant.features.canExportZip}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            features: {
                              ...editingTenant.features,
                              canExportZip: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Download File ZIP Seluruh Foto</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTenant.features.canUseAuditTools}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            features: {
                              ...editingTenant.features,
                              canUseAuditTools: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Evaluasi Kelistrikan PUIL & Grounding</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTenant.features.canUsePunchlist}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            features: {
                              ...editingTenant.features,
                              canUsePunchlist: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Modul Punchlist & Catatan Temuan</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTenant.features.canUseBarcodeScanner}
                        onChange={(e) =>
                          setEditingTenant({
                            ...editingTenant,
                            features: {
                              ...editingTenant.features,
                              canUseBarcodeScanner: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Barcode Scanner No Seri Baterai</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                {editingTenant && tenants.some((t) => t.id === editingTenant.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDirectDelete(editingTenant.id, editingTenant.companyName);
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Akun Ini
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTenantForm(editingTenant)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm"
                  >
                    Simpan Data Penyewa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete In-App Confirmation Modal */}
        {tenantToDelete && (
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hapus Akun Customer Penyewa?</h3>
                  <p className="text-xs text-slate-500">Tindakan ini permanen dan menghapus lisensi sewa.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="text-slate-800">
                  Perusahaan: <strong>{tenantToDelete.companyName}</strong>
                </div>
                <div className="text-slate-600">
                  Paket: {tenantToDelete.tierName} • PIC: {tenantToDelete.picName} ({tenantToDelete.phone})
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTenantToDelete(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Ya, Hapus Akun
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
