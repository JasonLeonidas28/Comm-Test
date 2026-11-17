import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  deleteField,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { RentalTenant } from '../types/rental';
import { createPasswordCredentials, stripPlaintextPassword } from '../utils/security';

const TENANTS_COLLECTION = 'tenants';

export async function saveTenantToFirestore(tenant: RentalTenant): Promise<void> {
  const path = `${TENANTS_COLLECTION}/${tenant.id}`;
  const ref = doc(db, TENANTS_COLLECTION, tenant.id);

  let securedTenant: RentalTenant = { ...tenant };
  if (securedTenant.password && securedTenant.password.trim() && !securedTenant.passwordHash) {
    try {
      const creds = await createPasswordCredentials(securedTenant.password.trim());
      securedTenant = { ...securedTenant, ...creds };
    } catch (e) {
      console.warn('Could not hash password during Firestore save:', e);
    }
  }

  // Strictly forbid storing plaintext password in Cloud Firestore and strip undefined keys
  const stripped = stripPlaintextPassword(securedTenant);
  const cleanFields = Object.fromEntries(
    Object.entries(stripped).filter(([, v]) => v !== undefined)
  );

  const payload = {
    ...cleanFields,
    companyName: (securedTenant.companyName || '').trim().slice(0, 256),
    email: (securedTenant.email || '').toLowerCase().trim().slice(0, 256),
    updatedAt: new Date().toISOString(),
    password: deleteField(),
  };

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllTenantsFromFirestore(): Promise<RentalTenant[]> {
  const path = TENANTS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, TENANTS_COLLECTION));
    const tenants: RentalTenant[] = [];
    snap.forEach((d) => {
      tenants.push(d.data() as RentalTenant);
    });
    return tenants;
  } catch (error) {
    console.warn('getAllTenantsFromFirestore warning:', error);
    return [];
  }
}

export async function findTenantByEmailOrShortCode(query: string): Promise<RentalTenant | null> {
  if (!query) return null;
  const clean = query.toLowerCase().trim();
  const isFullEmail = clean.includes('@');
  try {
    const tenants = await getAllTenantsFromFirestore();
    const match = tenants.find((t) => {
      if (!t) return false;
      const tEmail = (t.email || '').toLowerCase().trim();
      const tEmailPrefix = tEmail.split('@')[0].trim();
      const tCode = (t.shortCode || '').toLowerCase().trim();
      const tId = (t.id || '').toLowerCase().trim();

      if (isFullEmail) {
        return tEmail === clean || (clean.endsWith('@voltcheck') && `${tEmailPrefix}@voltcheck` === clean);
      }

      return tCode === clean || tId === clean || tEmailPrefix === clean;
    });
    return match || null;
  } catch (error) {
    console.warn('findTenantByEmailOrShortCode warning:', error);
    return null;
  }
}

export function subscribeToTenants(
  onUpdate: (tenants: RentalTenant[]) => void,
  onError?: (err: Error) => void
) {
  const path = TENANTS_COLLECTION;
  return onSnapshot(
    collection(db, TENANTS_COLLECTION),
    (snapshot) => {
      const tenants: RentalTenant[] = [];
      snapshot.forEach((d) => tenants.push(d.data() as RentalTenant));
      onUpdate(tenants);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteTenantFromFirestore(tenantId: string): Promise<void> {
  const path = `${TENANTS_COLLECTION}/${tenantId}`;
  try {
    await deleteDoc(doc(db, TENANTS_COLLECTION, tenantId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
