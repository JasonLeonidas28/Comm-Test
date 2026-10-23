import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CommissioningReport } from '../types/report';
import { evaluateGrounding, evaluateVoltageNeutralGround } from '../utils/complianceUtils';

interface MissingItem {
  sectionId: number;
  sectionName: string;
  itemId: string;
  itemLabel: string;
}

interface CompletionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CommissioningReport;
  onNavigateToSection: (sectionTab: number) => void;
}

export const CompletionAuditModal: React.FC<CompletionAuditModalProps> = ({
  isOpen,
  onClose,
  report,
  onNavigateToSection,
}) => {
  if (!isOpen) return null;

  const { generalInfo, bssVisual, simCardVisual, groundingVisual, kwhAndPanelVisual, acPanelTesting, cablesVisual, approval } = report;

  // Track sections and missing items
  const missingItems: MissingItem[] = [];

  const checkPhotos = (tabIndex: number, sectionName: string, items: Record<string, { id: string; label: string; imageData?: string }>) => {
    let filled = 0;
    const total = Object.keys(items).length;
    Object.values(items).forEach((item) => {
      if (item.imageData) {
        filled++;
      } else {
        missingItems.push({
          sectionId: tabIndex,
          sectionName,
          itemId: item.id,
          itemLabel: item.label,
        });
      }
    });
    return { filled, total };
  };

  const bssStats = checkPhotos(1, '1. Battery Swap Station', bssVisual);
  const simStats = checkPhotos(2, '2. SIM Card', simCardVisual);
  const groundingStats = checkPhotos(3, '3. Grounding System', groundingVisual);
  const kwhStats = checkPhotos(4, '4. KWH Meter & AC Panel', kwhAndPanelVisual);
  const acTestingStats = checkPhotos(5, '5. AC Panel Testing', acPanelTesting);
  const cablesStats = checkPhotos(6, '6. Kabel & Routing', cablesVisual);

  // Signatures
  let signaturesFilled = 0;
  if (approval.preparedBy.signatureImage) signaturesFilled++;
  else missingItems.push({ sectionId: 7, sectionName: '7. Approval', itemId: 'preparedBy', itemLabel: 'Tanda Tangan Vendor (Prepared By)' });

  if (approval.checkedBy.signatureImage) signaturesFilled++;
  else missingItems.push({ sectionId: 7, sectionName: '7. Approval', itemId: 'checkedBy', itemLabel: 'Tanda Tangan Setup Specialist (Checked By)' });

  if (approval.approvedBy.signatureImage) signaturesFilled++;
  else missingItems.push({ sectionId: 7, sectionName: '7. Approval', itemId: 'approvedBy', itemLabel: 'Tanda Tangan Head of Setup (Approved By)' });

  // General info check
  const generalFields = [
    { key: 'plantName', label: 'Nama Plant' },
    { key: 'plantAddress', label: 'Alamat Plant' },
    { key: 'plantCoordinate', label: 'Koordinat GPS' },
    { key: 'evChargerType', label: 'Tipe EV Charger' },
    { key: 'snChargerUnit', label: 'S/N Unit Charger' },
    { key: 'idPlnKodeBilling', label: 'ID PLN / Kode Billing' },
    { key: 'installationVendor', label: 'Vendor Pelaksana' },
  ];

  let generalFilled = 0;
  generalFields.forEach((f) => {
    if ((generalInfo as any)[f.key]) generalFilled++;
    else missingItems.push({ sectionId: 0, sectionName: '0. Data Proyek', itemId: f.key, itemLabel: f.label });
  });

  const totalPhotosFilled = bssStats.filled + simStats.filled + groundingStats.filled + kwhStats.filled + acTestingStats.filled + cablesStats.filled;
  const totalPhotosCount = bssStats.total + simStats.total + groundingStats.total + kwhStats.total + acTestingStats.total + cablesStats.total;
  const photoPercent = Math.round((totalPhotosFilled / totalPhotosCount) * 100);

  // Compliance checks
  const groundCompliance = evaluateGrounding(groundingVisual.groundingTestOhm.measurementValue);
  const ngCompliance = evaluateVoltageNeutralGround(acPanelTesting.voltageNG.measurementValue);
  const isGroundPass = groundCompliance.status === 'PASS' || groundCompliance.status === 'EXCELLENT';

  const sectionsList = [
    { id: 0, name: 'Data Proyek & Spesifikasi', filled: generalFilled, total: generalFields.length },
    { id: 1, name: '1. Battery Swap Station (BSS)', filled: bssStats.filled, total: bssStats.total },
    { id: 2, name: '2. SIM Card & Display', filled: simStats.filled, total: simStats.total },
    { id: 3, name: '3. Grounding System & Tahanan', filled: groundingStats.filled, total: groundingStats.total },
    { id: 4, name: '4. KWH Meter & AC Panel', filled: kwhStats.filled, total: kwhStats.total },
    { id: 5, name: '5. Pengujian Tegangan AC Panel', filled: acTestingStats.filled, total: acTestingStats.total },
    { id: 6, name: '6. Spesifikasi Kabel & Routing', filled: cablesStats.filled, total: cablesStats.total },
    { id: 7, name: '7. Tanda Tangan & Persetujuan', filled: signaturesFilled, total: 3 },
  ];

  const handleJump = (tabIndex: number) => {
    onNavigateToSection(tabIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Audit Kelengkapan Laporan Commissioning</h3>
              <p className="text-xs text-slate-400">
                Pemeriksaan kesiapan dokumen & dokumentasi foto sebelum diserahkan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Compliance Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Kelengkapan Dokumentasi Foto
              </span>
              <div className="text-xl font-black text-slate-900">
                {totalPhotosFilled} <span className="text-sm font-normal text-slate-500">/ {totalPhotosCount} Foto ({photoPercent}%)</span>
              </div>
            </div>

            {/* Electrical verdict badge */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              isGroundPass ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {isGroundPass ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-amber-600" />}
              <span>{isGroundPass ? 'Grounding Memenuhi Standar' : 'Periksa Nilai Grounding'}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                photoPercent === 100 ? 'bg-emerald-600' : photoPercent >= 70 ? 'bg-teal-600' : 'bg-amber-500'
              }`}
              style={{ width: `${photoPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Section completion breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Status Per Bagian Formulir
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sectionsList.map((sec) => {
                const isComplete = sec.filled === sec.total;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleJump(sec.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 group-hover:text-emerald-700 block">
                          {sec.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {sec.filled} dari {sec.total} terisi
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Missing Items List with direct jump button */}
          {missingItems.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Item Yang Masih Belum Diisi ({missingItems.length})
                </h4>
                <span className="text-[11px] text-slate-400">Klik item untuk langsung mengisi</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
                {missingItems.map((item, idx) => (
                  <div
                    key={`${item.sectionId}-${item.itemId}-${idx}`}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{item.itemLabel}</span>
                      <span className="text-[10px] text-slate-400">{item.sectionName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJump(item.sectionId)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Isi Sekarang <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
              <h4 className="text-sm font-bold text-emerald-900">Seluruh Formulir Telah Lengkap!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Semua data proyek, 42 foto inspeksi, dan tanda tangan digital telah terisi dan siap dicetak ke PDF.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Standar Dokumen V-Green COMM TEST REPORT V1.1
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
