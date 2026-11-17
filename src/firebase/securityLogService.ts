import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { SecurityLog, SecurityLogEventType, SecurityLogSeverity } from '../types/rental';

const SECURITY_LOGS_COLLECTION = 'securityLogs';
const STORAGE_SECURITY_LOGS_KEY = 'voltcheck_security_logs_v1';
const MAX_LOCAL_LOGS = 100;

export function getLocalSecurityLogs(): SecurityLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_SECURITY_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalSecurityLogs(logs: SecurityLog[]): void {
  try {
    localStorage.setItem(STORAGE_SECURITY_LOGS_KEY, JSON.stringify(logs.slice(0, MAX_LOCAL_LOGS)));
  } catch {}
}

/**
 * Writes an immutable audit trail entry to both localStorage and Cloud Firestore `/securityLogs`.
 * Failures never block main UX operations.
 */
export async function logSecurityEvent(params: {
  eventType: SecurityLogEventType;
  severity: SecurityLogSeverity;
  actorEmail: string;
  actorRole: 'owner' | 'tenant' | 'system' | 'anonymous';
  targetId?: string;
  summary: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const entry: SecurityLog = {
    id: id.slice(0, 128),
    eventType: params.eventType,
    severity: params.severity,
    actorEmail: (params.actorEmail || 'anonymous').toLowerCase().trim().slice(0, 256),
    actorRole: params.actorRole,
    targetId: (params.targetId || '').slice(0, 128),
    summary: (params.summary || '').trim().slice(0, 400),
    createdAt: now,
  };

  const prev = getLocalSecurityLogs();
  saveLocalSecurityLogs([entry, ...prev]);

  try {
    await setDoc(doc(db, SECURITY_LOGS_COLLECTION, entry.id), entry);
  } catch (error) {
    console.warn('Security audit log cloud sync notice:', error);
  }
}

export async function getSecurityLogsFromFirestore(maxCount = 50): Promise<SecurityLog[]> {
  try {
    const q = query(
      collection(db, SECURITY_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );
    const snap = await getDocs(q);
    const logs: SecurityLog[] = [];
    snap.forEach((d) => logs.push(d.data() as SecurityLog));
    if (logs.length > 0) {
      saveLocalSecurityLogs(logs);
      return logs;
    }
  } catch (error) {
    console.warn('getSecurityLogsFromFirestore notice:', error);
  }
  return getLocalSecurityLogs();
}

export function subscribeToSecurityLogs(
  onUpdate: (logs: SecurityLog[]) => void,
  maxCount = 50
) {
  const q = query(
    collection(db, SECURITY_LOGS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: SecurityLog[] = [];
      snapshot.forEach((d) => logs.push(d.data() as SecurityLog));
      if (logs.length > 0) {
        saveLocalSecurityLogs(logs);
      }
      onUpdate(logs.length > 0 ? logs : getLocalSecurityLogs());
    },
    (error) => {
      console.warn('subscribeToSecurityLogs notice:', error);
    }
  );
}
