export interface TenantProfile {
  id: string;
  name: string;
  shortCode: string;
  logo?: string; // base64
  phone: string;
  email: string;
  address: string;
  website?: string;
  
  // PIC / Project Manager
  picName: string;
  picRole: string;
  picPhone: string;
  picSignature?: string;

  // Client / Operator
  clientName: string;
  clientLogo?: string;

  // Branding & Report Customization
  reportPrefix: string;
  brandColor: 'emerald' | 'blue' | 'teal' | 'slate' | 'amber';
  footerText?: string;
  approvalStatement?: string;
  
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CLIENT_LOGO_NAME = 'Vgreen Indonesia';
