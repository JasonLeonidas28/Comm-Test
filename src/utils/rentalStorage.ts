import { RentalTenant, AuthSession, DEFAULT_TIER_FEATURES, RentalTier } from '../types/rental';
import { DEFAULT_VGREEN_LOGO } from './sampleData';
import { saveTenantToFirestore, deleteTenantFromFirestore } from '../firebase/tenantService';

const STORAGE_RENTAL_TENANTS_KEY = 'vgreen_rental_tenants_v1';
const STORAGE_AUTH_SESSION_KEY = 'vgreen_auth_session_v1';
const STORAGE_DELETED_TENANTS_KEY = 'vgreen_deleted_tenant_ids_v1';
const STORAGE_INITIALIZED_KEY = 'vgreen_rental_initialized_v2';

// Calculate future dates helper
const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_RENTAL_TENANTS: RentalTenant[] = [
  {
    id: 'tenant-vtech',
    companyName: 'PT V-Tech Mitra Nusantara',
    shortCode: 'VMN',
    email: 'ops@vtech-mitra.co.id',
    password: 'password123',
    picName: 'Hendra Setiawan, S.T.',
    phone: '0812-3456-7890',
    address: 'Kawasan Industri Pulogadung Blok B No. 14, Jakarta Timur',
    tier: 'pro',
    tierName: 'Pro Commissioning',
    status: 'active',
    rentalFeeMonthly: 850000,
    paymentStatus: 'paid',
    startDate: addDays(todayStr, -15),
    endDate: addDays(todayStr, 25), // 25 days remaining
    reportsQuota: 20,
    reportsUsed: 4,
    features: { ...DEFAULT_TIER_FEATURES.pro.features },
    logo: DEFAULT_VGREEN_LOGO,
    brandColor: 'emerald',
    reportPrefix: 'VMN-COMM',
    notes: 'Kontraktor utama pemasangan 12 unit BSS di area Jabodetabek. Sewa aktif 6 bulan.',
    createdAt: addDays(todayStr, -60),
    updatedAt: todayStr,
  },
  {
    id: 'tenant-surya',
    companyName: 'PT Surya Cipta Daya EPC',
    shortCode: 'SCD',
    email: 'project@suryacipta.com',
    password: 'password123',
    picName: 'Bambang Trianto',
    phone: '0811-9876-5432',
    address: 'Jl. Soekarno Hatta No. 245, Bandung, Jawa Barat',
    tier: 'enterprise',
    tierName: 'Enterprise Unlimited',
    status: 'active',
    rentalFeeMonthly: 2500000,
    paymentStatus: 'paid',
    startDate: addDays(todayStr, -45),
    endDate: addDays(todayStr, 75), // 75 days remaining
    reportsQuota: -1, // Unlimited
    reportsUsed: 14,
    features: { ...DEFAULT_TIER_FEATURES.enterprise.features },
    brandColor: 'blue',
    reportPrefix: 'SCD-BSS',
    notes: 'Paket Enterprise tahunan untuk rollout BSS Jawa Barat dan Jawa Tengah.',
    createdAt: addDays(todayStr, -45),
    updatedAt: todayStr,
  },
  {
    id: 'tenant-mandiri',
    companyName: 'CV Mandiri Survey Elektrik',
    shortCode: 'MSE',
    email: 'survey@mandiri-listrik.com',
    password: 'password123',
    picName: 'Rian Pratama',
    phone: '0813-8822-1100',
    address: 'Jl. Pemuda No. 12, Semarang, Jawa Tengah',
    tier: 'starter',
    tierName: 'Starter Surveyor',
    status: 'active',
    rentalFeeMonthly: 350000,
    paymentStatus: 'paid',
    startDate: addDays(todayStr, -20),
    endDate: addDays(todayStr, 5), // 5 days remaining (needs renewal soon!)
    reportsQuota: 5,
    reportsUsed: 4, // 1 report left
    features: { ...DEFAULT_TIER_FEATURES.starter.features },
    brandColor: 'teal',
    reportPrefix: 'MSE-SURV',
    notes: 'Surveyor lokal independen. Mengambil paket starter 1 bulan.',
    createdAt: addDays(todayStr, -20),
    updatedAt: todayStr,
  },
  {
    id: 'tenant-greenfield',
    companyName: 'PT Greenfield Surveyor Indonesia',
    shortCode: 'GSI',
    email: 'admin@greenfield.co.id',
    password: 'password123',
    picName: 'Denny Kurniawan',
    phone: '0857-1122-3344',
    address: 'Jl. Raya Darmo No. 88, Surabaya, Jawa Timur',
    tier: 'starter',
    tierName: 'Starter Surveyor',
    status: 'expired',
    rentalFeeMonthly: 350000,
    paymentStatus: 'overdue',
    startDate: addDays(todayStr, -35),
    endDate: addDays(todayStr, -5), // Expired 5 days ago
    reportsQuota: 5,
    reportsUsed: 5,
    features: { ...DEFAULT_TIER_FEATURES.starter.features },
    brandColor: 'slate',
    reportPrefix: 'GSI-BSS',
    notes: 'Masa sewa habis 5 hari lalu. Belum melakukan transfer perpanjangan.',
    createdAt: addDays(todayStr, -35),
    updatedAt: todayStr,
  },
];

export const OWNER_DEFAULT_SESSION: AuthSession = {
  role: 'owner',
  userEmail: 'voltcheck@admin.com',
  userName: 'Admin VoltCheck',
  loginTime: new Date().toISOString(),
};

// Deleted Tenants Blacklist helpers
export function getDeletedTenantIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_TENANTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveDeletedTenantIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_DELETED_TENANTS_KEY, JSON.stringify(ids));
  } catch (e) {}
}

export function getRentalTenants(): RentalTenant[] {
  const deletedIds = getDeletedTenantIds();

  try {
    const raw = localStorage.getItem(STORAGE_RENTAL_TENANTS_KEY);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Return stored list, permanently filtering out deleted tenants
        return parsed.filter((t) => !deletedIds.includes(t.id));
      }
    }
  } catch (e) {
    console.warn('Could not read rental tenants from storage', e);
  }

  // First time initialization ONLY (if storage has never been initialized)
  try {
    const initial = INITIAL_RENTAL_TENANTS.filter((t) => !deletedIds.includes(t.id));
    localStorage.setItem(STORAGE_RENTAL_TENANTS_KEY, JSON.stringify(initial));
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
    return initial;
  } catch (e) {}

  return INITIAL_RENTAL_TENANTS.filter((t) => !deletedIds.includes(t.id));
}

export function saveRentalTenants(tenants: RentalTenant[]): void {
  const deletedIds = getDeletedTenantIds();
  const cleanTenants = tenants.filter((t) => !deletedIds.includes(t.id));

  try {
    localStorage.setItem(STORAGE_RENTAL_TENANTS_KEY, JSON.stringify(cleanTenants));
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
  } catch (e) {
    console.error('Could not save rental tenants', e);
  }
}

export function getRentalTenantById(id: string): RentalTenant | undefined {
  const tenants = getRentalTenants();
  return tenants.find((t) => t.id === id);
}

export function getRentalTenantByEmailOrCode(query: string): RentalTenant | undefined {
  const clean = query.toLowerCase().trim();
  const deletedIds = getDeletedTenantIds();
  const tenants = getRentalTenants();

  // Search exclusively in active storage (deleted tenants can never be retrieved)
  const match = tenants.find(
    (t) =>
      !deletedIds.includes(t.id) &&
      (t.email.toLowerCase().trim() === clean ||
        t.shortCode.toLowerCase().trim() === clean ||
        t.id.toLowerCase() === clean ||
        t.email.split('@')[0].toLowerCase() === clean)
  );

  return match;
}

export function saveRentalTenant(tenant: RentalTenant): RentalTenant[] {
  // If previously deleted, un-blacklist it if explicitly saved
  const deletedIds = getDeletedTenantIds();
  if (deletedIds.includes(tenant.id)) {
    saveDeletedTenantIds(deletedIds.filter((id) => id !== tenant.id));
  }

  const tenants = getRentalTenants();
  const idx = tenants.findIndex((t) => t.id === tenant.id);
  let updatedTenant: RentalTenant;
  let updated: RentalTenant[];
  if (idx >= 0) {
    updatedTenant = { ...tenant, updatedAt: new Date().toISOString() };
    updated = [...tenants];
    updated[idx] = updatedTenant;
  } else {
    updatedTenant = { ...tenant, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    updated = [updatedTenant, ...tenants];
  }
  saveRentalTenants(updated);

  // Sync with Firestore Cloud Database asynchronously
  saveTenantToFirestore(updatedTenant).catch((err) => {
    console.warn('Firestore tenant auto-save notice:', err);
  });

  return updated;
}

export function deleteRentalTenant(id: string): RentalTenant[] {
  // 1. Permanently register in deleted IDs list so it can NEVER be resurrected on reload
  const deletedIds = getDeletedTenantIds();
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    saveDeletedTenantIds(deletedIds);
  }

  // 2. Filter from active tenants and save
  const tenants = getRentalTenants();
  const updated = tenants.filter((t) => t.id !== id);
  saveRentalTenants(updated);

  // 3. Ensure initialized flag is saved
  try {
    localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
  } catch (e) {}

  // 4. Delete from Firestore Cloud Database
  deleteTenantFromFirestore(id).catch((err) => {
    console.warn('Firestore tenant delete notice:', err);
  });

  return updated;
}

export function renewTenantRental(tenantId: string, daysToAdd: number): RentalTenant | undefined {
  const tenants = getRentalTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) return undefined;

  const currentEnd = new Date(tenant.endDate);
  const now = new Date();
  
  // If already expired, start from today, else extend from existing endDate
  const baseDate = currentEnd < now ? now : currentEnd;
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  
  const newEndDate = baseDate.toISOString().split('T')[0];
  const updated: RentalTenant = {
    ...tenant,
    endDate: newEndDate,
    status: 'active',
    paymentStatus: 'paid',
    updatedAt: new Date().toISOString(),
  };

  saveRentalTenant(updated);
  return updated;
}

export function toggleTenantStatus(tenantId: string, newStatus: 'active' | 'suspended' | 'expired'): RentalTenant | undefined {
  const tenants = getRentalTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) return undefined;

  const updated: RentalTenant = {
    ...tenant,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
  saveRentalTenant(updated);
  return updated;
}

export function incrementTenantReportUsage(tenantId: string): void {
  const tenants = getRentalTenants();
  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) return;

  const updated: RentalTenant = {
    ...tenant,
    reportsUsed: tenant.reportsUsed + 1,
    updatedAt: new Date().toISOString(),
  };
  saveRentalTenant(updated);
}

export function decrementTenantReportUsage(_tenantId: string): void {
  // Intentionally disabled: report tokens are non-refundable once consumed.
  // Deleting a report does NOT restore tokens or free trial quota (strictly 1x use).
  console.info('Report tokens are permanent and non-refundable upon deletion.');
}

// Days remaining calculation helper
export function getDaysRemaining(endDateStr: string): number {
  try {
    const end = new Date(endDateStr);
    const now = new Date();
    // Normalize to midnight
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs = end.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

// Auth Session Management
// Uses sessionStorage so closing or opening a new browser tab/window always requires login first,
// while retaining session safely during page refresh within the active session.
export function getAuthSession(): AuthSession | null {
  try {
    // Clean up any legacy persistent localStorage token from previous builds
    localStorage.removeItem(STORAGE_AUTH_SESSION_KEY);

    const raw = sessionStorage.getItem(STORAGE_AUTH_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) return parsed;
    }
  } catch (e) {
    console.warn('Could not read auth session', e);
  }
  // Return null so user is always required to log in when first opening website
  return null;
}

export function setAuthSession(session: AuthSession): void {
  try {
    sessionStorage.setItem(STORAGE_AUTH_SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(STORAGE_AUTH_SESSION_KEY);
  } catch (e) {
    console.error('Could not save auth session', e);
  }
}

export function clearAuthSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_AUTH_SESSION_KEY);
    localStorage.removeItem(STORAGE_AUTH_SESSION_KEY);
  } catch (e) {}
}
