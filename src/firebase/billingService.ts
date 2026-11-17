import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import {
  SellerSettings,
  DEFAULT_SELLER_SETTINGS,
  PaymentRequest,
  DEFAULT_TIER_FEATURES,
  RentalTenant,
} from '../types/rental';
import { getRentalTenantById, saveRentalTenant } from '../utils/rentalStorage';

const SELLER_SETTINGS_COLLECTION = 'sellerSettings';
const SELLER_SETTINGS_DOC_ID = 'default';
const PAYMENT_REQUESTS_COLLECTION = 'paymentRequests';

const STORAGE_SELLER_SETTINGS_KEY = 'voltcheck_seller_settings_v1';
const STORAGE_PAYMENT_REQUESTS_KEY = 'voltcheck_payment_requests_v1';

/**
 * Formats any Indonesian phone / WhatsApp input into clean `628...` format for `wa.me/` links.
 */
export function formatWhatsappNumber(rawPhone: string | undefined): string {
  const digits = (rawPhone || '').replace(/[^0-9]/g, '');
  if (!digits) return '6281234567890';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/**
 * Compresses an uploaded proof-of-transfer or QRIS image into a compact JPEG DataURL
 * strictly under ~250KB so it safely fits inside a Firestore document (<1MB limit).
 */
export async function compressBillingImage(file: File, maxDim = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL('image/jpeg', quality);
        // Further reduce quality if still larger than ~350KB
        if (compressed.length > 350000) {
          compressed = canvas.toDataURL('image/jpeg', 0.52);
        }
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Gagal memproses gambar bukti transfer.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

// =======================
// SELLER SETTINGS HELPERS
// =======================

export function getLocalSellerSettings(): SellerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SELLER_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SELLER_SETTINGS, ...parsed, id: SELLER_SETTINGS_DOC_ID };
      }
    }
  } catch (e) {}
  return { ...DEFAULT_SELLER_SETTINGS };
}

export function saveLocalSellerSettings(settings: SellerSettings): void {
  try {
    localStorage.setItem(STORAGE_SELLER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not cache seller settings locally', e);
  }
}

export async function getSellerSettingsFromFirestore(): Promise<SellerSettings> {
  const path = `${SELLER_SETTINGS_COLLECTION}/${SELLER_SETTINGS_DOC_ID}`;
  try {
    const snap = await getDoc(doc(db, SELLER_SETTINGS_COLLECTION, SELLER_SETTINGS_DOC_ID));
    if (snap.exists()) {
      const data = { ...DEFAULT_SELLER_SETTINGS, ...(snap.data() as SellerSettings), id: SELLER_SETTINGS_DOC_ID };
      saveLocalSellerSettings(data);
      return data;
    }
  } catch (error) {
    console.warn('getSellerSettingsFromFirestore notice:', error);
  }
  return getLocalSellerSettings();
}

export async function saveSellerSettings(settings: SellerSettings): Promise<SellerSettings> {
  const clean: SellerSettings = {
    ...DEFAULT_SELLER_SETTINGS,
    ...settings,
    id: SELLER_SETTINGS_DOC_ID,
    businessName: (settings.businessName || DEFAULT_SELLER_SETTINGS.businessName).trim().slice(0, 128),
    adminWhatsapp: formatWhatsappNumber(settings.adminWhatsapp).slice(0, 32),
    bankPrimaryName: (settings.bankPrimaryName || '').trim().slice(0, 64),
    bankPrimaryAccount: (settings.bankPrimaryAccount || '').trim().slice(0, 64),
    bankPrimaryHolder: (settings.bankPrimaryHolder || '').trim().slice(0, 128),
    bankSecondaryName: (settings.bankSecondaryName || '').trim().slice(0, 64),
    bankSecondaryAccount: (settings.bankSecondaryAccount || '').trim().slice(0, 64),
    bankSecondaryHolder: (settings.bankSecondaryHolder || '').trim().slice(0, 128),
    qrisImage: (settings.qrisImage || '').slice(0, 450000),
    paymentNotes: (settings.paymentNotes || '').trim().slice(0, 500),
    updatedAt: new Date().toISOString(),
  };

  saveLocalSellerSettings(clean);
  const path = `${SELLER_SETTINGS_COLLECTION}/${SELLER_SETTINGS_DOC_ID}`;
  try {
    await setDoc(doc(db, SELLER_SETTINGS_COLLECTION, SELLER_SETTINGS_DOC_ID), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
  return clean;
}

export function subscribeToSellerSettings(
  onUpdate: (settings: SellerSettings) => void,
  onError?: (err: Error) => void
) {
  const path = `${SELLER_SETTINGS_COLLECTION}/${SELLER_SETTINGS_DOC_ID}`;
  return onSnapshot(
    doc(db, SELLER_SETTINGS_COLLECTION, SELLER_SETTINGS_DOC_ID),
    (snap) => {
      if (snap.exists()) {
        const merged = { ...DEFAULT_SELLER_SETTINGS, ...(snap.data() as SellerSettings), id: SELLER_SETTINGS_DOC_ID };
        saveLocalSellerSettings(merged);
        onUpdate(merged);
      }
    },
    (error) => {
      if (onError) onError(error);
      console.warn(`Firestore listener notice on ${path}:`, error);
    }
  );
}

// ========================
// PAYMENT REQUESTS HELPERS
// ========================

export function getLocalPaymentRequests(): PaymentRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENT_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveLocalPaymentRequests(items: PaymentRequest[]): void {
  try {
    localStorage.setItem(STORAGE_PAYMENT_REQUESTS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not cache payment requests locally', e);
  }
}

export async function createOrUpdatePaymentRequest(req: PaymentRequest): Promise<PaymentRequest> {
  const now = new Date().toISOString();
  const payload: PaymentRequest = {
    ...req,
    id: req.id.slice(0, 128),
    tenantId: req.tenantId.slice(0, 128),
    companyName: (req.companyName || '').trim().slice(0, 256),
    shortCode: (req.shortCode || 'BSS').trim().slice(0, 16),
    picName: (req.picName || '').trim().slice(0, 128),
    phone: (req.phone || '').trim().slice(0, 32),
    email: (req.email || '').trim().toLowerCase().slice(0, 256),
    requestedTierName: (req.requestedTierName || '').trim().slice(0, 128),
    senderBankOrName: (req.senderBankOrName || '').trim().slice(0, 128),
    proofImage: (req.proofImage || '').slice(0, 500000),
    notes: (req.notes || '').trim().slice(0, 500),
    rejectionReason: (req.rejectionReason || '').trim().slice(0, 300),
    createdAt: req.createdAt || now,
    updatedAt: now,
  };

  // Update local cache
  const existing = getLocalPaymentRequests();
  const idx = existing.findIndex((item) => item.id === payload.id);
  const nextList = idx >= 0
    ? existing.map((item, i) => (i === idx ? payload : item))
    : [payload, ...existing];
  saveLocalPaymentRequests(nextList);

  const path = `${PAYMENT_REQUESTS_COLLECTION}/${payload.id}`;
  try {
    await setDoc(doc(db, PAYMENT_REQUESTS_COLLECTION, payload.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
  return payload;
}

export async function getAllPaymentRequestsFromFirestore(tenantId?: string): Promise<PaymentRequest[]> {
  try {
    const q = tenantId
      ? query(collection(db, PAYMENT_REQUESTS_COLLECTION), where('tenantId', '==', tenantId))
      : query(collection(db, PAYMENT_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const items: PaymentRequest[] = [];
    snap.forEach((d) => items.push(d.data() as PaymentRequest));
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (!tenantId) saveLocalPaymentRequests(items);
    return items;
  } catch (error) {
    console.warn('getAllPaymentRequestsFromFirestore notice:', error);
    const local = getLocalPaymentRequests();
    return tenantId ? local.filter((r) => r.tenantId === tenantId) : local;
  }
}

export function subscribeToPaymentRequests(
  onUpdate: (requests: PaymentRequest[]) => void,
  onError?: (err: Error) => void,
  tenantId?: string
) {
  const path = PAYMENT_REQUESTS_COLLECTION;
  const q = tenantId
    ? query(collection(db, PAYMENT_REQUESTS_COLLECTION), where('tenantId', '==', tenantId))
    : query(collection(db, PAYMENT_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: PaymentRequest[] = [];
      snapshot.forEach((d) => items.push(d.data() as PaymentRequest));
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (!tenantId) saveLocalPaymentRequests(items);
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      console.warn(`Firestore listener notice on ${path}:`, error);
    }
  );
}

/**
 * 1-Click Approval by Admin:
 * 1. Marks PaymentRequest as 'approved'
 * 2. Activates / upgrades / extends the Tenant's subscription, quota & features
 */
export async function approvePaymentRequest(req: PaymentRequest): Promise<RentalTenant | undefined> {
  const now = new Date();
  const nowIso = now.toISOString();
  const approvedReq: PaymentRequest = {
    ...req,
    status: 'approved',
    processedAt: nowIso,
    updatedAt: nowIso,
  };
  await createOrUpdatePaymentRequest(approvedReq);

  const tenant = getRentalTenantById(req.tenantId);
  if (!tenant) return undefined;

  const targetConf = DEFAULT_TIER_FEATURES[req.requestedTier] || DEFAULT_TIER_FEATURES.pro;
  const daysToAdd = Math.max(1, req.durationMonths || 1) * 30;

  // Compute new expiry date: if upgrading from trial or expired, start from today; if active paid renewal, extend from endDate
  const existingEnd = new Date(tenant.endDate);
  const baseDate =
    tenant.tier === 'trial' || tenant.status === 'expired' || isNaN(existingEnd.getTime()) || existingEnd < now
      ? new Date(now)
      : existingEnd;
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  const newEndDate = baseDate.toISOString().split('T')[0];

  // Calculate new quota cleanly
  let newQuota = targetConf.quota;
  if (targetConf.quota !== -1) {
    // If renewing the same paid tier with existing usage, add quota for the purchased duration or ensure unused + new quota
    if (req.requestType === 'renewal' && tenant.tier === req.requestedTier && tenant.reportsQuota > 0) {
      newQuota = Math.max(tenant.reportsUsed, 0) + targetConf.quota * Math.max(1, req.durationMonths || 1);
    } else {
      // Upgrading from trial/starter -> grant full package quota * months on top of already-used trial/previous count if needed
      newQuota = Math.max(tenant.reportsUsed, 0) + targetConf.quota * Math.max(1, req.durationMonths || 1);
    }
  }

  const updatedTenant: RentalTenant = {
    ...tenant,
    tier: req.requestedTier,
    tierName: targetConf.name,
    status: 'active',
    rentalFeeMonthly: targetConf.price,
    paymentStatus: 'paid',
    startDate: tenant.tier === 'trial' ? now.toISOString().split('T')[0] : tenant.startDate,
    endDate: newEndDate,
    reportsQuota: newQuota,
    features: { ...targetConf.features },
    updatedAt: nowIso,
  };

  saveRentalTenant(updatedTenant);
  return updatedTenant;
}

export async function rejectPaymentRequest(req: PaymentRequest, reason: string): Promise<PaymentRequest> {
  const nowIso = new Date().toISOString();
  const rejectedReq: PaymentRequest = {
    ...req,
    status: 'rejected',
    rejectionReason: reason.trim() || 'Bukti transfer tidak sesuai / belum masuk mutasi rekening.',
    processedAt: nowIso,
    updatedAt: nowIso,
  };
  return createOrUpdatePaymentRequest(rejectedReq);
}
