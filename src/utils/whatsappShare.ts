import { CommissioningReport } from '../types/report';
import { evaluateElectricalStatus } from './electricalValidation';

export function generateWhatsAppSummary(report: CommissioningReport): string {
  const verdict = evaluateElectricalStatus(report);
  const groundingVal = report.groundingVisual.groundingTestOhm.measurementValue || '-';
  const vrnVal = report.acPanelTesting.voltageRN.measurementValue || '-';
  const freqVal = report.acPanelTesting.frequency.measurementValue || '-';
  const vngVal = report.acPanelTesting.voltageNG.measurementValue || '-';

  const statusEmoji =
    verdict.status === 'PASSED' ? '✅' : verdict.status === 'FAILED' ? '❌' : '⚠️';

  const punchlistOpenCount =
    report.punchlist?.filter((p) => p.status !== 'Resolved').length || 0;

  const lines = [
    `⚡ *LAPORAN COMMISSIONING V-GREEN (COMM TEST V1.1)* ⚡`,
    ``,
    `📍 *Lokasi:* ${report.generalInfo.plantName || 'Plant'}`,
    `🏢 *Alamat:* ${report.generalInfo.plantAddress || '-'}`,
    `🗺️ *Koordinat:* ${report.generalInfo.plantCoordinate || '-'}`,
    `📦 *Tipe:* ${report.generalInfo.evChargerType || 'BSS 12 SLOT 3 PHASE'}`,
    `🔢 *S/N Unit:* ${report.generalInfo.snChargerUnit || '-'}`,
    `🔌 *ID PLN:* ${report.generalInfo.idPlnKodeBilling || '-'}`,
    `👷 *Vendor:* ${report.generalInfo.installationVendor || '-'} (${report.generalInfo.picVendorContact || '-'})`,
    `📅 *Tgl Commissioning:* ${report.generalInfo.commissioningDate || report.generalInfo.installationDate || '-'}`,
    ``,
    `📊 *HASIL PENGUKURAN LISTRIK:*`,
    `• Grounding: *${groundingVal} Ω* ${parseFloat(groundingVal) <= 5.0 ? '✓' : '⚠️'}`,
    `• Voltage (R-N): *${vrnVal} V*`,
    `• Voltage (N-G): *${vngVal} V*`,
    `• Frekuensi: *${freqVal} Hz*`,
    ``,
    `🏆 *STATUS KELAYAKAN:*`,
    `${statusEmoji} *${verdict.title}*`,
    `${verdict.message}`,
    ``,
    `📌 *Temuan Punchlist:* ${punchlistOpenCount === 0 ? 'Nihil / Selesai (0 open)' : `${punchlistOpenCount} item perlu tindak lanjut`}`,
    `✍️ *Approval:* ${report.approval.preparedBy.name ? `Vendor (${report.approval.preparedBy.name}) ✓` : 'Belum TTD'} | ${report.approval.checkedBy.name ? `Vgreen (${report.approval.checkedBy.name}) ✓` : 'Belum TTD'}`,
    ``,
    `_Dokumen digital lengkap & foto inspeksi tersimpan di sistem V-Green._`,
  ];

  return lines.join('\n');
}

export function openWhatsAppShare(report: CommissioningReport) {
  const text = generateWhatsAppSummary(report);
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
