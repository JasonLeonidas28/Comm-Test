import { TenantProfile } from '../types/tenant';
import { CommissioningReport } from '../types/report';
import { DEFAULT_VGREEN_LOGO } from './sampleData';

const STORAGE_TENANTS_KEY = 'vgreen_tenant_profiles_v1';
const STORAGE_ACTIVE_TENANT_KEY = 'vgreen_active_tenant_id_v1';

export const INITIAL_DEFAULT_PROFILES: TenantProfile[] = [
  {
    id: 'tenant-vgreen-official',
    name: 'PT V-Tech Mitra Nusantara',
    shortCode: 'VMN',
    phone: '0812-3456-7890',
    email: 'ops@vtech-mitra.co.id',
    address: 'Kawasan Industri Pulogadung Blok B No. 14, Jakarta Timur',
    website: 'www.vtech-mitra.co.id',
    picName: 'Hendra Setiawan, S.T.',
    picRole: 'Senior Commissioning Engineer',
    picPhone: '0812-8899-7711',
    clientName: 'Vgreen Indonesia',
    clientLogo: DEFAULT_VGREEN_LOGO,
    reportPrefix: 'VMN-COMM',
    brandColor: 'emerald',
    footerText: 'Dokumen Resmi Inspeksi Lapangan & Commissioning EV BSS - PT V-Tech Mitra Nusantara',
    approvalStatement:
      'This commissioning report has been prepared truthfully based on field inspections and testing results. All information contained in this report has been compiled by actual conditions and is accountable.',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tenant-surya-energi',
    name: 'PT Surya Cipta Daya EPC',
    shortCode: 'SCD',
    phone: '0811-9876-5432',
    email: 'project@suryaciptadaya.com',
    address: 'Jl. Soekarno Hatta No. 245, Bandung, Jawa Barat',
    website: 'www.suryaciptadaya.com',
    picName: 'Bambang Trianto',
    picRole: 'Project Manager BSS',
    picPhone: '0813-1122-3344',
    clientName: 'Vgreen Indonesia',
    clientLogo: DEFAULT_VGREEN_LOGO,
    reportPrefix: 'SCD-BSS',
    brandColor: 'blue',
    footerText: 'PT Surya Cipta Daya EPC - Electrical Contractor & EV Infrastructure Partner',
    approvalStatement:
      'Laporan hasil inspeksi dan pengujian commissioning stasiun swap baterai ini dibuat dengan sebenarnya sesuai kondisi fisik dan kelistrikan di lokasi proyek.',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getTenantProfiles(): TenantProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_TENANTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading tenant profiles from storage', err);
  }
  return INITIAL_DEFAULT_PROFILES;
}

export function saveTenantProfiles(profiles: TenantProfile[]): void {
  try {
    localStorage.setItem(STORAGE_TENANTS_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error('Error saving tenant profiles', err);
  }
}

export function getActiveTenantProfile(): TenantProfile {
  const profiles = getTenantProfiles();
  const activeId = localStorage.getItem(STORAGE_ACTIVE_TENANT_KEY);
  if (activeId) {
    const found = profiles.find((p) => p.id === activeId);
    if (found) return found;
  }
  const defaultProfile = profiles.find((p) => p.isDefault);
  return defaultProfile || profiles[0] || INITIAL_DEFAULT_PROFILES[0];
}

export function setActiveTenantId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_TENANT_KEY, id);
  } catch (err) {}
}

export function saveTenantProfile(profile: TenantProfile): TenantProfile[] {
  const profiles = getTenantProfiles();
  const index = profiles.findIndex((p) => p.id === profile.id);
  let updated: TenantProfile[];

  if (profile.isDefault) {
    // Unset other defaults
    profiles.forEach((p) => (p.isDefault = false));
  }

  if (index >= 0) {
    updated = [...profiles];
    updated[index] = { ...profile, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...profile, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...profiles];
  }

  saveTenantProfiles(updated);
  if (profile.isDefault || !localStorage.getItem(STORAGE_ACTIVE_TENANT_KEY)) {
    setActiveTenantId(profile.id);
  }
  return updated;
}

export function deleteTenantProfile(id: string): TenantProfile[] {
  const profiles = getTenantProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  const finalProfiles = filtered.length > 0 ? filtered : INITIAL_DEFAULT_PROFILES;
  saveTenantProfiles(finalProfiles);

  const activeId = localStorage.getItem(STORAGE_ACTIVE_TENANT_KEY);
  if (activeId === id) {
    setActiveTenantId(finalProfiles[0].id);
  }
  return finalProfiles;
}

/**
 * Applies tenant branding details to a commissioning report
 */
export function applyTenantToReport(
  report: CommissioningReport,
  tenant: TenantProfile
): CommissioningReport {
  return {
    ...report,
    generalInfo: {
      ...report.generalInfo,
      installationVendor: tenant.name,
      picVendorContact: `${tenant.picName} (${tenant.picPhone || tenant.phone})`,
      vendorLogo: tenant.logo || report.generalInfo.vendorLogo,
      vgreenLogo: tenant.clientLogo || report.generalInfo.vgreenLogo || DEFAULT_VGREEN_LOGO,
      customer: tenant.clientName || report.generalInfo.customer || 'Vgreen Indonesia',
    },
    approval: {
      ...report.approval,
      statement: tenant.approvalStatement || report.approval.statement,
      preparedBy: {
        ...report.approval.preparedBy,
        company: tenant.name,
        name: tenant.picName || report.approval.preparedBy.name,
        designation: tenant.picRole || report.approval.preparedBy.designation,
        signatureImage: tenant.picSignature || report.approval.preparedBy.signatureImage,
      },
    },
  };
}
