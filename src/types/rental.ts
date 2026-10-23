export type RentalTier = 'starter' | 'pro' | 'enterprise' | 'custom';
export type RentalStatus = 'active' | 'trial' | 'expired' | 'suspended';

export interface TenantFeatures {
  canExportPdf: boolean;          // Cetak / Export PDF resmi BAST
  canWhiteLabel: boolean;         // Ganti logo vendor & tanda tangan sendiri
  canExportZip: boolean;          // Download arsip ZIP semua foto
  canUsePunchlist: boolean;       // Akses fitur Punchlist / Temuan
  canUseAuditTools: boolean;      // Banner evaluasi PUIL & Grounding Analyzer
  canUseBarcodeScanner: boolean;  // Scanner barcode / QR code nomor seri baterai
  canUseGeoLocation: boolean;     // Auto GPS & Geotagging foto
  allowCustomClientLogo: boolean; // Ganti logo V-Green dengan logo client lain
}

export interface RentalTenant {
  id: string;
  companyName: string;
  shortCode: string;
  email: string;
  password?: string;
  picName: string;
  phone: string;                  // WhatsApp
  address: string;
  
  // Sewa & Paket
  tier: RentalTier;
  tierName: string;               // e.g. "Pro Surveyor", "Starter", "Enterprise"
  status: RentalStatus;
  rentalFeeMonthly: number;       // Rp per bulan
  paymentStatus: 'paid' | 'pending' | 'overdue';
  
  // Durasi sewa
  startDate: string;              // ISO string or YYYY-MM-DD
  endDate: string;                // Tanggal jatuh tempo
  
  // Kuota Laporan
  reportsQuota: number;           // -1 for unlimited
  reportsUsed: number;
  
  // Izin Fitur
  features: TenantFeatures;

  // Branding bawaan penyewa
  logo?: string;
  brandColor?: 'emerald' | 'blue' | 'teal' | 'slate' | 'amber';
  reportPrefix?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthRole = 'owner' | 'tenant';

export interface AuthSession {
  role: AuthRole;
  tenantId?: string;       // Ada jika role === 'tenant'
  tenantName?: string;
  userEmail: string;
  userName: string;
  loginTime: string;
  impersonatedByOwner?: boolean; // Jika owner sedang login sebagai tenant
}

export const DEFAULT_TIER_FEATURES: Record<RentalTier, { name: string; price: number; quota: number; features: TenantFeatures }> = {
  starter: {
    name: 'Starter Surveyor',
    price: 350000,
    quota: 5,
    features: {
      canExportPdf: true,
      canWhiteLabel: false,
      canExportZip: false,
      canUsePunchlist: true,
      canUseAuditTools: false,
      canUseBarcodeScanner: true,
      canUseGeoLocation: true,
      allowCustomClientLogo: false,
    },
  },
  pro: {
    name: 'Pro Commissioning',
    price: 850000,
    quota: 20,
    features: {
      canExportPdf: true,
      canWhiteLabel: true,
      canExportZip: true,
      canUsePunchlist: true,
      canUseAuditTools: true,
      canUseBarcodeScanner: true,
      canUseGeoLocation: true,
      allowCustomClientLogo: true,
    },
  },
  enterprise: {
    name: 'Enterprise Unlimited',
    price: 2500000,
    quota: -1, // Unlimited
    features: {
      canExportPdf: true,
      canWhiteLabel: true,
      canExportZip: true,
      canUsePunchlist: true,
      canUseAuditTools: true,
      canUseBarcodeScanner: true,
      canUseGeoLocation: true,
      allowCustomClientLogo: true,
    },
  },
  custom: {
    name: 'Paket Kustom',
    price: 1200000,
    quota: 30,
    features: {
      canExportPdf: true,
      canWhiteLabel: true,
      canExportZip: true,
      canUsePunchlist: true,
      canUseAuditTools: true,
      canUseBarcodeScanner: true,
      canUseGeoLocation: true,
      allowCustomClientLogo: true,
    },
  },
};
