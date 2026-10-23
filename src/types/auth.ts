export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export type TenantStatus = 'active' | 'expiring' | 'expired' | 'suspended';

export interface TenantFeatureAccess {
  allowCustomLogo: boolean;         // Izin ganti logo vendor & klien
  allowZipExport: boolean;          // Izin ekspor ZIP foto laporan
  allowGpsWatermark: boolean;       // Izin watermark GPS & stempel waktu
  allowPhotoMarkup: boolean;        // Izin anotasi / markup coretan foto
  allowBarcodeScanner: boolean;     // Izin scanner barcode charger & PLN
  allowPunchlist: boolean;          // Izin pencatatan daftar temuan punchlist
  allowCustomStatement: boolean;    // Izin kustomisasi teks legalitas berita acara
  allowExcelCsvExport: boolean;     // Izin ekspor data Excel/CSV
  maxMonthlyReports: number;        // -1 untuk Unlimited, atau batas angka (misal 10)
}

export interface TenantAccount {
  id: string;
  companyName: string;
  shortCode: string;
  email: string;
  passwordHash: string;            // Password atau PIN login
  phone: string;
  address: string;
  picName: string;
  picRole: string;
  subscriptionTier: SubscriptionTier;
  status: TenantStatus;
  rentalStartDate: string;         // Format: YYYY-MM-DD
  rentalEndDate: string;           // Format: YYYY-MM-DD
  monthlyRentalPrice: number;      // Harga sewa per bulan dalam Rupiah
  features: TenantFeatureAccess;
  reportsCreatedThisMonth: number;
  totalReportsCreated: number;
  notes?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'superadmin' | 'tenant_user';

export interface AuthSession {
  role: UserRole;
  userEmail: string;
  userName: string;
  tenantId?: string;               // Terisi jika login sebagai penyewa
  isImpersonating?: boolean;       // True jika SuperAdmin sedang menyamar sebagai tenant
  impersonatedBy?: string;         // 'admin' jika impersonating
}
