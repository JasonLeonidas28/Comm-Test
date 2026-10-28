import React, { useState, useEffect, useMemo } from 'react';
import { CommissioningReport, PhotoItem, PunchlistItem } from './types/report';
import { createSampleReport, createEmptyReport, DEFAULT_VGREEN_LOGO } from './utils/sampleData';
import { Header } from './components/Header';
import { GeneralInfoForm } from './components/GeneralInfoForm';
import { PhotoCard } from './components/PhotoCard';
import { CameraModal } from './components/CameraModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { ApprovalSectionView } from './components/ApprovalSectionView';
import { PrintReportView } from './components/PrintReportView';
import { DraftsModal } from './components/DraftsModal';
import { CompletionAuditModal } from './components/CompletionAuditModal';
import { PhotoMarkupModal } from './components/PhotoMarkupModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PunchlistSection } from './components/PunchlistSection';
import { ElectricalAuditBanner } from './components/ElectricalAuditBanner';
import { exportReportPhotosToZip } from './utils/zipExporter';
import { openWhatsAppShare } from './utils/whatsappShare';
import { TenantProfile } from './types/tenant';
import { TenantProfileModal } from './components/TenantProfileModal';
import {
  getTenantProfiles,
  getActiveTenantProfile,
  saveTenantProfile,
  deleteTenantProfile,
  setActiveTenantId,
  applyTenantToReport,
} from './utils/tenantStorage';
import { AuthSession, RentalTenant, DEFAULT_TIER_FEATURES } from './types/rental';
import {
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  getRentalTenants,
  getRentalTenantById,
  saveRentalTenant,
  saveRentalTenants,
  incrementTenantReportUsage,
  OWNER_DEFAULT_SESSION,
  getDaysRemaining,
} from './utils/rentalStorage';
import { getAllTenantsFromFirestore, subscribeToTenants } from './firebase/tenantService';
import { LoginPage } from './components/LoginPage';
import { OwnerDashboardPage } from './components/OwnerDashboardPage';
import { TenantDashboardPage } from './components/TenantDashboardPage';
import { LoginModal } from './components/LoginModal';
import { RentalDashboardModal } from './components/RentalDashboardModal';
import { TenantRentalBanner } from './components/TenantRentalBanner';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { User } from 'firebase/auth';
import { subscribeToAuth, logoutFirebase } from './firebase/authService';
import {
  saveReportToFirestore,
  getAllReportsFromFirestore,
  deleteReportFromFirestore,
  subscribeToReports,
} from './firebase/reportService';
import {
  FileText,
  BatteryCharging,
  Radio,
  Zap,
  Gauge,
  Activity,
  Layers,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

const STORAGE_KEY = 'vgreen_comm_reports_v1';
const CURRENT_ID_KEY = 'vgreen_comm_current_id';
const STORAGE_REPORTS_INITIALIZED_KEY = 'vgreen_reports_initialized_v2';
const STORAGE_DELETED_REPORT_IDS_KEY = 'vgreen_deleted_report_ids_v1';

export function getDeletedReportIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_REPORT_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveDeletedReportIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_DELETED_REPORT_IDS_KEY, JSON.stringify(ids));
  } catch (e) {}
}

export default function App() {
  // Load saved drafts or default sample report (strictly respect deletions)
  const [reports, setReports] = useState<CommissioningReport[]>(() => {
    const deletedIds = getDeletedReportIds();

    try {
      const isInitialized = localStorage.getItem(STORAGE_REPORTS_INITIALIZED_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);

      // If user has already initialized or saved reports previously,
      // respect that stored list even if it is completely empty []
      if (isInitialized || saved !== null) {
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((r) => !deletedIds.includes(r.id));
          }
        }
        return [];
      }
    } catch (e) {
      console.warn('Could not load saved reports from localStorage', e);
    }

    // Only on absolute first fresh startup of the platform
    const sample = createSampleReport();
    if (deletedIds.includes(sample.id)) {
      return [];
    }

    const initial = [sample];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      localStorage.setItem(STORAGE_REPORTS_INITIALIZED_KEY, 'true');
    } catch (e) {}
    return initial;
  });

  const [currentId, setCurrentId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(CURRENT_ID_KEY);
      if (savedId) return savedId;
    } catch (e) {}
    return reports[0]?.id || '';
  });

  // Auth & Rental SaaS State
  const [authSession, setAuthSessionState] = useState<AuthSession | null>(() => getAuthSession());
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'print'>('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState<boolean>(false);
  const [tenantsVersion, setTenantsVersion] = useState<number>(0);

  // Current Rental Tenant info if tenant role is active
  const currentRentalTenant = useMemo(() => {
    if (authSession?.role === 'tenant' && authSession.tenantId) {
      return getRentalTenantById(authSession.tenantId);
    }
    return undefined;
  }, [authSession, isOwnerDashboardOpen, tenantsVersion]);

  // Reports strictly filtered/scoped to current tenant (or all for owner)
  const tenantReports = useMemo(() => {
    if (authSession?.role === 'tenant' && currentRentalTenant) {
      return reports.filter((r) => {
        if (r.tenantId && r.tenantId === currentRentalTenant.id) return true;
        if (
          r.generalInfo.installationVendor &&
          r.generalInfo.installationVendor.toLowerCase().trim() ===
            currentRentalTenant.companyName.toLowerCase().trim()
        ) {
          return true;
        }
        return false;
      });
    }
    return reports;
  }, [reports, authSession, currentRentalTenant]);

  const currentReport = useMemo(() => {
    if (authSession?.role === 'tenant' && currentRentalTenant) {
      const match = tenantReports.find((r) => r.id === currentId);
      if (match) return match;
      if (tenantReports.length > 0) return tenantReports[0];

      // If tenant has no reports yet, provide an initial draft template pre-filled with THEIR company name
      const empty = createEmptyReport();
      return {
        ...empty,
        tenantId: currentRentalTenant.id,
        generalInfo: {
          ...empty.generalInfo,
          installationVendor: currentRentalTenant.companyName,
          picVendorContact: `${currentRentalTenant.picName} (${currentRentalTenant.phone})`,
          vgreenLogo: DEFAULT_VGREEN_LOGO,
          vendorLogo: currentRentalTenant.features?.canWhiteLabel ? (currentRentalTenant.logo || '') : '',
          customer: 'Vgreen Indonesia',
        },
        approval: {
          ...empty.approval,
          preparedBy: {
            ...empty.approval.preparedBy,
            company: currentRentalTenant.companyName,
            name: currentRentalTenant.picName,
            designation: 'Commissioning Engineer',
          },
        },
      };
    }
    return reports.find((r) => r.id === currentId) || reports[0] || createSampleReport();
  }, [reports, tenantReports, currentId, authSession, currentRentalTenant]);

  // UI state
  const [activeTab, setActiveTab] = useState<number>(0);
  const [withWatermark, setWithWatermark] = useState<boolean>(true);
  const [isPrintView, setIsPrintView] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [isMissingPhotosOpen, setIsMissingPhotosOpen] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Tenant Profile & White-Labeling State (for rental / SaaS mode)
  const [tenantProfiles, setTenantProfiles] = useState<TenantProfile[]>(() => getTenantProfiles());
  const [activeTenantId, setActiveTenantIdState] = useState<string>(() => getActiveTenantProfile().id);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState<boolean>(false);

  // Synchronize active tenant profile with logged-in rental tenant
  useEffect(() => {
    if (currentRentalTenant) {
      const profiles = getTenantProfiles();
      let match = profiles.find(
        (p) =>
          p.id === currentRentalTenant.id ||
          p.name.toLowerCase().trim() === currentRentalTenant.companyName.toLowerCase().trim()
      );
      if (!match) {
        match = {
          id: currentRentalTenant.id,
          name: currentRentalTenant.companyName,
          shortCode: currentRentalTenant.shortCode,
          phone: currentRentalTenant.phone,
          email: currentRentalTenant.email,
          address: currentRentalTenant.address,
          picName: currentRentalTenant.picName,
          picRole: 'Commissioning Engineer',
          picPhone: currentRentalTenant.phone,
          clientName: 'Vgreen Indonesia',
          clientLogo: DEFAULT_VGREEN_LOGO,
          reportPrefix: currentRentalTenant.reportPrefix || `${currentRentalTenant.shortCode}-COMM`,
          brandColor: currentRentalTenant.brandColor || 'emerald',
          footerText: `Dokumen Resmi Inspeksi Lapangan & Commissioning EV BSS - ${currentRentalTenant.companyName}`,
          approvalStatement:
            'Laporan hasil inspeksi dan pengujian commissioning stasiun swap baterai ini dibuat dengan sebenarnya sesuai kondisi fisik dan kelistrikan di lokasi proyek.',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveTenantProfile(match);
        setTenantProfiles(getTenantProfiles());
      }
      setActiveTenantIdState(match.id);
    }
  }, [currentRentalTenant]);

  const activeTenant = useMemo(() => {
    return tenantProfiles.find((t) => t.id === activeTenantId) || tenantProfiles[0];
  }, [tenantProfiles, activeTenantId]);

  // Handlers for Auth and Rental
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setAuthSessionState(session);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logoutFirebase().catch(() => {});
    clearAuthSession();
    setAuthSessionState(null);
    setCurrentView('dashboard');
  };

  const handleImpersonateTenant = (tenant: RentalTenant) => {
    const session: AuthSession = {
      role: 'tenant',
      tenantId: tenant.id,
      tenantName: tenant.companyName,
      userEmail: tenant.email,
      userName: `${tenant.picName} (${tenant.shortCode})`,
      loginTime: new Date().toISOString(),
      impersonatedByOwner: true,
    };
    handleLoginSuccess(session);
    setCurrentView('dashboard');
    setIsOwnerDashboardOpen(false);
  };

  const handleSwitchToOwner = () => {
    handleLoginSuccess(OWNER_DEFAULT_SESSION);
    setCurrentView('dashboard');
  };

  // Database Cloud (Firestore) State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  // Sync with Firestore Cloud Database on boot and listen to real-time updates
  useEffect(() => {
    let isMounted = true;
    const initCloudData = async () => {
      setDbSyncStatus('syncing');
      try {
        const cloudReports = await getAllReportsFromFirestore();
        if (!isMounted) return;

        const deletedIds = getDeletedReportIds();
        if (cloudReports && cloudReports.length > 0) {
          const validCloud = cloudReports.filter((r) => !deletedIds.includes(r.id));
          setReports((prevLocal) => {
            const merged = new Map<string, CommissioningReport>();
            validCloud.forEach((r) => merged.set(r.id, r));
            prevLocal.forEach((r) => {
              if (!merged.has(r.id) && !deletedIds.includes(r.id)) {
                merged.set(r.id, r);
                // Upload local report to Firestore so cloud has it
                saveReportToFirestore(r, currentRentalTenant?.id).catch(() => {});
              }
            });
            return Array.from(merged.values());
          });
          setLastSyncTime(new Date().toISOString());
          setDbSyncStatus('synced');
        } else {
          // Cloud empty: upload local reports to cloud
          const validLocal = reports.filter((r) => !deletedIds.includes(r.id));
          for (const r of validLocal) {
            await saveReportToFirestore(r, currentRentalTenant?.id);
          }
          setLastSyncTime(new Date().toISOString());
          setDbSyncStatus('synced');
          // Sync tenants from Firestore
          const cloudTenants = await getAllTenantsFromFirestore();
          if (cloudTenants && cloudTenants.length > 0) {
            const localTenants = getRentalTenants();
            const localIds = new Set(localTenants.map((t) => t.id));
            let hasNew = false;
            const merged = [...localTenants];
            cloudTenants.forEach((ct) => {
              if (!localIds.has(ct.id)) {
                merged.push(ct);
                hasNew = true;
              }
            });
            if (hasNew) {
              saveRentalTenants(merged);
            }
          }
        }
      } catch (err) {
        console.warn('Initial Firestore sync notice:', err);
        setDbSyncStatus('idle');
      }
    };

    initCloudData();

    // Attach real-time listener to Firestore reports
    const unsubReports = subscribeToReports(
      (updatedCloudReports) => {
        if (!isMounted) return;
        if (updatedCloudReports && updatedCloudReports.length > 0) {
          const deletedIds = getDeletedReportIds();
          const clean = updatedCloudReports.filter((r) => !deletedIds.includes(r.id));
          if (clean.length > 0) {
            setReports(clean);
            setLastSyncTime(new Date().toISOString());
            setDbSyncStatus('synced');
          }
        }
      },
      (err) => {
        console.warn('Real-time listener note:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubReports();
    };
  }, []);

  // Modals
  const [liveCameraItem, setLiveCameraItem] = useState<{
    sectionKey: string;
    item: PhotoItem;
  } | null>(null);
  const [previewItem, setPreviewItem] = useState<PhotoItem | null>(null);
  const [markupItem, setMarkupItem] = useState<{
    sectionKey: string;
    item: PhotoItem;
  } | null>(null);
  const [scannerTargetField, setScannerTargetField] = useState<'snChargerUnit' | 'idPlnKodeBilling' | null>(null);

  // Save to localStorage whenever reports change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      localStorage.setItem(CURRENT_ID_KEY, currentId);
    } catch (e) {
      console.error('Storage quota exceeded when saving report to localStorage', e);
    }
  }, [reports, currentId]);

  // Update current report helper and automatically persist to Firestore Cloud Database
  const updateCurrentReport = (updater: (prev: CommissioningReport) => CommissioningReport) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === currentReport.id) {
          const updated = updater(r);
          const withTimestamp = {
            ...updated,
            updatedAt: new Date().toISOString(),
          };
          // Persist to Cloud Database Firestore
          saveReportToFirestore(withTimestamp, currentRentalTenant?.id).catch((err) =>
            console.warn('Firestore auto-save notice:', err)
          );
          return withTimestamp;
        }
        return r;
      })
    );
  };

  // Photo item updater helper
  const handlePhotoChange = (
    sectionKey:
      | 'bssVisual'
      | 'simCardVisual'
      | 'groundingVisual'
      | 'kwhAndPanelVisual'
      | 'acPanelTesting'
      | 'cablesVisual',
    itemKey: string,
    updatedItem: PhotoItem
  ) => {
    updateCurrentReport((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [itemKey]: updatedItem,
      },
    }));
  };

  // Live camera capture handler
  const handleLiveCameraCapture = (dataUrl: string, timestamp: string) => {
    if (!liveCameraItem) return;
    const { sectionKey, item } = liveCameraItem;
    handlePhotoChange(sectionKey as any, item.id, {
      ...item,
      imageData: dataUrl,
      timestamp,
    });
  };

  // Calculate filled photo statistics
  const photoStats = useMemo(() => {
    const list: PhotoItem[] = [
      ...Object.values(currentReport.bssVisual),
      ...Object.values(currentReport.simCardVisual),
      ...Object.values(currentReport.groundingVisual),
      ...Object.values(currentReport.kwhAndPanelVisual),
      ...Object.values(currentReport.acPanelTesting),
      ...Object.values(currentReport.cablesVisual),
    ];
    const filled = list.filter((i) => Boolean(i.imageData)).length;
    return {
      total: list.length,
      filled,
    };
  }, [currentReport]);

  // Tab definitions
  const tabs = [
    {
      id: 0,
      title: 'Data Proyek',
      icon: FileText,
      badge: currentReport.generalInfo.plantName ? 'OK' : 'Wajib',
      badgeColor: currentReport.generalInfo.plantName ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 1,
      title: '1. BSS Visual',
      icon: BatteryCharging,
      badge: `${Object.values(currentReport.bssVisual).filter((i) => i.imageData).length}/12`,
    },
    {
      id: 2,
      title: '2. SIM Card',
      icon: Radio,
      badge: `${Object.values(currentReport.simCardVisual).filter((i) => i.imageData).length}/5`,
    },
    {
      id: 3,
      title: '3. Grounding',
      icon: Zap,
      badge: `${Object.values(currentReport.groundingVisual).filter((i) => i.imageData).length}/7`,
    },
    {
      id: 4,
      title: '4. Panel & KWH',
      icon: Gauge,
      badge: `${Object.values(currentReport.kwhAndPanelVisual).filter((i) => i.imageData).length}/10`,
    },
    {
      id: 5,
      title: '5. Testing Panel',
      icon: Activity,
      badge: `${Object.values(currentReport.acPanelTesting).filter((i) => i.imageData).length}/7`,
    },
    {
      id: 6,
      title: '6. Kabel Routing',
      icon: Layers,
      badge: `${Object.values(currentReport.cablesVisual).filter((i) => i.imageData).length}/5`,
    },
    {
      id: 7,
      title: '7. Punchlist',
      icon: ClipboardList,
      badge: `${currentReport.punchlist?.filter((p) => p.status !== 'Resolved').length || 0} Open`,
      badgeColor:
        (currentReport.punchlist?.filter((p) => p.status !== 'Resolved').length || 0) > 0
          ? 'bg-amber-100 text-amber-800'
          : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 8,
      title: '8. Approval',
      icon: ShieldCheck,
      badge: currentReport.approval.preparedBy.signatureImage ? 'Ditandatangani' : 'Tanda Tangan',
      badgeColor: currentReport.approval.preparedBy.signatureImage ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
    },
  ];

  // Actions
  const handleLoadSample = () => {
    if (confirm('Muat contoh laporan lengkap (sesuai dokumen KJA APPAREL)? Data formulir saat ini akan diganti dengan contoh.')) {
      const sample = createSampleReport();
      setReports((prev) => [sample, ...prev.filter((r) => r.id !== sample.id)]);
      setCurrentId(sample.id);
    }
  };

  // Tenant Profile Handlers
  const handleSaveTenantProfile = (profile: TenantProfile) => {
    const updated = saveTenantProfile(profile);
    setTenantProfiles(updated);
  };

  const handleDeleteTenantProfile = (id: string) => {
    const updated = deleteTenantProfile(id);
    setTenantProfiles(updated);
  };

  const handleSelectActiveTenant = (id: string) => {
    setActiveTenantId(id);
    setActiveTenantIdState(id);
  };

  const handleApplyTenantToCurrent = (profile: TenantProfile) => {
    updateCurrentReport((prev) => applyTenantToReport(prev, profile));
  };

  const handleNewReport = () => {
    // Check rental status and quota if logged in as customer
    if (authSession?.role === 'tenant') {
      if (!currentRentalTenant) {
        alert('Data akun penyewa tidak ditemukan. Silakan lengkapi pendaftaran profil customer terlebih dahulu.');
        return;
      }
      const daysLeft = getDaysRemaining(currentRentalTenant.endDate);
      if (currentRentalTenant.status === 'expired' || daysLeft <= 0) {
        alert('Masa sewa akun Anda telah habis. Silakan hubungi admin via WhatsApp untuk memperpanjang masa aktif aplikasi.');
        return;
      }
      if (currentRentalTenant.status === 'suspended') {
        alert('Akun sewa Anda sedang ditangguhkan. Silakan hubungi admin.');
        return;
      }
      if (
        currentRentalTenant.reportsQuota !== -1 &&
        currentRentalTenant.reportsUsed >= currentRentalTenant.reportsQuota
      ) {
        alert(
          currentRentalTenant.tier === 'trial'
            ? 'Kuota Free Trial 1 Token Anda telah habis (1/1 laporan). Silakan hubungi admin via WhatsApp untuk upgrade ke paket berbayar.'
            : `Batas kuota laporan Anda (${currentRentalTenant.reportsQuota} laporan) telah tercapai. Hubungi admin untuk menambah kuota laporan.`
        );
        return;
      }
      incrementTenantReportUsage(currentRentalTenant.id);
      setTenantsVersion((v) => v + 1);
    }

    const empty = createEmptyReport();
    const vendorName = currentRentalTenant?.companyName || activeTenant?.name || '';
    const picName = currentRentalTenant?.picName || activeTenant?.picName || '';
    const picPhone = currentRentalTenant?.phone || activeTenant?.picPhone || activeTenant?.phone || '';

    const customized: CommissioningReport = {
      ...empty,
      tenantId: currentRentalTenant?.id,
      generalInfo: {
        ...empty.generalInfo,
        installationVendor: vendorName,
        picVendorContact: picName ? `${picName} (${picPhone})` : '',
        vgreenLogo: DEFAULT_VGREEN_LOGO,
        vendorLogo: currentRentalTenant?.features?.canWhiteLabel ? (currentRentalTenant?.logo || '') : '',
        customer: 'Vgreen Indonesia',
      },
      approval: {
        ...empty.approval,
        statement: activeTenant?.approvalStatement || empty.approval.statement,
        preparedBy: {
          ...empty.approval.preparedBy,
          company: vendorName,
          name: picName || empty.approval.preparedBy.name,
          designation: 'Commissioning Engineer',
        },
      },
    };

    // Persist new report to Firestore Cloud Database
    saveReportToFirestore(customized, currentRentalTenant?.id).catch((err) =>
      console.warn('Firestore new report save notice:', err)
    );
    setReports((prev) => [customized, ...prev]);
    setCurrentId(customized.id);
    setActiveTab(0);
  };

  const handleCloneReport = () => {
    // Check rental status and quota if logged in as customer
    if (authSession?.role === 'tenant') {
      if (!currentRentalTenant) {
        alert('Data akun penyewa tidak ditemukan. Silakan lengkapi pendaftaran profil customer terlebih dahulu.');
        return;
      }
      const daysLeft = getDaysRemaining(currentRentalTenant.endDate);
      if (currentRentalTenant.status === 'expired' || daysLeft <= 0) {
        alert('Masa sewa akun Anda telah habis. Silakan hubungi admin via WhatsApp untuk memperpanjang masa aktif aplikasi.');
        return;
      }
      if (currentRentalTenant.status === 'suspended') {
        alert('Akun sewa Anda sedang ditangguhkan. Silakan hubungi admin.');
        return;
      }
      if (
        currentRentalTenant.reportsQuota !== -1 &&
        currentRentalTenant.reportsUsed >= currentRentalTenant.reportsQuota
      ) {
        alert(
          currentRentalTenant.tier === 'trial'
            ? 'Kuota Free Trial 1 Token Anda telah habis (1/1 laporan). Silakan hubungi admin via WhatsApp untuk upgrade ke paket berbayar.'
            : `Batas kuota laporan Anda (${currentRentalTenant.reportsQuota} laporan) telah tercapai. Hubungi admin untuk menambah kuota laporan.`
        );
        return;
      }
      incrementTenantReportUsage(currentRentalTenant.id);
      setTenantsVersion((v) => v + 1);
    }

    const newId = `report-${Date.now()}`;
    const baseEmpty = createEmptyReport();
    const vendorName = currentRentalTenant?.companyName || currentReport.generalInfo.installationVendor || activeTenant?.name || '';
    const picName = currentRentalTenant?.picName || currentReport.approval.preparedBy.name || '';
    const picPhone = currentRentalTenant?.phone || '';

    const cloned: CommissioningReport = {
      ...baseEmpty,
      id: newId,
      tenantId: currentRentalTenant?.id,
      title: `Pre-Commissioning Report - Salinan ${currentReport.generalInfo.plantName || ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generalInfo: {
        ...baseEmpty.generalInfo,
        installationVendor: vendorName,
        picVendorContact: picName ? `${picName} (${picPhone})` : currentReport.generalInfo.picVendorContact,
        vgreenLogo: currentReport.generalInfo.vgreenLogo,
        vendorLogo: currentRentalTenant?.features?.canWhiteLabel ? (currentReport.generalInfo.vendorLogo || '') : '',
        evChargerType: currentReport.generalInfo.evChargerType,
      },
      approval: {
        ...baseEmpty.approval,
        preparedBy: {
          ...baseEmpty.approval.preparedBy,
          name: picName || currentReport.approval.preparedBy.name,
          company: vendorName,
        },
        checkedBy: {
          ...baseEmpty.approval.checkedBy,
          name: currentReport.approval.checkedBy.name,
          company: currentReport.approval.checkedBy.company,
        },
        approvedBy: {
          ...baseEmpty.approval.approvedBy,
          name: currentReport.approval.approvedBy.name,
          company: currentReport.approval.approvedBy.company,
        },
      },
    };

    // Persist cloned report to Firestore Cloud Database
    saveReportToFirestore(cloned, currentRentalTenant?.id).catch((err) =>
      console.warn('Firestore clone report save notice:', err)
    );

    setReports((prev) => [cloned, ...prev]);
    setCurrentId(newId);
    setActiveTab(0);
    alert('Laporan berhasil diduplikasi! Data vendor, logo, dan penandatangan telah disalin. Silakan isi data lokasi stasiun dan foto baru.');
  };

  const handleShareWhatsApp = () => {
    openWhatsAppShare(currentReport);
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const zipBlob = await exportReportPhotosToZip(currentReport);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const name = (currentReport.generalInfo.plantName || 'Plant').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Foto_Commissioning_${name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP', err);
      alert('Gagal membuat berkas ZIP foto');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDeleteReport = (id: string) => {
    // 1. Permanently register in deleted report IDs blacklist
    const deletedIds = getDeletedReportIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedReportIds(deletedIds);
    }

    // 2. Token usage is permanent and strictly 1x use (non-refundable).
    // Deleting a report does NOT restore or refund tokens for any tenant/free trial.
    setTenantsVersion((v) => v + 1);

    // 3. Delete from Firestore Cloud Database
    deleteReportFromFirestore(id).catch((err) =>
      console.warn('Firestore report deletion notice:', err)
    );

    // 4. Update state and storage immediately
    setReports((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        localStorage.setItem(STORAGE_REPORTS_INITIALIZED_KEY, 'true');
      } catch (e) {}

      if (currentId === id) {
        if (remaining.length > 0) {
          setCurrentId(remaining[0].id);
        } else {
          setCurrentId('');
        }
      }
      return remaining;
    });
  };

  const handleImportReport = (imported: CommissioningReport) => {
    setReports((prev) => [imported, ...prev.filter((r) => r.id !== imported.id)]);
    setCurrentId(imported.id);
  };

  // 1. If not authenticated, always show Full Login Page first
  if (!authSession) {
    return (
      <LoginPage
        onLoginSuccess={(session) => {
          handleLoginSuccess(session);
          setCurrentView('dashboard');
        }}
      />
    );
  }

  // 2. Full Print Report View
  if (currentView === 'print' || isPrintView) {
    return (
      <PrintReportView
        report={currentReport}
        onBack={() => {
          setIsPrintView(false);
          setCurrentView('editor');
        }}
        canExportPdf={
          authSession.role === 'owner' ? true : (currentRentalTenant?.features.canExportPdf ?? true)
        }
        tenantName={currentRentalTenant?.companyName}
      />
    );
  }

  // 3. Full-page Owner / Seller Dashboard
  if (currentView === 'dashboard' && authSession.role === 'owner') {
    return (
      <OwnerDashboardPage
        reports={reports}
        onLogout={handleLogout}
        onImpersonateTenant={handleImpersonateTenant}
        onOpenReportEditor={(reportId) => {
          if (reportId) setCurrentId(reportId);
          setCurrentView('editor');
        }}
        onOpenPrintReport={(rep) => {
          setCurrentId(rep.id);
          setCurrentView('print');
        }}
        onDeleteReport={handleDeleteReport}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
      />
    );
  }

  // 4. Full-page Tenant Customer Dashboard
  if (currentView === 'dashboard' && authSession.role === 'tenant') {
    const activeTenant: RentalTenant = currentRentalTenant || {
      id: authSession.tenantId || `tenant-${Date.now()}`,
      companyName: authSession.tenantName || 'Pelanggan Baru (Free Trial)',
      shortCode: 'BSS',
      email: authSession.userEmail,
      picName: authSession.userName || 'Surveyor Lapangan',
      phone: '0812-3456-7890',
      address: 'Indonesia',
      tier: 'trial',
      tierName: 'Free Trial (1 Token)',
      status: 'active',
      rentalFeeMonthly: 0,
      paymentStatus: 'paid',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      reportsQuota: 1, // Free trial strictly 1 Token!
      reportsUsed: 0,
      features: { ...DEFAULT_TIER_FEATURES.trial.features },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ensure it is persisted if it wasn't in storage yet
    if (!currentRentalTenant) {
      saveRentalTenant(activeTenant);
    }

    // Cumulative token tracking: once a report is created, reportsUsed is permanent (non-refundable).
    // Deleting a report from the list does NOT decrease reportsUsed or return tokens.
    const effectiveReportsUsed = Math.max(activeTenant.reportsUsed || 0, tenantReports.length);
    if (effectiveReportsUsed > (activeTenant.reportsUsed || 0)) {
      activeTenant.reportsUsed = effectiveReportsUsed;
      saveRentalTenant(activeTenant);
    }

    const tenantWithPermanentUsage: RentalTenant = {
      ...activeTenant,
      reportsUsed: effectiveReportsUsed,
    };

    return (
      <TenantDashboardPage
        session={authSession}
        tenant={tenantWithPermanentUsage}
        reports={tenantReports}
        onOpenReportEditor={(reportId) => {
          if (reportId) setCurrentId(reportId);
          setCurrentView('editor');
        }}
        onOpenPrintReport={(rep) => {
          setCurrentId(rep.id);
          setCurrentView('print');
        }}
        onNewReport={() => {
          if (
            activeTenant.status === 'expired' ||
            activeTenant.status === 'suspended' ||
            (activeTenant.reportsQuota !== -1 && activeTenant.reportsUsed >= activeTenant.reportsQuota)
          ) {
            alert(
              activeTenant.tier === 'trial'
                ? 'Kuota Free Trial 1 Token Anda telah habis (1/1 laporan). Hubungi admin via WhatsApp untuk upgrade ke paket berbayar.'
                : `Batas kuota laporan Anda (${activeTenant.reportsQuota} laporan) telah tercapai. Hubungi admin untuk menambah kuota laporan.`
            );
            return;
          }
          handleNewReport();
          setCurrentView('editor');
        }}
        onCloneReport={(repId) => {
          if (
            activeTenant.status === 'expired' ||
            activeTenant.status === 'suspended' ||
            (activeTenant.reportsQuota !== -1 && activeTenant.reportsUsed >= activeTenant.reportsQuota)
          ) {
            alert(
              activeTenant.tier === 'trial'
                ? 'Kuota Free Trial 1 Token Anda telah habis (1/1 laporan). Hubungi admin via WhatsApp untuk upgrade ke paket berbayar.'
                : `Batas kuota laporan Anda (${activeTenant.reportsQuota} laporan) telah tercapai. Hubungi admin untuk menambah kuota laporan.`
            );
            return;
          }
          handleCloneReport();
          setCurrentView('editor');
        }}
        onDeleteReport={handleDeleteReport}
        onLogout={handleLogout}
        onSwitchToOwner={handleSwitchToOwner}
      />
    );
  }

  // 5. Full Editor View (when user opens or edits a report)
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        report={currentReport}
        onOpenDrafts={() => setIsDraftsModalOpen(true)}
        onLoadSample={handleLoadSample}
        onNewReport={handleNewReport}
        onCloneReport={handleCloneReport}
        onOpenPrintView={() => setCurrentView('print')}
        onOpenMissingPhotos={() => setIsMissingPhotosOpen(true)}
        onShareWhatsApp={handleShareWhatsApp}
        onExportZip={handleExportZip}
        isExportingZip={isExportingZip}
        withWatermark={withWatermark}
        onToggleWatermark={() => setWithWatermark((prev) => !prev)}
        filledPhotosCount={photoStats.filled}
        totalPhotosCount={photoStats.total}
        onOpenTenantProfile={() => setIsTenantModalOpen(true)}
        activeTenantName={currentRentalTenant?.companyName || activeTenant?.name}
        onOpenDatabaseModal={authSession.role === 'owner' ? () => setIsDatabaseModalOpen(true) : undefined}
        dbSyncStatus={dbSyncStatus}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenOwnerDashboard={() => {
          if (authSession.role === 'owner') {
            setCurrentView('dashboard');
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        onBackToDashboard={() => setCurrentView('dashboard')}
        isOwner={authSession.role === 'owner'}
        canExportZip={
          authSession.role === 'owner' ? true : (currentRentalTenant?.features.canExportZip ?? true)
        }
        canExportPdf={
          authSession.role === 'owner' ? true : (currentRentalTenant?.features.canExportPdf ?? true)
        }
        canWhiteLabel={
          authSession.role === 'owner' ? true : (currentRentalTenant?.features.canWhiteLabel ?? true)
        }
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100'
                        : tab.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1">
          {/* TAB 0: DATA PROYEK */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <GeneralInfoForm
                info={currentReport.generalInfo}
                onChange={(updated) =>
                  updateCurrentReport((prev) => ({ ...prev, generalInfo: updated }))
                }
                onOpenScanner={(field) => setScannerTargetField(field)}
                onOpenTenantProfile={() => setIsTenantModalOpen(true)}
                canWhiteLabel={authSession?.role === 'owner' ? true : (currentRentalTenant?.features.canWhiteLabel ?? true)}
                allowCustomClientLogo={authSession?.role === 'owner' ? true : (currentRentalTenant?.features.allowCustomClientLogo ?? true)}
                tierName={currentRentalTenant?.tierName}
                isOwner={authSession?.role === 'owner'}
              />
            </div>
          )}

          {/* TAB 1: BATTERY SWAP STATION */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      1. Battery Swap Station (BSS)
                    </h2>
                    <p className="text-xs text-slate-500">
                      1.1 Visual Inspection: Foto tampak fisik, fondasi beton, pelat nama, terminasi AC & grounding
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto">
                    Halaman 2-3 Dokumen PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(currentReport.bssVisual).map(([key, item]) => (
                    <PhotoCard
                      key={key}
                      item={item}
                      onChange={(updated) => handlePhotoChange('bssVisual', key, updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'bssVisual', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'bssVisual', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIM CARD */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      2. SIM CARD & Konektivitas
                    </h2>
                    <p className="text-xs text-slate-500">
                      2.1 Visual Inspection: Kartu perdana, SIM terpasang, sinyal bar, URL backend, & LCD
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto">
                    Halaman 3 Dokumen PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Object.entries(currentReport.simCardVisual).map(([key, item]) => (
                    <PhotoCard
                      key={key}
                      item={item}
                      onChange={(updated) => handlePhotoChange('simCardVisual', key, updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'simCardVisual', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'simCardVisual', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GROUNDING SYSTEM */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      3. Sistem Pembumian (Grounding System)
                    </h2>
                    <p className="text-xs text-slate-500">
                      3.1 Visual Inspection & Grounding Test (Ohm) rod, busbar, kabel grounding & nilai resistansi
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto">
                    Halaman 4 Dokumen PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(currentReport.groundingVisual).map(([key, item]) => (
                    <PhotoCard
                      key={key}
                      item={item}
                      onChange={(updated) => handlePhotoChange('groundingVisual', key, updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'groundingVisual', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'groundingVisual', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KWH METER & AC PANEL */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      5. KWH Meter & 6. AC Panel
                    </h2>
                    <p className="text-xs text-slate-500">
                      Inspeksi KWH PLN, MCB PLN, tampak depan buka/tutup, safety sign, pilot lamps, locking, dan MCB
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto">
                    Halaman 5 Dokumen PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Object.entries(currentReport.kwhAndPanelVisual).map(([key, item]) => (
                    <PhotoCard
                      key={key}
                      item={item}
                      onChange={(updated) => handlePhotoChange('kwhAndPanelVisual', key, updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'kwhAndPanelVisual', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'kwhAndPanelVisual', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AC PANEL TESTING */}
          {activeTab === 5 && (
            <div className="space-y-6">
              {/* Live Electrical Pass/Fail Evaluation Banner */}
              <ElectricalAuditBanner report={currentReport} />

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      6.2 AC Panel Testing & Wiring
                    </h2>
                    <p className="text-xs text-slate-500">
                      Wiring diagram, penandaan fasa, pengukuran tegangan (R-N, R-G, N-G), frekuensi Hz, dan grounding
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto">
                    Halaman 6 Dokumen PDF
                  </span>
                </div>

                {/* Sub-section 1: Wiring & Visual */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Inspeksi Visual Wiring & Phase Marking
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <PhotoCard
                      item={currentReport.acPanelTesting.panelWiring}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'panelWiring', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                    <PhotoCard
                      item={currentReport.acPanelTesting.phaseMarking}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'phaseMarking', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                    <PhotoCard
                      item={currentReport.acPanelTesting.groundingToAcPanel}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'groundingToAcPanel', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  </div>
                </div>

                {/* Sub-section 2: Electrical Voltage & Frequency Testing */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Pengujian Nilai Listrik & Multimeter (6.2 TESTING)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <PhotoCard
                      item={currentReport.acPanelTesting.voltageRN}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'voltageRN', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                    <PhotoCard
                      item={currentReport.acPanelTesting.voltageRG}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'voltageRG', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                    <PhotoCard
                      item={currentReport.acPanelTesting.frequency}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'frequency', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                    <PhotoCard
                      item={currentReport.acPanelTesting.voltageNG}
                      onChange={(updated) => handlePhotoChange('acPanelTesting', 'voltageNG', updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'acPanelTesting', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'acPanelTesting', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CABLES */}
          {activeTab === 6 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      3. Kabel (Cables Visual Inspection)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Spesifikasi kabel (cable spec) dan jalur penarikan kabel (cable routing 1 - 4)
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto">
                    Halaman 7 Dokumen PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {Object.entries(currentReport.cablesVisual).map(([key, item]) => (
                    <PhotoCard
                      key={key}
                      item={item}
                      onChange={(updated) => handlePhotoChange('cablesVisual', key, updated)}
                      onOpenLiveCamera={(it) => setLiveCameraItem({ sectionKey: 'cablesVisual', item: it })}
                      onPreview={(it) => setPreviewItem(it)}
                      onOpenMarkup={(it) => setMarkupItem({ sectionKey: 'cablesVisual', item: it })}
                      withWatermark={withWatermark}
                      gpsCoord={currentReport.generalInfo.plantCoordinate}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PUNCHLIST & DEFECTS */}
          {activeTab === 7 && (
            <div className="space-y-6">
              <PunchlistSection
                items={currentReport.punchlist || []}
                onChange={(updated) =>
                  updateCurrentReport((prev) => ({ ...prev, punchlist: updated }))
                }
              />
            </div>
          )}

          {/* TAB 8: APPROVAL & SIGNATURES */}
          {activeTab === 8 && (
            <div className="space-y-6">
              <ElectricalAuditBanner report={currentReport} />
              <ApprovalSectionView
                approval={currentReport.approval}
                onChange={(updated) =>
                  updateCurrentReport((prev) => ({ ...prev, approval: updated }))
                }
                vendorName={currentReport.generalInfo.installationVendor}
              />
            </div>
          )}
        </div>

        {/* Footer Navigation Strip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={activeTab === 0}
            onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Bagian Sebelumnya
          </button>

          <div className="text-center">
            <span className="text-xs font-semibold text-slate-500">
              Bagian {activeTab + 1} dari {tabs.length}:{' '}
              <strong className="text-slate-800">{tabs[activeTab].title}</strong>
            </span>
          </div>

          {activeTab < tabs.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveTab((prev) => Math.min(tabs.length - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
            >
              Lanjut ke Bagian Berikutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentView('print')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              Selesai & Cetak PDF Lengkap
            </button>
          )}
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Live Camera Modal */}
      <CameraModal
        isOpen={Boolean(liveCameraItem)}
        item={liveCameraItem?.item || null}
        onClose={() => setLiveCameraItem(null)}
        onCapture={handleLiveCameraCapture}
        withWatermark={withWatermark}
        gpsCoord={currentReport.generalInfo.plantCoordinate}
      />

      {/* 2. Photo Zoom / Viewer Modal */}
      <PhotoViewerModal
        isOpen={Boolean(previewItem)}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {/* 3. Completion & Audit Readiness Modal */}
      <CompletionAuditModal
        isOpen={isMissingPhotosOpen}
        onClose={() => setIsMissingPhotosOpen(false)}
        report={currentReport}
        onNavigateToSection={(tabIdx) => setActiveTab(tabIdx)}
      />

      {/* 4. Photo Markup / Annotation Modal */}
      <PhotoMarkupModal
        isOpen={Boolean(markupItem)}
        photoUrl={markupItem?.item.imageData || ''}
        title={markupItem ? `Anotasi Foto: ${markupItem.item.label}` : 'Anotasi Foto'}
        onClose={() => setMarkupItem(null)}
        onSave={(annotatedDataUrl) => {
          if (!markupItem) return;
          handlePhotoChange(markupItem.sectionKey as any, markupItem.item.id, {
            ...markupItem.item,
            imageData: annotatedDataUrl,
          });
          setMarkupItem(null);
        }}
      />

      {/* 5. Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={Boolean(scannerTargetField)}
        expectedType={scannerTargetField === 'snChargerUnit' ? 'S/N Unit Charger' : 'ID PLN / Kode Billing'}
        title={scannerTargetField === 'snChargerUnit' ? 'Pindai Barcode S/N Unit Charger' : 'Pindai Barcode ID PLN'}
        onClose={() => setScannerTargetField(null)}
        onScanSuccess={(scannedVal) => {
          if (scannerTargetField) {
            updateCurrentReport((prev) => ({
              ...prev,
              generalInfo: {
                ...prev.generalInfo,
                [scannerTargetField]: scannedVal,
              },
            }));
          }
          setScannerTargetField(null);
        }}
      />

      {/* 6. Drafts & Saved Reports Modal */}
      <DraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        reports={reports}
        currentReportId={currentReport.id}
        onSelectReport={(r) => {
          setCurrentId(r.id);
          setActiveTab(0);
        }}
        onNewReport={handleNewReport}
        onDeleteReport={handleDeleteReport}
        onImportReport={handleImportReport}
      />

      {/* 7. Tenant Profile & White-Labeling Modal */}
      <TenantProfileModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        profiles={tenantProfiles}
        activeProfileId={activeTenantId}
        onSaveProfile={handleSaveTenantProfile}
        onDeleteProfile={handleDeleteTenantProfile}
        onSelectActiveProfile={handleSelectActiveTenant}
        onApplyToCurrentReport={handleApplyTenantToCurrent}
        isOwner={authSession.role === 'owner'}
      />

      {/* 8. Auth & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentSession={authSession!}
        onLoginSuccess={handleLoginSuccess}
        onOpenOwnerDashboard={() => {
          if (authSession.role === 'owner') {
            setIsOwnerDashboardOpen(true);
          }
        }}
        onLogout={handleLogout}
      />

      {/* 9. Owner / Seller Rental Dashboard Modal (Strictly Restricted to Owner) */}
      {authSession.role === 'owner' && (
        <RentalDashboardModal
          isOpen={isOwnerDashboardOpen}
          onClose={() => setIsOwnerDashboardOpen(false)}
          onImpersonateTenant={handleImpersonateTenant}
        />
      )}

      {/* 10. Database Cloud Firestore Status & Sync Modal (Strictly Restricted to Owner / Admin) */}
      {authSession.role === 'owner' && (
        <DatabaseStatusModal
          isOpen={isDatabaseModalOpen}
          onClose={() => setIsDatabaseModalOpen(false)}
          reports={reports}
          onReportsMerged={(merged) => {
            setReports(merged);
            setLastSyncTime(new Date().toISOString());
            setDbSyncStatus('synced');
          }}
          firebaseUser={firebaseUser}
          syncStatus={dbSyncStatus}
          lastSyncTime={lastSyncTime}
        />
      )}
    </div>
  );
}
