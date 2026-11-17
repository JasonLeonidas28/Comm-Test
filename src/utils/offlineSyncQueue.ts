import { CommissioningReport } from '../types/report';
import { saveReportToFirestore } from '../firebase/reportService';

const OFFLINE_QUEUE_KEY = 'voltcheck_offline_sync_queue_v1';

export interface OfflineQueueEntry {
  reportId: string;
  tenantId?: string;
  queuedAt: string;
}

export function getOfflineSyncQueue(): OfflineQueueEntry[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveOfflineSyncQueue(items: OfflineQueueEntry[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
  } catch {}
}

export function enqueueOfflineReport(reportId: string, tenantId?: string): OfflineQueueEntry[] {
  const existing = getOfflineSyncQueue();
  const filtered = existing.filter((item) => item.reportId !== reportId);
  const next: OfflineQueueEntry[] = [
    { reportId, tenantId, queuedAt: new Date().toISOString() },
    ...filtered,
  ];
  saveOfflineSyncQueue(next);
  return next;
}

export function removeFromOfflineQueue(reportId: string): OfflineQueueEntry[] {
  const next = getOfflineSyncQueue().filter((item) => item.reportId !== reportId);
  saveOfflineSyncQueue(next);
  return next;
}

export async function flushOfflineReportQueue(
  reports: CommissioningReport[],
  fallbackTenantId?: string
): Promise<{ syncedCount: number; remainingCount: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const current = getOfflineSyncQueue();
    return { syncedCount: 0, remainingCount: current.length };
  }

  const queue = getOfflineSyncQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  let syncedCount = 0;
  const stillPending: OfflineQueueEntry[] = [];

  for (const entry of queue) {
    const targetReport = reports.find((r) => r.id === entry.reportId);
    if (!targetReport) {
      // Report was deleted or no longer exists locally; drop from queue
      continue;
    }
    try {
      await saveReportToFirestore(targetReport, entry.tenantId || targetReport.tenantId || fallbackTenantId);
      syncedCount++;
    } catch {
      stillPending.push(entry);
    }
  }

  saveOfflineSyncQueue(stillPending);
  return { syncedCount, remainingCount: stillPending.length };
}
