import React, { useState, useMemo, useEffect } from 'react';
import { RentalTenant, RentalTier, RentalStatus, DEFAULT_TIER_FEATURES } from '../types/rental';
import { CommissioningReport } from '../types/report';
import {
  getRentalTenants,
  saveRentalTenant,
  saveRentalTenants,
  deleteRentalTenant,
  renewTenantRental,
  toggleTenantStatus,
  getDaysRemaining,
  getDeletedTenantIds,
} from '../utils/rentalStorage';
import { getAllTenantsFromFirestore, subscribeToTenants } from '../firebase/tenantService';
import {
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
  Edit2,
  Trash2,
  RefreshCw,
  MessageSquare,
  Lock,
  Unlock,
  Sliders,
  DollarSign,
  Copy,
  Check,
  Zap,
  LogOut,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  X,
  Database,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface OwnerDashboardPageProps {
  onLogout: () => void;
  onImpersonateTenant: (tenant: RentalTenant) => void;
  onOpenReportEditor: (reportId?: string) => void;
  onOpenPrintReport: (report: CommissioningReport) => void;
  onDeleteReport?: (reportId: string) => void;
  reports: CommissioningReport[];
  onOpenDatabaseModal?: () => void;
}

// Helper to generate a friendly, secure random password for customers
function generateSecurePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 3; i++) {
    rand += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return `Volt${rand}`;
}

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({
  onLogout,
  onImpersonateTenant,
  onOpenReportEditor,
  onOpenPrintReport,
  onDeleteReport,
  reports,
  onOpenDatabaseModal,
}) => {
  const [tenants, setTenants] = useState<RentalTenant[]>(() => getRentalTenants());
  const [activeTab, setActiveTab] = useState<'tenants' | 'reports' | 'tiers' | 'invoice'>('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'suspended'>('all');

  // Modal State for Add / Edit Tenant
  const [editingTenant, setEditingTenant] = useState<RentalTenant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<RentalTenant | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Notification toast
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

  // Sync and subscribe to Firestore Cloud Database tenants in real-time
  useEffect(() => {
    let isMounted = true;

    // 1. Initial sync with Firestore
    getAllTenantsFromFirestore()
      .then((cloudTenants) => {
        if (!isMounted) return;
        if (cloudTenants && cloudTenants.length > 0) {
          const deletedIds = getDeletedTenantIds();
          const cleanCloud = cloudTenants.filter((t) => !deletedIds.includes(t.id));
          const localTenants = getRentalTenants();
          const localMap = new Map<string, RentalTenant>();
          localTenants.forEach((t) => localMap.set(t.id, t));
          cleanCloud.forEach((t) => localMap.set(t.id, t));
          const merged = Array.from(localMap.values());
          saveRentalTenants(merged);
          setTenants(merged);
        }
      })
      .catch((err) => {
        console.warn('Initial Firestore tenant sync notice:', err);
      });

    // 2. Real-time subscription to tenants collection
    const unsub = subscribeToTenants(
      (cloudTenants) => {
        if (!isMounted) return;
        if (cloudTenants && cloudTenants.length > 0) {
          const deletedIds = getDeletedTenantIds();
          const clean = cloudTenants.filter((t) => !deletedIds.includes(t.id));
          if (clean.length > 0) {
            setTenants(clean);
            saveRentalTenants(clean);
          }
        }
      },
      (err) => {
        console.warn('Firestore tenants real-time listener error:', err);
      }
    );

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

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
    showToast(`Akun customer "${companyName}" berhasil dihapus secara permanen.`);
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
        `Terima kasih!\nPengelola VoltCheck System`
    );

    window.open(`https://wa.me/${phoneFormatted}?text=${message}`, '_blank');
  };

  const handleSaveTenantForm = (tenantData: RentalTenant) => {
    if (!tenantData.companyName.trim()) {
      setFormError('Nama perusahaan / vendor wajib diisi.');
      return;
    }
    if (!tenantData.email.trim() || !tenantData.email.includes('@')) {
      setFormError('Alamat email login wajib diisi dengan format valid (@).');
      return;
    }
    const cleanPassword = (tenantData.password || '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      setFormError('Kata sandi wajib diisi minimal 6 karakter.');
      return;
    }

    const payload: RentalTenant = {
      ...tenantData,
      companyName: tenantData.companyName.trim(),
      email: tenantData.email.toLowerCase().trim(),
      password: cleanPassword,
    };

    saveRentalTenant(payload);
    refreshTenants();
    setIsFormOpen(false);
    setEditingTenant(null);
    setFormError(null);
    showToast(`Data customer "${payload.companyName}" dan kredensial login berhasil disimpan!`);
  };

  const handleNewTenantClick = () => {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const newPass = generateSecurePassword();

    const emptyTenant: RentalTenant = {
      id: `tenant-${Date.now()}`,
      companyName: '',
      shortCode: '',
      email: '',
      password: newPass,
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
    setShowFormPassword(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white uppercase">
                  VoltCheck SaaS Hub
                </span>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded uppercase">
                  👑 Dashboard Penjual (Owner)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pusat Kontrol Persewaan Aplikasi, Manajemen Customer, Kuota & Penagihan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenDatabaseModal && (
              <button
                type="button"
                onClick={onOpenDatabaseModal}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                title="Buka status dan sinkronisasi Database Cloud Firestore"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Database Cloud</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNewTenantClick}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Customer Baru
            </button>

            <button
              type="button"
              onClick={() => onOpenReportEditor()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Buka Form Editor Lapangan
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              title="Keluar dari sesi Penjual"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Customer Penyewa</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {metrics.activeTenants}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {metrics.totalTenants} Total</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {metrics.activeTenants} Penyewa Aktif
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Estimasi MRR (Pendapatan Bulanan)</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              Rp {metrics.totalMRR.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Dari {metrics.activeTenants} kontrak sewa berjalan
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Laporan Terbit di Sistem</span>
              <FileCheck2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {reports.length}
              <span className="text-xs text-slate-500 font-normal ml-1">Laporan Commissioning</span>
            </div>
            <div className="text-[11px] text-blue-400 mt-1">
              Dikerjakan surveyor di lapangan
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Perlu Follow-up / Tagihan</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1">
              {metrics.expiringTenants + metrics.expiredTenants}
              <span className="text-xs text-slate-500 font-normal ml-1">Customer</span>
            </div>
            <div className="text-[11px] text-rose-400 mt-1">
              {metrics.expiringTenants} jatuh tempo &lt;7 hari, {metrics.expiredTenants} expired
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'tenants'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Daftar Customer Penyewa ({tenants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Semua Laporan Commissioning ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'tiers'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Konfigurasi Paket & Feature Gating
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'invoice'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Generator Invoice Sewa WA
          </button>
        </div>

        {/* Tab 1: Tenants List */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama perusahaan, PIC, telepon, atau kode..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({tenants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aktif ({metrics.activeTenants})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expiring')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    statusFilter === 'expiring'
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Jatuh Tempo &lt;7H ({metrics.expiringTenants})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    statusFilter === 'expired'
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Expired ({metrics.expiredTenants})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[980px]">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Nama Perusahaan / Penyewa</th>
                      <th className="py-3 px-3">Paket & Biaya Sewa</th>
                      <th className="py-3 px-3">Masa Berlaku</th>
                      <th className="py-3 px-3">Kuota Laporan</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Batasan Fitur</th>
                      <th className="py-3 px-4 text-right">Aksi Penjual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500">
                          Tidak ada data customer yang sesuai dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => {
                        const daysLeft = getDaysRemaining(t.endDate);
                        const isExpired = t.status === 'expired' || daysLeft <= 0;
                        const isSuspended = t.status === 'suspended';

                        return (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Company */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                                  {t.shortCode || t.companyName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{t.companyName}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    PIC: {t.picName} • {t.phone}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono mt-1">
                                    <span className="text-slate-400">
                                      Email: <span className="text-slate-200 font-semibold">{t.email}</span>
                                    </span>
                                    <span className="text-slate-600">|</span>
                                    <span className="text-slate-400 flex items-center gap-1">
                                      Sandi:
                                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold select-all">
                                        {t.password || 'password123'}
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Email: ${t.email}\nSandi: ${t.password || 'password123'}\nPortal: ${window.location.origin}`;
                                        navigator.clipboard.writeText(text);
                                        showToast(`Kredensial login ${t.shortCode} berhasil disalin!`);
                                      }}
                                      className="p-1 hover:text-emerald-400 text-slate-400 rounded transition-colors"
                                      title="Salin Email & Sandi"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Tier */}
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mb-1 ${
                                  t.tier === 'enterprise'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : t.tier === 'pro'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {t.tierName}
                              </span>
                              <div className="font-bold text-slate-200">
                                Rp {t.rentalFeeMonthly.toLocaleString('id-ID')}{' '}
                                <span className="text-[10px] font-normal text-slate-500">/bln</span>
                              </div>
                            </td>

                            {/* Dates */}
                            <td className="py-3.5 px-3">
                              <div
                                className={`font-bold flex items-center gap-1 ${
                                  isSuspended
                                    ? 'text-slate-400'
                                    : isExpired
                                    ? 'text-rose-400'
                                    : daysLeft <= 7
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {isSuspended
                                  ? 'Ditangguhkan'
                                  : isExpired
                                  ? 'Masa Sewa Habis'
                                  : `Sisa ${daysLeft} Hari`}
                              </div>
                              <div className="text-[10px] text-slate-400">s/d {t.endDate}</div>
                            </td>

                            {/* Quota */}
                            <td className="py-3.5 px-3 font-mono">
                              <div className="font-bold text-slate-200">
                                {t.reportsUsed} / {t.reportsQuota === -1 ? '∞' : `${t.reportsQuota} Lap.`}
                              </div>
                              {t.reportsQuota !== -1 && (
                                <div className="w-20 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full ${
                                      t.reportsUsed >= t.reportsQuota ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.round((t.reportsUsed / t.reportsQuota) * 100)
                                      )}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isSuspended
                                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                    : isExpired
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {isSuspended ? 'Terkunci' : isExpired ? 'Expired' : 'Aktif'}
                              </span>
                            </td>

                            {/* Feature tags */}
                            <td className="py-3.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[130px]">
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                    t.features.canWhiteLabel
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-600 line-through'
                                  }`}
                                >
                                  Logo
                                </span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                    t.features.canExportPdf
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-600 line-through'
                                  }`}
                                >
                                  PDF
                                </span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                    t.features.canExportZip
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-600 line-through'
                                  }`}
                                >
                                  ZIP
                                </span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                    t.features.canUseAuditTools
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-600 line-through'
                                  }`}
                                >
                                  PUIL
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {confirmDeleteId === t.id ? (
                                <div className="inline-flex items-center gap-1.5 p-1 bg-rose-950/90 border border-rose-600 rounded-xl shadow-lg animate-fade-in">
                                  <span className="text-[11px] text-rose-200 font-bold px-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                    Hapus {t.shortCode}?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectDelete(t.id, t.companyName)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
                                    title="Konfirmasi hapus akun permanen"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  {/* Impersonate */}
                                  <button
                                    type="button"
                                    onClick={() => onImpersonateTenant(t)}
                                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[11px] font-bold border border-emerald-500/40 transition-colors flex items-center gap-1"
                                    title="Masuk ke portal customer ini (simulasi)"
                                  >
                                    <Zap className="w-3 h-3" />
                                    Masuk Akun Ini
                                  </button>

                                  {/* Renew +30 Days */}
                                  <button
                                    type="button"
                                    onClick={() => handleRenew(t, 30)}
                                    className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-500/40 transition-colors"
                                    title="Perpanjang +30 Hari"
                                  >
                                    +30H
                                  </button>

                                  {/* WhatsApp Reminder */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppReminder(t)}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                    title="Kirim tagihan / reminder WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Kirim Kredensial WA */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cleanPhone = t.phone.replace(/[^0-9]/g, '');
                                      const phoneFormatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                                      const msg = encodeURIComponent(
                                        `Halo Bapak/Ibu ${t.picName} (${t.companyName}),\n\n` +
                                          `Berikut kredensial login aplikasi VoltCheck Commissioning Test Anda:\n` +
                                          `• Email Login: ${t.email}\n` +
                                          `• Kata Sandi: ${t.password || 'password123'}\n` +
                                          `• Paket: ${t.tierName}\n` +
                                          `• Link Portal: ${window.location.origin}\n\n` +
                                          `Silakan masuk menggunakan email dan kata sandi di atas. Terima kasih!\nTim VoltCheck`
                                      );
                                      window.open(`https://wa.me/${phoneFormatted}?text=${msg}`, '_blank');
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors"
                                    title="Kirim Email & Sandi ke WhatsApp Customer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTenant({
                                        ...t,
                                        password: t.password || 'password123',
                                      });
                                      setShowFormPassword(false);
                                      setFormError(null);
                                      setIsFormOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                    title="Edit data dan batasan fitur"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Suspend */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSuspend(t)}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isSuspended
                                        ? 'bg-amber-500/30 text-amber-300'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                    title={isSuspended ? 'Buka Kunci' : 'Tangguhkan Sewa'}
                                  >
                                    {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDeleteId(t.id);
                                      setTenantToDelete(t);
                                    }}
                                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
                                    title="Hapus data sewa customer ini"
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

        {/* Tab 2: All Reports in System */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Semua Laporan Hasil Inspeksi Lapangan</h3>
                <p className="text-xs text-slate-400">
                  Daftar laporan commissioning yang telah disimpan oleh seluruh surveyor di sistem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenReportEditor()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Laporan Baru
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h4 className="font-bold text-white text-base">Tidak Ada Laporan Commissioning</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Seluruh laporan telah dihapus. Klik tombol &quot;Buat Laporan Baru&quot; di atas untuk membuat laporan commissioning baru.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((rep) => {
                  const totalPhotos = 34;
                  let filled = 0;
                  Object.values(rep.bssVisual || {}).forEach((i) => i.imageData && filled++);
                  Object.values(rep.simCardVisual || {}).forEach((i) => i.imageData && filled++);
                  Object.values(rep.groundingVisual || {}).forEach((i) => i.imageData && filled++);
                  Object.values(rep.kwhAndPanelVisual || {}).forEach((i) => i.imageData && filled++);
                  Object.values(rep.cablesVisual || {}).forEach((i) => i.imageData && filled++);

                  return (
                    <div
                      key={rep.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-white">
                            {rep.generalInfo.plantName || 'Nama Stasiun Belum Diisi'}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 bg-slate-950 rounded">
                            {rep.generalInfo.snChargerUnit || 'BSS-01'}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          Vendor: {rep.generalInfo.installationVendor || 'V-Green Indonesia'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Alamat: {rep.generalInfo.plantAddress || 'Lokasi belum diatur'}
                        </p>

                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span>Foto: {filled}/{totalPhotos}</span>
                          <span className="font-mono text-[10px]">{rep.createdAt?.slice(0, 10)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenReportEditor(rep.id)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                          Buka di Editor
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenPrintReport(rep)}
                          className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                          title="Pratinjau / Cetak PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {onDeleteReport && (
                          <button
                            type="button"
                            onClick={() => {
                              const name = rep.generalInfo.plantName || 'stasiun ini';
                              if (window.confirm(`Yakin ingin menghapus laporan "${name}" secara permanen? Data laporan yang dihapus tidak akan muncul kembali saat refresh.`)) {
                                onDeleteReport(rep.id);
                                showToast(`Laporan "${name}" berhasil dihapus.`);
                              }
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors"
                            title="Hapus Laporan Ini Secara Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Tier Configuration */}
        {activeTab === 'tiers' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Matriks Batasan Fitur (Feature Gating) Berdasarkan Paket Sewa
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Sistem secara otomatis mengunci atau membuka akses fitur di browser customer penyewa sesuai dengan izin paket mereka.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Starter */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                    Starter
                  </span>
                  <h4 className="text-lg font-bold text-white mt-2">Starter Surveyor</h4>
                  <div className="text-2xl font-black text-white mt-2">
                    Rp 350.000 <span className="text-xs font-normal text-slate-500">/ bln</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Maksimal <strong>5 Laporan</strong> / bulan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ekspor PDF Draf Lapangan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Kamera & Geotagging GPS</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                      <span className="line-through">White-Label Logo Sendiri</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                      <span className="line-through">Download ZIP Seluruh Foto</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro */}
              <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg shadow-emerald-950/40">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-full uppercase">
                  Paling Populer
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded">
                    Pro
                  </span>
                  <h4 className="text-lg font-bold text-white mt-2">Pro Commissioning</h4>
                  <div className="text-2xl font-black text-white mt-2">
                    Rp 850.000 <span className="text-xs font-normal text-slate-500">/ bln</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Maksimal <strong>20 Laporan</strong> / bulan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>White-Label</strong> Logo & TTD Sendiri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Download <strong>ZIP Foto HD</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Evaluasi PUIL & Grounding Gauge</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise */}
              <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded">
                    Enterprise
                  </span>
                  <h4 className="text-lg font-bold text-white mt-2">Enterprise Unlimited</h4>
                  <div className="text-2xl font-black text-white mt-2">
                    Rp 2.500.000 <span className="text-xs font-normal text-slate-500">/ bln</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Unlimited Laporan (Tanpa Batas Kuota)</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Semua Fitur Pro Lengkap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Prioritas Dukungan Teknis 24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Invoice Generator */}
        {activeTab === 'invoice' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-bold text-sm text-white mb-4">
              Generator Invoice & Penawaran Sewa WhatsApp Cepat
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Pilih Customer Penyewa
                </label>
                <select
                  value={selectedInvoiceTenantId || (tenants[0]?.id ?? '')}
                  onChange={(e) => setSelectedInvoiceTenantId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.companyName} ({t.tierName} - Rp {t.rentalFeeMonthly.toLocaleString('id-ID')}/bln)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Durasi Penagihan
                </label>
                <select
                  value={invoiceMonths}
                  onChange={(e) => setInvoiceMonths(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={3}>3 Bulan (Diskon 5%)</option>
                  <option value={6}>6 Bulan (Diskon 10%)</option>
                  <option value={12}>12 Bulan / 1 Tahun (Diskon 20%)</option>
                </select>
              </div>
            </div>

            {/* Generated Invoice Text */}
            {(() => {
              const target = tenants.find((t) => t.id === selectedInvoiceTenantId) || tenants[0];
              if (!target) return null;

              const monthly = target.rentalFeeMonthly;
              let discPct = 0;
              if (invoiceMonths === 3) discPct = 5;
              if (invoiceMonths === 6) discPct = 10;
              if (invoiceMonths === 12) discPct = 20;

              const rawTotal = monthly * invoiceMonths;
              const discAmount = (rawTotal * discPct) / 100;
              const total = rawTotal - discAmount;

              const text =
                `*INVOICE PERSEWAAN APLIKASI COMMISSIONING BSS*\n` +
                `No: INV-SEWA-${target.shortCode}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}\n\n` +
                `Kepada Yth,\n*${target.companyName}*\nAttn: ${target.picName} (${target.phone})\n\n` +
                `Rincian Sewa Lisensi:\n` +
                `• Paket: ${target.tierName}\n` +
                `• Durasi: ${invoiceMonths} Bulan\n` +
                `• Kuota Laporan: ${target.reportsQuota === -1 ? 'Unlimited' : `${target.reportsQuota} laporan/bulan`}\n` +
                `• Biaya / Bulan: Rp ${monthly.toLocaleString('id-ID')}\n` +
                (discPct > 0 ? `• Diskon Durasi (${discPct}%): -Rp ${discAmount.toLocaleString('id-ID')}\n` : '') +
                `----------------------------------------\n` +
                `*TOTAL: Rp ${total.toLocaleString('id-ID')}*\n\n` +
                `Pembayaran dapat ditransfer ke:\n` +
                `Bank BCA: 123-456-7890 a/n PT V-Green Sistem Mandiri\n` +
                `Bank Mandiri: 987-00-1234567-8 a/n PT V-Green Sistem Mandiri\n\n` +
                `Terima kasih!\nPengelola V-Green Commissioning Platform`;

              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Draf Pesan WhatsApp:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          setCopiedInvoice(true);
                          setTimeout(() => setCopiedInvoice(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"
                      >
                        {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedInvoice ? 'Tersalin' : 'Salin Pesan'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const clean = target.phone.replace(/[^0-9]/g, '');
                          const phone = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Kirim ke WA Penyewa
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {text}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Add / Edit Tenant Modal */}
      {isFormOpen && editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingTenant.companyName ? `Edit Penyewa: ${editingTenant.companyName}` : 'Daftarkan Customer Sewa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Perusahaan / Vendor</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.companyName}
                    onChange={(e) => setEditingTenant({ ...editingTenant, companyName: e.target.value })}
                    placeholder="PT Sinar Energi Mandiri"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kode Singkat (Prefix)</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.shortCode}
                    onChange={(e) => setEditingTenant({ ...editingTenant, shortCode: e.target.value.toUpperCase() })}
                    placeholder="SEM"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama PIC Penanggung Jawab</label>
                  <input
                    type="text"
                    value={editingTenant.picName}
                    onChange={(e) => setEditingTenant({ ...editingTenant, picName: e.target.value })}
                    placeholder="Budi Santoso"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">No WhatsApp PIC</label>
                  <input
                    type="text"
                    value={editingTenant.phone}
                    onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Kredensial Login Customer & Set Password */}
              <div className="p-3.5 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                    <KeyRound className="w-4 h-4" />
                    <span>Kredensial Login Customer (Email & Set Password)</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                    Akses Masuk Portal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Email Login <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={editingTenant.email}
                      onChange={(e) => setEditingTenant({ ...editingTenant, email: e.target.value })}
                      placeholder="contoh: surveyor@perusahaan.com"
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-300 text-xs">
                        Set Kata Sandi <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newPass = generateSecurePassword();
                          setEditingTenant({ ...editingTenant, password: newPass });
                          setShowFormPassword(true);
                          showToast('Kata sandi acak baru berhasil dibuat!');
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                        title="Buat kata sandi acak otomatis"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate Sandi Acak
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        value={editingTenant.password || ''}
                        onChange={(e) => setEditingTenant({ ...editingTenant, password: e.target.value })}
                        placeholder="Minimal 6 karakter..."
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        title={showFormPassword ? 'Sembunyikan sandi' : 'Tampilkan kata sandi'}
                      >
                        {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Helper info & Quick Share Credential Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px]">
                  <div className="text-slate-400">
                    Sandi ini digunakan customer untuk login langsung ke aplikasi VoltCheck.
                  </div>
                  {editingTenant.email && editingTenant.password && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Halo Bapak/Ibu ${editingTenant.picName || 'Customer'} (${editingTenant.companyName || 'Vendor'}),\n\n` +
                            `Berikut kredensial login aplikasi VoltCheck Commissioning Test Anda:\n` +
                            `• Email Login: ${editingTenant.email}\n` +
                            `• Kata Sandi: ${editingTenant.password}\n` +
                            `• Paket Sewa: ${editingTenant.tierName}\n` +
                            `• Link Portal: ${window.location.origin}\n\n` +
                            `Silakan gunakan email & kata sandi tersebut untuk masuk ke portal. Terima kasih!\nTim VoltCheck`;
                          navigator.clipboard.writeText(text);
                          showToast('Email & Sandi berhasil disalin ke clipboard!');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-emerald-400" />
                        Salin Kredensial
                      </button>
                      {editingTenant.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            const clean = editingTenant.phone.replace(/[^0-9]/g, '');
                            const phone = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
                            const text = `Halo Bapak/Ibu ${editingTenant.picName || 'Customer'} (${editingTenant.companyName || 'Vendor'}),\n\n` +
                              `Berikut kredensial login aplikasi VoltCheck Commissioning Test Anda:\n` +
                              `• Email Login: ${editingTenant.email}\n` +
                              `• Kata Sandi: ${editingTenant.password}\n` +
                              `• Paket Sewa: ${editingTenant.tierName}\n` +
                              `• Link Portal: ${window.location.origin}\n\n` +
                              `Silakan gunakan email & kata sandi tersebut untuk masuk ke portal. Terima kasih!\nTim VoltCheck`;
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Kirim ke WA Customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Paket & Kuota Sewa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Paket</label>
                    <select
                      value={editingTenant.tier}
                      onChange={(e) => {
                        const tier = e.target.value as RentalTier;
                        const conf = DEFAULT_TIER_FEATURES[tier];
                        setEditingTenant({
                          ...editingTenant,
                          tier,
                          tierName: conf.name,
                          rentalFeeMonthly: conf.price,
                          reportsQuota: conf.quota,
                          features: { ...conf.features },
                        });
                      }}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    >
                      <option value="starter">Starter (Rp 350.000)</option>
                      <option value="pro">Pro (Rp 850.000)</option>
                      <option value="enterprise">Enterprise (Rp 2.500.000)</option>
                      <option value="custom">Kustom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Biaya / Bln (Rp)</label>
                    <input
                      type="number"
                      value={editingTenant.rentalFeeMonthly}
                      onChange={(e) => setEditingTenant({ ...editingTenant, rentalFeeMonthly: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kuota (-1 = ∞)</label>
                    <input
                      type="number"
                      value={editingTenant.reportsQuota}
                      onChange={(e) => setEditingTenant({ ...editingTenant, reportsQuota: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Tgl Mulai</label>
                    <input
                      type="date"
                      value={editingTenant.startDate}
                      onChange={(e) => setEditingTenant({ ...editingTenant, startDate: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tgl Jatuh Tempo</label>
                    <input
                      type="date"
                      value={editingTenant.endDate}
                      onChange={(e) => setEditingTenant({ ...editingTenant, endDate: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={editingTenant.status}
                      onChange={(e) => setEditingTenant({ ...editingTenant, status: e.target.value as RentalStatus })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                      <option value="suspended">Ditangguhkan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feature checkboxes */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Izin Fitur Khusus
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTenant.features.canExportPdf}
                      onChange={(e) =>
                        setEditingTenant({
                          ...editingTenant,
                          features: { ...editingTenant.features, canExportPdf: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Export / Cetak PDF Resmi</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTenant.features.canWhiteLabel}
                      onChange={(e) =>
                        setEditingTenant({
                          ...editingTenant,
                          features: { ...editingTenant.features, canWhiteLabel: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>White-Label (Logo & TTD Sendiri)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTenant.features.canExportZip}
                      onChange={(e) =>
                        setEditingTenant({
                          ...editingTenant,
                          features: { ...editingTenant.features, canExportZip: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Download ZIP Seluruh Foto</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTenant.features.canUseAuditTools}
                      onChange={(e) =>
                        setEditingTenant({
                          ...editingTenant,
                          features: { ...editingTenant.features, canUseAuditTools: e.target.checked },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Evaluasi Kelistrikan PUIL & Grounding</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-950">
              {editingTenant && tenants.some((t) => t.id === editingTenant.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleDirectDelete(editingTenant.id, editingTenant.companyName);
                  }}
                  className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
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
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTenantForm(editingTenant)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tenant In-App Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Hapus Akun Customer Penyewa?</h3>
                <p className="text-xs text-slate-400">Tindakan ini permanen dan menghapus lisensi sewa.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1.5">
              <div className="text-slate-300">
                Perusahaan: <strong className="text-white">{tenantToDelete.companyName}</strong>
              </div>
              <div className="text-slate-400">
                Paket: <span className="text-emerald-400">{tenantToDelete.tierName}</span> • PIC: {tenantToDelete.picName} ({tenantToDelete.phone})
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun sewa ini? Customer ini tidak akan dapat login lagi ke sistem persewaan aplikasi.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTenantToDelete(null)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
