import JSZip from 'jszip';
import { CommissioningReport } from '../types/report';
import { evaluateGrounding, evaluateVoltagePhaseNeutral, evaluateVoltagePhasePhase, evaluateVoltageNeutralGround } from './complianceUtils';

/**
 * Downloads all report photos packaged neatly in a structured ZIP archive
 */
export async function exportReportPhotosAsZip(
  report: CommissioningReport,
  onProgress?: (percent: number, currentFileName: string) => void
): Promise<void> {
  const zip = new JSZip();

  // Create clean folders inside the zip
  const folderGeneral = zip.folder('00_Data_Proyek');
  const folderBSS = zip.folder('01_Battery_Swap_Station');
  const folderSIM = zip.folder('02_SIM_Card');
  const folderGrounding = zip.folder('03_Grounding_System');
  const folderKWH = zip.folder('04_KWH_Meter_Dan_Panel');
  const folderTesting = zip.folder('05_Pengujian_AC_Panel');
  const folderCables = zip.folder('06_Spesifikasi_Kabel');
  const folderApproval = zip.folder('07_Tanda_Tangan_Persetujuan');

  // Helper to convert base64 data URL to binary Blob/ArrayBuffer
  const addBase64ToZip = (folder: JSZip | null, filename: string, dataUrl?: string) => {
    if (!folder || !dataUrl || !dataUrl.includes('base64,')) return false;
    const base64Data = dataUrl.split('base64,')[1];
    folder.file(filename, base64Data, { base64: true });
    return true;
  };

  let totalPhotos = 0;
  let addedPhotos = 0;

  // Count items with photos first
  const checkCount = (dataUrl?: string) => {
    if (dataUrl && dataUrl.startsWith('data:image')) totalPhotos++;
  };

  const { generalInfo, bssVisual, simCardVisual, groundingVisual, kwhAndPanelVisual, acPanelTesting, cablesVisual, approval } = report;

  checkCount(generalInfo.vgreenLogo);
  checkCount(generalInfo.vendorLogo);

  Object.values(bssVisual).forEach((item) => checkCount(item.imageData));
  Object.values(simCardVisual).forEach((item) => checkCount(item.imageData));
  Object.values(groundingVisual).forEach((item) => checkCount(item.imageData));
  Object.values(kwhAndPanelVisual).forEach((item) => checkCount(item.imageData));
  Object.values(acPanelTesting).forEach((item) => checkCount(item.imageData));
  Object.values(cablesVisual).forEach((item) => checkCount(item.imageData));

  checkCount(approval.preparedBy.signatureImage);
  checkCount(approval.checkedBy.signatureImage);
  checkCount(approval.approvedBy.signatureImage);

  // Helper to process photo
  const processPhoto = (folder: JSZip | null, filename: string, dataUrl?: string) => {
    if (addBase64ToZip(folder, filename, dataUrl)) {
      addedPhotos++;
      if (onProgress && totalPhotos > 0) {
        onProgress(Math.round((addedPhotos / totalPhotos) * 100), filename);
      }
    }
  };

  // Add logos
  processPhoto(folderGeneral, 'Logo_Vgreen.png', generalInfo.vgreenLogo);
  processPhoto(folderGeneral, 'Logo_Vendor.png', generalInfo.vendorLogo);

  // Add BSS Photos
  processPhoto(folderBSS, '01_Tampak_Depan_Terbuka.jpg', bssVisual.frontViewOpen.imageData);
  processPhoto(folderBSS, '02_Tampak_Samping_Kanan.jpg', bssVisual.sideViewRight.imageData);
  processPhoto(folderBSS, '03_Tampak_Depan_Tertutup.jpg', bssVisual.frontViewClose.imageData);
  processPhoto(folderBSS, '04_Tampak_Samping_Kiri.jpg', bssVisual.sideViewLeft.imageData);
  processPhoto(folderBSS, '05_Bukti_Pondasi_40cm.jpg', bssVisual.proofFoundation40cm.imageData);
  processPhoto(folderBSS, '06_Pondasi_Cor_20cm.jpg', bssVisual.concreteFoundation20cm.imageData);
  processPhoto(folderBSS, '07_Stiker_Petunjuk.jpg', bssVisual.sticker.imageData);
  processPhoto(folderBSS, '08_Pelat_Nama_Unit.jpg', bssVisual.namePlate.imageData);
  processPhoto(folderBSS, '09_Terminasi_Kabel_AC.jpg', bssVisual.acCableTermination.imageData);
  processPhoto(folderBSS, '10_Terminasi_Grounding.jpg', bssVisual.groundingTermination.imageData);
  processPhoto(folderBSS, '11_Inlet_Kabel_AC_DC.jpg', bssVisual.acDcCableEntry.imageData);
  processPhoto(folderBSS, '12_Rambu_Keselamatan.jpg', bssVisual.visibleSafetySign.imageData);

  // Add SIM Card Photos
  processPhoto(folderSIM, '01_Kartu_Perdana.jpg', simCardVisual.kartuPerdana.imageData);
  processPhoto(folderSIM, '02_Installed_SIM_Card.jpg', simCardVisual.installedSimCard.imageData);
  processPhoto(folderSIM, '03_Signal_Bar.jpg', simCardVisual.signalBar.imageData);
  processPhoto(folderSIM, '04_URL.jpg', simCardVisual.url.imageData);
  processPhoto(folderSIM, '05_User_Interface_LCD.jpg', simCardVisual.userInterfaceLcd.imageData);

  // Add Grounding Photos
  processPhoto(folderGrounding, '01_Grounding_Rod_Connection.jpg', groundingVisual.groundingRodConnection.imageData);
  processPhoto(folderGrounding, '02_Grounding_Connected_EV_Charger.jpg', groundingVisual.groundingConnectedEvCharger.imageData);
  processPhoto(folderGrounding, '03_Grounding_Rod_To_Earth_1.jpg', groundingVisual.groundingRodToEarth1.imageData);
  processPhoto(folderGrounding, '04_Grounding_Rod_To_Earth_2.jpg', groundingVisual.groundingRodToEarth2.imageData);
  processPhoto(folderGrounding, '05_Grounding_Busbar_Panel_AC.jpg', groundingVisual.groundingBusbarPanelAc.imageData);
  processPhoto(folderGrounding, '06_Grounding_Cable_Route.jpg', groundingVisual.groundingCableRoute.imageData);
  processPhoto(folderGrounding, `07_Grounding_Test_${groundingVisual.groundingTestOhm.measurementValue || 'Ohm'}.jpg`, groundingVisual.groundingTestOhm.imageData);

  // Add KWH & Panel Photos
  processPhoto(folderKWH, '01_KWH_Meter.jpg', kwhAndPanelVisual.kwhMeter.imageData);
  processPhoto(folderKWH, '02_MCB_PLN.jpg', kwhAndPanelVisual.mcbPln.imageData);
  processPhoto(folderKWH, '03_AC_Panel_Front_Open.jpg', kwhAndPanelVisual.acPanelFrontOpen.imageData);
  processPhoto(folderKWH, '04_AC_Panel_Safety_Sign.jpg', kwhAndPanelVisual.acPanelSafetySign.imageData);
  processPhoto(folderKWH, '05_AC_Panel_Front_Close.jpg', kwhAndPanelVisual.acPanelFrontClose.imageData);
  processPhoto(folderKWH, '06_AC_Panel_Pilot_Lamps.jpg', kwhAndPanelVisual.acPanelPilotLamps.imageData);
  processPhoto(folderKWH, '07_AC_Panel_Side_Right.jpg', kwhAndPanelVisual.acPanelSideRight.imageData);
  processPhoto(folderKWH, '08_AC_Panel_Locking_System.jpg', kwhAndPanelVisual.acPanelLockingSystem.imageData);
  processPhoto(folderKWH, '09_AC_Panel_Side_Left.jpg', kwhAndPanelVisual.acPanelSideLeft.imageData);
  processPhoto(folderKWH, '10_AC_Panel_MCB.jpg', kwhAndPanelVisual.acPanelMcb.imageData);

  // Add AC Panel Testing Photos
  processPhoto(folderTesting, '01_Panel_Wiring.jpg', acPanelTesting.panelWiring.imageData);
  processPhoto(folderTesting, '02_Phase_Marking.jpg', acPanelTesting.phaseMarking.imageData);
  processPhoto(folderTesting, `03_Tegangan_R_N_${acPanelTesting.voltageRN.measurementValue || 'V'}.jpg`, acPanelTesting.voltageRN.imageData);
  processPhoto(folderTesting, `04_Tegangan_R_G_${acPanelTesting.voltageRG.measurementValue || 'V'}.jpg`, acPanelTesting.voltageRG.imageData);
  processPhoto(folderTesting, `05_Frekuensi_${acPanelTesting.frequency.measurementValue || 'Hz'}.jpg`, acPanelTesting.frequency.imageData);
  processPhoto(folderTesting, `06_Tegangan_N_G_${acPanelTesting.voltageNG.measurementValue || 'V'}.jpg`, acPanelTesting.voltageNG.imageData);
  processPhoto(folderTesting, '07_Grounding_To_AC_Panel.jpg', acPanelTesting.groundingToAcPanel.imageData);

  // Add Cables Photos
  processPhoto(folderCables, '01_Spesifikasi_Kabel.jpg', cablesVisual.cableSpec.imageData);
  processPhoto(folderCables, '02_Jalur_Kabel_1.jpg', cablesVisual.cableRouting1.imageData);
  processPhoto(folderCables, '03_Jalur_Kabel_2.jpg', cablesVisual.cableRouting2.imageData);
  processPhoto(folderCables, '04_Jalur_Kabel_3.jpg', cablesVisual.cableRouting3.imageData);
  processPhoto(folderCables, '05_Jalur_Kabel_4.jpg', cablesVisual.cableRouting4.imageData);

  // Add Signatures
  processPhoto(folderApproval, '01_TTD_PreparedBy_Vendor.png', approval.preparedBy.signatureImage);
  processPhoto(folderApproval, '02_TTD_CheckedBy_SetupSpecialist.png', approval.checkedBy.signatureImage);
  processPhoto(folderApproval, '03_TTD_ApprovedBy_HeadOfSetup.png', approval.approvedBy.signatureImage);

  // Add Summary Text File
  const summaryText = `=====================================================
LAPORAN PRE-COMMISSIONING TEST REPORT - V-GREEN INDONESIA
=====================================================
Plant Name         : ${generalInfo.plantName || '-'}
Alamat             : ${generalInfo.plantAddress || '-'}
Koordinat          : ${generalInfo.plantCoordinate || '-'}
Google Maps        : ${generalInfo.gmapsLink || '-'}
Tipe EV Charger    : ${generalInfo.evChargerType || '-'}
S/N Charger Unit   : ${generalInfo.snChargerUnit || '-'}
ID PLN / Billing   : ${generalInfo.idPlnKodeBilling || '-'}
Provider SIM       : ${generalInfo.providerSim || '-'}
Vendor Pelaksana   : ${generalInfo.installationVendor || '-'}
PIC Vendor / Kontak: ${generalInfo.picVendorContact || '-'}
Tgl Instalasi      : ${generalInfo.installationDate || '-'}
Tgl Commissioning  : ${generalInfo.commissioningDate || '-'}

HASIL PENGUJIAN KELISTRIKAN:
-----------------------------------------------------
1. Nilai Tahanan Grounding : ${groundingVisual.groundingTestOhm.measurementValue || '-'} Ω (${evaluateGrounding(groundingVisual.groundingTestOhm.measurementValue).label})
2. Tegangan Tegangan Fasa-Netral & Ground:
   - R - N   : ${acPanelTesting.voltageRN.measurementValue || '-'} V (${evaluateVoltagePhaseNeutral(acPanelTesting.voltageRN.measurementValue).label})
   - R - G   : ${acPanelTesting.voltageRG.measurementValue || '-'} V
   - Frekuensi: ${acPanelTesting.frequency.measurementValue || '-'} Hz
   - N - G   : ${acPanelTesting.voltageNG.measurementValue || '-'} V (${evaluateVoltageNeutralGround(acPanelTesting.voltageNG.measurementValue).label})

STATUS APPROVAL:
-----------------------------------------------------
- Prepared By : ${approval.preparedBy.name} (${approval.preparedBy.company}) - Tgl: ${approval.preparedBy.date || '-'}
- Checked By  : ${approval.checkedBy.name} (${approval.checkedBy.company}) - Tgl: ${approval.checkedBy.date || '-'}
- Approved By : ${approval.approvedBy.name} (${approval.approvedBy.company}) - Tgl: ${approval.approvedBy.date || '-'}

Total Dokumentasi Foto Tersimpan: ${addedPhotos} file
Diunduh pada: ${new Date().toLocaleString('id-ID')}
=====================================================`;

  zip.file('Ringkasan_Laporan_Commissioning.txt', summaryText);

  // Generate ZIP blob and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const cleanPlant = (generalInfo.plantName || 'VGREEN_REPORT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipFilename = `Dokumentasi_Foto_${cleanPlant}_${dateStr}.zip`;

  const downloadUrl = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Exports summary data to CSV format for Microsoft Excel or Google Sheets
 */
export function exportReportSummaryCSV(report: CommissioningReport): void {
  const { generalInfo, groundingVisual, acPanelTesting, approval } = report;

  const rows = [
    ['PARAMETER', 'NILAI', 'STANDAR / TOLERANSI', 'STATUS KELAYAKAN'],
    ['Plant Name', `"${generalInfo.plantName || '-'}"`, '-', '-'],
    ['Alamat Plant', `"${generalInfo.plantAddress?.replace(/"/g, '""') || '-'}"`, '-', '-'],
    ['Koordinat GPS', `"${generalInfo.plantCoordinate || '-'}"`, '-', '-'],
    ['Link Google Maps', `"${generalInfo.gmapsLink || '-'}"`, '-', '-'],
    ['Tipe EV Charger', `"${generalInfo.evChargerType || '-'}"`, '-', '-'],
    ['S/N Charger Unit', `"${generalInfo.snChargerUnit || '-'}"`, '-', '-'],
    ['ID PLN / Kode Billing', `"${generalInfo.idPlnKodeBilling || '-'}"`, '-', '-'],
    ['Provider SIM Card', `"${generalInfo.providerSim || '-'}"`, '-', '-'],
    ['Vendor Instalasi', `"${generalInfo.installationVendor || '-'}"`, '-', '-'],
    ['PIC Vendor & Kontak', `"${generalInfo.picVendorContact || '-'}"`, '-', '-'],
    ['Tanggal Instalasi', `"${generalInfo.installationDate || '-'}"`, '-', '-'],
    ['Tanggal Commissioning', `"${generalInfo.commissioningDate || '-'}"`, '-', '-'],
    ['', '', '', ''],
    ['HASIL UKUR KELISTRIKAN', '', '', ''],
    [
      'Tahanan Grounding (Earth)',
      `"${groundingVisual.groundingTestOhm.measurementValue || '-'} Ohm"`,
      'Maksimal 5.0 Ohm (PUIL)',
      evaluateGrounding(groundingVisual.groundingTestOhm.measurementValue).label,
    ],
    [
      'Tegangan R-N',
      `"${acPanelTesting.voltageRN.measurementValue || '-'} V"`,
      'Nominal 220 V (+-10%)',
      evaluateVoltagePhaseNeutral(acPanelTesting.voltageRN.measurementValue).label,
    ],
    [
      'Tegangan R-G',
      `"${acPanelTesting.voltageRG.measurementValue || '-'} V"`,
      'Nominal 220 V (+-10%)',
      '-',
    ],
    [
      'Frekuensi Listrik',
      `"${acPanelTesting.frequency.measurementValue || '-'} Hz"`,
      'Standar PLN 50 Hz (+-1%)',
      'Normal',
    ],
    [
      'Tegangan N-G',
      `"${acPanelTesting.voltageNG.measurementValue || '-'} V"`,
      'Aman <= 2.0 V (Maks 5 V)',
      evaluateVoltageNeutralGround(acPanelTesting.voltageNG.measurementValue).label,
    ],
    ['', '', '', ''],
    ['PERSETUJUAN (SIGN-OFF)', '', '', ''],
    ['Prepared By', `"${approval.preparedBy.name} (${approval.preparedBy.company})"`, `Tgl: ${approval.preparedBy.date || '-'}`, approval.preparedBy.signatureImage ? 'Sudah TTD' : 'Belum TTD'],
    ['Checked By', `"${approval.checkedBy.name} (${approval.checkedBy.company})"`, `Tgl: ${approval.checkedBy.date || '-'}`, approval.checkedBy.signatureImage ? 'Sudah TTD' : 'Belum TTD'],
    ['Approved By', `"${approval.approvedBy.name} (${approval.approvedBy.company})"`, `Tgl: ${approval.approvedBy.date || '-'}`, approval.approvedBy.signatureImage ? 'Sudah TTD' : 'Belum TTD'],
  ];

  const csvContent = '\uFEFF' + rows.map((e) => e.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanPlant = (generalInfo.plantName || 'VGREEN_REPORT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Rekap_Commissioning_${cleanPlant}_${new Date().toISOString().slice(0, 10)}.csv`;

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
