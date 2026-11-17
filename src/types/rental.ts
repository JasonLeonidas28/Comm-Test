export type RentalTier = 'trial' | 'starter' | 'pro' | 'enterprise' | 'custom';
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
  password?: string;             // Transient only in memory during form creation; stripped before Firestore persistence
  passwordHash?: string;         // Salted SHA-256 digest
  passwordSalt?: string;         // Per-tenant random hex salt
  passwordUpdatedAt?: string;
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
  trial: {
    name: 'Free Trial (1 Token)',
    price: 0,
    quota: 1, // 1 Token uji coba gratis!
    features: {
      canExportPdf: true,
      canWhiteLabel: false,
      canExportZip: false,
      canUsePunchlist: true,
      canUseAuditTools: true,
      canUseBarcodeScanner: true,
      canUseGeoLocation: true,
      allowCustomClientLogo: false,
    },
  },
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

export interface SellerSettings {
  id: string; // 'default'
  businessName: string;
  adminWhatsapp: string;
  bankPrimaryName: string;
  bankPrimaryAccount: string;
  bankPrimaryHolder: string;
  bankSecondaryName?: string;
  bankSecondaryAccount?: string;
  bankSecondaryHolder?: string;
  qrisImage?: string;
  paymentNotes?: string;
  updatedAt: string;
}

export const DEFAULT_SELLER_SETTINGS: SellerSettings = {
  id: 'default',
  businessName: 'VoltCheck Commissioning Platform',
  adminWhatsapp: '6281234567890',
  bankPrimaryName: 'Bank BCA',
  bankPrimaryAccount: 'Belum diatur (Edit di Pengaturan Penjual)',
  bankPrimaryHolder: 'Pengelola VoltCheck',
  bankSecondaryName: '',
  bankSecondaryAccount: '',
  bankSecondaryHolder: '',
  qrisImage: '',
  paymentNotes: 'Mohon sertakan nama perusahaan pada berita transfer untuk mempercepat verifikasi.',
  updatedAt: new Date().toISOString(),
};

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id: string;
  tenantId: string;
  companyName: string;
  shortCode: string;
  picName: string;
  phone: string;
  email: string;
  requestType: 'upgrade' | 'renewal' | 'activation';
  currentTier: RentalTier;
  requestedTier: RentalTier;
  requestedTierName: string;
  durationMonths: number;
  amount: number;
  senderBankOrName: string;
  proofImage: string;
  notes?: string;
  status: PaymentRequestStatus;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SecurityLogSeverity = 'info' | 'warning' | 'critical';

export type SecurityLogEventType =
  | 'login_success'
  | 'login_failed'
  | 'rate_limit_blocked'
  | 'password_updated'
  | 'password_migration'
  | 'tenant_created'
  | 'tenant_deleted'
  | 'payment_approved'
  | 'payment_rejected'
  | 'settings_updated'
  | 'report_deleted';

export interface SecurityLog {
  id: string;
  eventType: SecurityLogEventType;
  severity: SecurityLogSeverity;
  actorEmail: string;
  actorRole: 'owner' | 'tenant' | 'system' | 'anonymous';
  targetId?: string;
  summary: string;
  createdAt: string;
}


