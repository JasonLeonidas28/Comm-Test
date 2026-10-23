import JSZip from 'jszip';
import { CommissioningReport, PhotoItem } from '../types/report';
import { evaluateElectricalStatus } from './electricalValidation';

export async function exportReportPhotosToZip(
  report: CommissioningReport,
  onProgress?: (percent: number, currentFileName: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  const plantNameSanitized = (report.generalInfo.plantName || 'Plant').replace(/[^a-zA-Z0-9_-]/g, '_');
  const mainFolder = zip.folder(`Commissioning_${plantNameSanitized}`);

  // Create subfolders
  const bssFolder = mainFolder?.folder('01_Battery_Swap_Station');
  const simFolder = mainFolder?.folder('02_SIM_Card');
  const groundingFolder = mainFolder?.folder('03_Grounding_System');
  const panelFolder = mainFolder?.folder('04_KWH_and_AC_Panel');
  const testingFolder = mainFolder?.folder('05_AC_Panel_Testing');
  const cablesFolder = mainFolder?.folder('06_Cables');
  const punchlistFolder = mainFolder?.folder('07_Punchlist_Findings');

  // Collect all photos
  const photoTasks: Array<{
    folder: JSZip | null | undefined;
    fileName: string;
    item: PhotoItem;
  }> = [];

  // 1. BSS
  Object.entries(report.bssVisual).forEach(([key, item]) => {
    if (item.imageData) {
      photoTasks.push({
        folder: bssFolder,
        fileName: `${item.label.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`,
        item,
      });
    }
  });

  // 2. SIM Card
  Object.entries(report.simCardVisual).forEach(([key, item]) => {
    if (item.imageData) {
      photoTasks.push({
        folder: simFolder,
        fileName: `${item.label.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`,
        item,
      });
    }
  });

  // 3. Grounding
  Object.entries(report.groundingVisual).forEach(([key, item]) => {
    if (item.imageData) {
      const valStr = item.measurementValue ? `_${item.measurementValue}Ohm` : '';
      photoTasks.push({
        folder: groundingFolder,
        fileName: `${item.label.replace(/[^a-zA-Z0-9_-]/g, '_')}${valStr}.jpg`,
        item,
      });
    }
  });

  // 4. Panel & KWH
  Object.entries(report.kwhAndPanelVisual).forEach(([key, item]) => {
    if (item.imageData) {
      photoTasks.push({
        folder: panelFolder,
        fileName: `${item.label.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`,
        item,
      });
    }
  });

  // 5. Testing
  Object.entries(report.acPanelTesting).forEach(([key, item]) => {
    if (item.imageData) {
      const valStr = item.measurementValue ? `_${item.measurementValue}` : '';
      photoTasks.push({
        folder: testingFolder,
        fileName: `${item.label.replace(/[^a-zA-Z0-9_-]/g, '_')}${valStr}.jpg`,
        item,
      });
    }
  });

  // 6. Cables
  Object.entries(report.cablesVisual).forEach(([key, item]) => {
    if (item.imageData) {
      photoTasks.push({
        folder: cablesFolder,
        fileName: `${item.label.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`,
        item,
      });
    }
  });

  // 7. Punchlist
  report.punchlist?.forEach((p, idx) => {
    if (p.photoData) {
      photoTasks.push({
        folder: punchlistFolder,
        fileName: `Temuan_${idx + 1}_${p.severity}_${p.status}.jpg`,
        item: { id: p.id, label: p.description, imageData: p.photoData },
      });
    }
  });

  // Convert base64 data URL to binary and add to zip
  for (let i = 0; i < photoTasks.length; i++) {
    const task = photoTasks[i];
    if (task.folder && task.item.imageData) {
      const base64Data = task.item.imageData.split(',')[1] || task.item.imageData;
      task.folder.file(task.fileName, base64Data, { base64: true });
    }
    if (onProgress) {
      onProgress(Math.round(((i + 1) / photoTasks.length) * 80), task.fileName);
    }
  }

  // Add Summary text report
  const verdict = evaluateElectricalStatus(report);
  const summaryText = `========================================================
V-GREEN INDONESIA - PRE-COMMISSIONING REPORT (COMM TEST V1.1)
========================================================
Tanggal Ekspor : ${new Date().toLocaleString('id-ID')}
Plant Name     : ${report.generalInfo.plantName || '-'}
Alamat         : ${report.generalInfo.plantAddress || '-'}
Koordinat GPS  : ${report.generalInfo.plantCoordinate || '-'}
Google Maps    : ${report.generalInfo.gmapsLink || '-'}

Tipe Charger   : ${report.generalInfo.evChargerType || 'BSS 12 SLOT 3 PHASE'}
S/N Unit       : ${report.generalInfo.snChargerUnit || '-'}
ID PLN / Bill  : ${report.generalInfo.idPlnKodeBilling || '-'}
SIM Provider   : ${report.generalInfo.providerSim || '-'}

Vendor Pelaksana : ${report.generalInfo.installationVendor || '-'}
Kontak PIC     : ${report.generalInfo.picVendorContact || '-'}
Tgl Instalasi  : ${report.generalInfo.installationDate || '-'}
Tgl Comm       : ${report.generalInfo.commissioningDate || '-'}

--------------------------------------------------------
HASIL AUDIT PARAMETER LISTRIK & STATUS KELAYAKAN
--------------------------------------------------------
Status Akhir   : ${verdict.title}
Catatan Mutu   : ${verdict.message}

- Grounding Test : ${report.groundingVisual.groundingTestOhm.measurementValue || '-'} Ω
- Voltage (R-N)  : ${report.acPanelTesting.voltageRN.measurementValue || '-'} V
- Voltage (R-G)  : ${report.acPanelTesting.voltageRG.measurementValue || '-'} V
- Frequency      : ${report.acPanelTesting.frequency.measurementValue || '-'} Hz
- Voltage (N-G)  : ${report.acPanelTesting.voltageNG.measurementValue || '-'} V

--------------------------------------------------------
TEMUAN PUNCHLIST / DEFECTS: ${report.punchlist?.length || 0} Item
--------------------------------------------------------
${
  report.punchlist && report.punchlist.length > 0
    ? report.punchlist
        .map(
          (p, i) =>
            `${i + 1}. [${p.severity}] ${p.description} (Status: ${p.status}, Target: ${p.targetDate || '-'})`
        )
        .join('\n')
    : 'Tidak ada temuan cacat instalasi (NIL DEFECT).'
}

--------------------------------------------------------
Jumlah Foto Terekam: ${photoTasks.length} Berkas
Laporan dibuat secara sah melalui sistem V-Green Commissioning App.
========================================================`;

  mainFolder?.file('Laporan_Summary_Commissioning.txt', summaryText);

  if (onProgress) {
    onProgress(90, 'Mengompresi berkas ZIP...');
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(80 + Math.round(metadata.percent * 0.2), 'Finishing ZIP...');
    }
  });

  return zipBlob;
}
