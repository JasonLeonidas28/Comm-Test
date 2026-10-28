import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { CommissioningReport, PhotoItem } from '../types/report';

const REPORTS_COLLECTION = 'reports';

// Section keys in CommissioningReport that contain PhotoItem records
const PHOTO_SECTION_KEYS = [
  'bssVisual',
  'simCardVisual',
  'groundingVisual',
  'kwhAndPanelVisual',
  'acPanelTesting',
  'cablesVisual',
] as const;

type PhotoSectionKey = typeof PHOTO_SECTION_KEYS[number];

/**
 * Extracts all photo items from a report into separate records for the subcollection,
 * keeping the parent document lightweight and strictly under Firestore's 1MB limit.
 */
function extractPhotosFromReport(report: CommissioningReport): Array<{
  photoKey: string;
  sectionKey: string;
  item: PhotoItem;
}> {
  const photos: Array<{ photoKey: string; sectionKey: string; item: PhotoItem }> = [];

  for (const sectionKey of PHOTO_SECTION_KEYS) {
    const section = (report as any)[sectionKey];
    if (section && typeof section === 'object') {
      for (const [key, val] of Object.entries(section)) {
        if (val && typeof val === 'object' && 'label' in (val as any)) {
          const item = val as PhotoItem;
          // Only save to subcollection if it has an image or metadata
          if (item.imageData || item.measurementValue || item.caption) {
            photos.push({
              photoKey: key,
              sectionKey,
              item,
            });
          }
        }
      }
    }
  }

  return photos;
}

/**
 * Strips heavy base64 imageData from the main document to ensure it never exceeds 1MB.
 */
function sanitizeReportForMainDoc(report: CommissioningReport): any {
  const sanitized = JSON.parse(JSON.stringify(report));

  for (const sectionKey of PHOTO_SECTION_KEYS) {
    const section = sanitized[sectionKey];
    if (section && typeof section === 'object') {
      for (const key of Object.keys(section)) {
        if (section[key]) {
          // Remove heavy imageData from main doc; the subcollection stores it
          delete section[key].imageData;
        }
      }
    }
  }

  return sanitized;
}

/**
 * Saves a commissioning report to Firestore:
 * 1. Writes lightweight report metadata to `/reports/{reportId}`
 * 2. Writes individual photo items with image data to `/reports/{reportId}/photos/{photoKey}`
 */
export async function saveReportToFirestore(
  report: CommissioningReport,
  tenantId?: string
): Promise<void> {
  const reportPath = `${REPORTS_COLLECTION}/${report.id}`;
  const reportRef = doc(db, REPORTS_COLLECTION, report.id);

  try {
    const mainDocData = sanitizeReportForMainDoc(report);
    mainDocData.id = report.id;
    mainDocData.title = report.title || report.generalInfo?.plantName || 'Laporan Commissioning BSS';
    mainDocData.createdAt = report.createdAt || new Date().toISOString();
    mainDocData.tenantId = tenantId || report.generalInfo?.installationVendor || 'vgreen-main';
    mainDocData.creatorUid = auth.currentUser?.uid || 'anonymous';
    mainDocData.creatorEmail = auth.currentUser?.email || 'unauthenticated';
    mainDocData.updatedAt = new Date().toISOString();

    await setDoc(reportRef, mainDocData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, reportPath);
  }

  // Save photos in subcollection
  const photos = extractPhotosFromReport(report);
  for (const { photoKey, sectionKey, item } of photos) {
    const photoDocId = `${sectionKey}_${photoKey}`;
    const photoPath = `${REPORTS_COLLECTION}/${report.id}/photos/${photoDocId}`;
    const photoRef = doc(db, REPORTS_COLLECTION, report.id, 'photos', photoDocId);

    try {
      await setDoc(photoRef, {
        id: photoDocId,
        reportId: report.id,
        sectionKey,
        photoKey,
        label: item.label || '',
        sublabel: item.sublabel || '',
        imageData: item.imageData || '',
        measurementValue: item.measurementValue || '',
        measurementUnit: item.measurementUnit || '',
        caption: item.caption || '',
        timestamp: item.timestamp || '',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, photoPath);
    }
  }
}

/**
 * Fetches a single complete commissioning report from Firestore,
 * combining main doc metadata with all subcollection photos.
 */
export async function getReportFromFirestore(
  reportId: string
): Promise<CommissioningReport | null> {
  const reportPath = `${REPORTS_COLLECTION}/${reportId}`;
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);

  let docSnap;
  try {
    docSnap = await getDoc(reportRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, reportPath);
  }

  if (!docSnap || !docSnap.exists()) {
    return null;
  }

  const report = docSnap.data() as CommissioningReport;

  // Retrieve subcollection photos
  const photosPath = `${REPORTS_COLLECTION}/${reportId}/photos`;
  try {
    const photosSnap = await getDocs(collection(db, REPORTS_COLLECTION, reportId, 'photos'));
    photosSnap.forEach((photoDoc) => {
      const data = photoDoc.data();
      const sectionKey = data.sectionKey as PhotoSectionKey;
      const photoKey = data.photoKey;

      if (sectionKey && (report as any)[sectionKey] && (report as any)[sectionKey][photoKey]) {
        (report as any)[sectionKey][photoKey] = {
          ...(report as any)[sectionKey][photoKey],
          imageData: data.imageData || (report as any)[sectionKey][photoKey].imageData,
          measurementValue: data.measurementValue || (report as any)[sectionKey][photoKey].measurementValue,
          timestamp: data.timestamp || (report as any)[sectionKey][photoKey].timestamp,
          caption: data.caption || (report as any)[sectionKey][photoKey].caption,
        };
      }
    });
  } catch (error) {
    console.warn(`Photos subcollection fetch note for ${photosPath}:`, error);
  }

  return report;
}

/**
 * Fetches all reports from Firestore with their photos.
 */
export async function getAllReportsFromFirestore(): Promise<CommissioningReport[]> {
  const path = REPORTS_COLLECTION;
  let snapshot;

  try {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('updatedAt', 'desc'));
    snapshot = await getDocs(q);
  } catch (error) {
    // Fallback without orderBy if index is still pending
    try {
      snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, path);
    }
  }

  const reports: CommissioningReport[] = [];
  if (snapshot) {
    for (const docItem of snapshot.docs) {
      const report = await getReportFromFirestore(docItem.id);
      if (report) {
        reports.push(report);
      }
    }
  }

  return reports;
}

/**
 * Subscribes to real-time updates of the reports collection.
 */
export function subscribeToReports(
  onUpdate: (reports: CommissioningReport[]) => void,
  onError?: (err: Error) => void
) {
  const path = REPORTS_COLLECTION;
  const colRef = collection(db, REPORTS_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      const reports: CommissioningReport[] = [];
      for (const d of snapshot.docs) {
        try {
          const rep = await getReportFromFirestore(d.id);
          if (rep) reports.push(rep);
        } catch (e) {
          console.warn('Error hydrating real-time report doc', d.id, e);
        }
      }
      onUpdate(reports);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Deletes a report and its photos from Firestore.
 */
export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  const reportPath = `${REPORTS_COLLECTION}/${reportId}`;
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);

  // 1. Delete all photos in subcollection
  try {
    const photosSnap = await getDocs(collection(db, REPORTS_COLLECTION, reportId, 'photos'));
    const batch = writeBatch(db);
    photosSnap.forEach((photoDoc) => {
      batch.delete(photoDoc.ref);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Could not clean subcollection photos batch:', e);
  }

  // 2. Delete main report document
  try {
    await deleteDoc(reportRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, reportPath);
  }
}
