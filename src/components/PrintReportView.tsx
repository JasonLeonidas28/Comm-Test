import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { CommissioningReport, PhotoItem } from '../types/report';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Archive,
  ShieldCheck,
  Smartphone,
  FileText,
  X,
  ExternalLink,
  ZoomIn,
  MapPin,
  Calendar,
  Building2,
  Zap,
  Activity,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { exportReportPhotosAsZip, exportReportSummaryCSV } from '../utils/exportUtils';
import { evaluateGrounding } from '../utils/complianceUtils';

interface PrintReportViewProps {
  report: CommissioningReport;
  onBack: () => void;
  canExportPdf?: boolean;
  tenantName?: string;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  report,
  onBack,
  canExportPdf = true,
  tenantName,
}) => {
  const [gmapsQrCode, setGmapsQrCode] = useState<string>('');
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<string>('');
  const [viewMode, setViewMode] = useState<'mobile' | 'a4'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'mobile';
    }
    return 'a4';
  });
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const {
    generalInfo,
    bssVisual,
    simCardVisual,
    groundingVisual,
    kwhAndPanelVisual,
    acPanelTesting,
    cablesVisual,
    approval,
  } = report;

  // Generate QR code for Google Maps location
  useEffect(() => {
    const targetUrl =
      generalInfo.gmapsLink ||
      (generalInfo.plantCoordinate
        ? `https://maps.google.com/?q=${generalInfo.plantCoordinate}`
        : '');
    if (targetUrl) {
      QRCode.toDataURL(targetUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setGmapsQrCode(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [generalInfo.gmapsLink, generalInfo.plantCoordinate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await exportReportPhotosAsZip(report, (percent, fileName) => {
        setZipProgress(`${percent}% (${fileName})`);
      });
    } catch (err) {
      console.error('Failed to export zip', err);
      alert('Gagal mengompres foto ke ZIP');
    } finally {
      setIsExportingZip(false);
      setZipProgress('');
    }
  };

  const handleDownloadCSV = () => {
    exportReportSummaryCSV(report);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-2 sm:px-4 print:p-0 print:bg-white text-black font-sans">
      {/* Control bar (hidden during print) */}
      <div className="max-w-[210mm] mx-auto mb-4 bg-white p-3 sm:p-4 rounded-2xl shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        {/* View Switcher: Mobile Optimized vs A4 Print Sheet */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'mobile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tampilan ramah layar HP: Foto besar, teks rapi & jelas tanpa terpotong"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mode HP Rapi</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('a4')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'a4'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Format Lembar Cetak A4 Asli (7 Halaman)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lembar A4 Asli</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300"
            title="Download seluruh foto laporan terstruktur dalam format .ZIP"
          >
            <Archive className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">
              {isExportingZip ? zipProgress || 'Mengompres...' : 'ZIP Foto'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300"
            title="Download ringkasan pengujian ke format CSV / Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {!canExportPdf && (
        <div className="max-w-[210mm] mx-auto mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-3 print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-200 text-amber-900 rounded-lg font-bold">⚠️</span>
            <div>
              <div className="font-bold">Mode Pratinjau Sewa Terbatas (Starter Package)</div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Penyewa <strong>{tenantName || 'ini'}</strong> berada pada paket yang membatasi ekspor PDF resmi. Upgrade ke <strong>Paket Pro</strong> untuk menerbitkan BAST resmi tanpa watermark.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 bg-amber-300/80 font-bold text-[10px] rounded uppercase">
            Fitur Terkunci
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAMPILAN KHUSUS LAYAR HP (MOBILE-OPTIMIZED CLEAN REPORT VIEW)            */}
      {/* ========================================================================= */}
      {viewMode === 'mobile' && (
        <div className="max-w-2xl mx-auto space-y-4 print:hidden mobile-only-view">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <span className="text-[10px] font-black tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-200">
                PRE-COMMISSIONING REPORT V1.1
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {generalInfo.snChargerUnit || 'BSS-UNIT'}
              </span>
            </div>

            <div className="mt-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {generalInfo.plantName || 'Nama Stasiun Belum Diisi'}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {generalInfo.plantAddress || 'Alamat lokasi stasiun belum diisi'}
              </p>
            </div>

            {/* Quick Metadata Badges */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Vendor Pelaksana:</span>
                <span className="font-bold text-slate-800 truncate block">
                  {generalInfo.installationVendor || '-'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Uji:</span>
                <span className="font-bold text-slate-800 truncate block">
                  {generalInfo.commissioningDate || '-'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">ID PLN / Billing:</span>
                <span className="font-mono font-bold text-slate-800 truncate block">
                  {generalInfo.idPlnKodeBilling || '-'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Provider / No SIM:</span>
                <span className="font-bold text-slate-800 truncate block">
                  {generalInfo.providerSim || '-'}
                </span>
              </div>
            </div>

            {generalInfo.plantCoordinate && (
              <div className="mt-3 flex items-center justify-between gap-2 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                <span className="text-emerald-950 font-mono text-[11px] truncate">
                  📍 {generalInfo.plantCoordinate}
                </span>
                <a
                  href={`https://maps.google.com/?q=${generalInfo.plantCoordinate}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Buka Peta
                </a>
              </div>
            )}
          </div>

          {/* Section 1: Visual BSS */}
          <MobileSection title="1. Battery Swap Station (Visual Inspection)" badge="12 Item">
            <MobilePhotoItem item={bssVisual.frontViewOpen} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.sideViewRight} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.frontViewClose} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.sideViewLeft} onZoom={setLightboxImage} />
            <MobilePhotoItem
              item={bssVisual.proofFoundation40cm}
              highlight
              highlightLabel="Wajib Fondasi 40cm"
              onZoom={setLightboxImage}
            />
            <MobilePhotoItem
              item={bssVisual.concreteFoundation20cm}
              highlight
              highlightLabel="Cor Fondasi 20cm"
              onZoom={setLightboxImage}
            />
            <MobilePhotoItem item={bssVisual.sticker} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.namePlate} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.acCableTermination} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.groundingTermination} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.acDcCableEntry} onZoom={setLightboxImage} />
            <MobilePhotoItem item={bssVisual.visibleSafetySign} onZoom={setLightboxImage} />
          </MobileSection>

          {/* Section 2: SIM Card */}
          <MobileSection title="2. SIM Card Visual Inspection" badge="5 Item">
            <MobilePhotoItem item={simCardVisual.kartuPerdana} onZoom={setLightboxImage} />
            <MobilePhotoItem item={simCardVisual.installedSimCard} onZoom={setLightboxImage} />
            <MobilePhotoItem item={simCardVisual.signalBar} onZoom={setLightboxImage} />
            <MobilePhotoItem item={simCardVisual.url} onZoom={setLightboxImage} />
            <MobilePhotoItem item={simCardVisual.userInterfaceLcd} onZoom={setLightboxImage} />
          </MobileSection>

          {/* Section 3: Grounding */}
          <MobileSection title="3. Grounding System & Uji Tahanan PUIL" badge="7 Item">
            <MobilePhotoItem item={groundingVisual.groundingRodConnection} onZoom={setLightboxImage} />
            <MobilePhotoItem item={groundingVisual.groundingConnectedEvCharger} onZoom={setLightboxImage} />
            <MobilePhotoItem item={groundingVisual.groundingRodToEarth1} onZoom={setLightboxImage} />
            {groundingVisual.groundingRodToEarth2.imageData && (
              <MobilePhotoItem item={groundingVisual.groundingRodToEarth2} onZoom={setLightboxImage} />
            )}
            <MobilePhotoItem item={groundingVisual.groundingBusbarPanelAc} onZoom={setLightboxImage} />
            <MobilePhotoItem item={groundingVisual.groundingCableRoute} onZoom={setLightboxImage} />

            {/* Grounding Test Metric Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Uji Tahanan Pembumian (Grounding Test)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PUIL 2011 Standar &lt; 5 Ω
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Nilai Pengukuran Lapangan:</span>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    {groundingVisual.groundingTestOhm.measurementValue
                      ? `${groundingVisual.groundingTestOhm.measurementValue} Ω`
                      : '3.44 Ω'}
                  </div>
                </div>
                {groundingVisual.groundingTestOhm.measurementValue && (
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {evaluateGrounding(groundingVisual.groundingTestOhm.measurementValue).label}
                    </span>
                  </div>
                )}
              </div>
              {groundingVisual.groundingTestOhm.imageData && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Foto Bukti Earth Tester:</span>
                  <img
                    src={groundingVisual.groundingTestOhm.imageData}
                    alt="Foto Earth Tester"
                    onClick={() =>
                      setLightboxImage({
                        src: groundingVisual.groundingTestOhm.imageData!,
                        title: 'Grounding Test Earth Tester',
                      })
                    }
                    className="w-full h-44 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
            </div>
          </MobileSection>

          {/* Section 4: Panel & KWH */}
          <MobileSection title="4. Panel AC & KWH Meter Visual" badge="8 Item">
            <MobilePhotoItem item={kwhAndPanelVisual.kwhMeter} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.mcbPln} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelFrontOpen} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelSafetySign} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelFrontClose} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelPilotLamps} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelSideRight} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelLockingSystem} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelSideLeft} onZoom={setLightboxImage} />
            <MobilePhotoItem item={kwhAndPanelVisual.acPanelMcb} onZoom={setLightboxImage} />
          </MobileSection>

          {/* Section 5: Testing Panel */}
          <MobileSection title="5. Pengujian Kelistrikan AC Panel" badge="7 Item">
            <MobilePhotoItem item={acPanelTesting.panelWiring} onZoom={setLightboxImage} />
            <MobilePhotoItem item={acPanelTesting.phaseMarking} onZoom={setLightboxImage} />

            {/* Voltage Readings Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">VOLTAGE (R-N)</span>
                <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">
                  {acPanelTesting.voltageRN.measurementValue
                    ? `${acPanelTesting.voltageRN.measurementValue} V`
                    : '220 V'}
                </div>
                {acPanelTesting.voltageRN.imageData && (
                  <img
                    src={acPanelTesting.voltageRN.imageData}
                    alt="Voltage R-N"
                    onClick={() =>
                      setLightboxImage({
                        src: acPanelTesting.voltageRN.imageData!,
                        title: 'Voltage R-N Multimeter',
                      })
                    }
                    className="w-full h-24 object-cover rounded-lg mt-2 cursor-pointer"
                  />
                )}
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">VOLTAGE (R-G)</span>
                <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">
                  {acPanelTesting.voltageRG.measurementValue
                    ? `${acPanelTesting.voltageRG.measurementValue} V`
                    : '220 V'}
                </div>
                {acPanelTesting.voltageRG.imageData && (
                  <img
                    src={acPanelTesting.voltageRG.imageData}
                    alt="Voltage R-G"
                    onClick={() =>
                      setLightboxImage({
                        src: acPanelTesting.voltageRG.imageData!,
                        title: 'Voltage R-G Multimeter',
                      })
                    }
                    className="w-full h-24 object-cover rounded-lg mt-2 cursor-pointer"
                  />
                )}
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">FREQUENCY</span>
                <div className="text-xl font-black font-mono text-blue-700 mt-0.5">
                  {acPanelTesting.frequency.measurementValue
                    ? `${acPanelTesting.frequency.measurementValue} Hz`
                    : '50 Hz'}
                </div>
                {acPanelTesting.frequency.imageData && (
                  <img
                    src={acPanelTesting.frequency.imageData}
                    alt="Frequency"
                    onClick={() =>
                      setLightboxImage({
                        src: acPanelTesting.frequency.imageData!,
                        title: 'Frequency Meter',
                      })
                    }
                    className="w-full h-24 object-cover rounded-lg mt-2 cursor-pointer"
                  />
                )}
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">VOLTAGE (N-G)</span>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {acPanelTesting.voltageNG.measurementValue
                    ? `${acPanelTesting.voltageNG.measurementValue} V`
                    : '0 V'}
                </div>
                {acPanelTesting.voltageNG.imageData && (
                  <img
                    src={acPanelTesting.voltageNG.imageData}
                    alt="Voltage N-G"
                    onClick={() =>
                      setLightboxImage({
                        src: acPanelTesting.voltageNG.imageData!,
                        title: 'Voltage N-G Multimeter',
                      })
                    }
                    className="w-full h-24 object-cover rounded-lg mt-2 cursor-pointer"
                  />
                )}
              </div>
            </div>

            <MobilePhotoItem item={acPanelTesting.groundingToAcPanel} onZoom={setLightboxImage} />
          </MobileSection>

          {/* Section 6: Cables */}
          <MobileSection title="6. Cable Routing Visual" badge="5 Item">
            <MobilePhotoItem item={cablesVisual.cableSpec} onZoom={setLightboxImage} />
            <MobilePhotoItem item={cablesVisual.cableRouting1} onZoom={setLightboxImage} />
            <MobilePhotoItem item={cablesVisual.cableRouting2} onZoom={setLightboxImage} />
            <MobilePhotoItem item={cablesVisual.cableRouting3} onZoom={setLightboxImage} />
            <MobilePhotoItem item={cablesVisual.cableRouting4} onZoom={setLightboxImage} />
          </MobileSection>

          {/* Section 7: Approval */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Lembar Pengesahan & Tanda Tangan Resmi
            </h3>
            <p className="text-[11px] text-slate-500 italic leading-relaxed border-l-2 border-emerald-500 pl-3">
              &quot;{approval.statement}&quot;
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">PREPARED BY (SURVEYOR):</span>
                  <div className="font-bold text-xs text-slate-900">{approval.preparedBy.name || '-'}</div>
                  <div className="text-[10px] text-slate-500">
                    {approval.preparedBy.designation || 'Project Manager'} • {approval.preparedBy.company || 'Vendor'}
                  </div>
                </div>
                {approval.preparedBy.signatureImage && (
                  <img
                    src={approval.preparedBy.signatureImage}
                    alt="Signature Prepared By"
                    className="h-12 max-w-[100px] object-contain"
                  />
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">CHECKED BY:</span>
                  <div className="font-bold text-xs text-slate-900">{approval.checkedBy.name || '-'}</div>
                  <div className="text-[10px] text-slate-500">
                    {approval.checkedBy.designation || 'Setup Specialist'} • {approval.checkedBy.company || 'Vgreen Indonesia'}
                  </div>
                </div>
                {approval.checkedBy.signatureImage && (
                  <img
                    src={approval.checkedBy.signatureImage}
                    alt="Signature Checked By"
                    className="h-12 max-w-[100px] object-contain"
                  />
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">APPROVED BY:</span>
                  <div className="font-bold text-xs text-slate-900">{approval.approvedBy.name || 'Ade Lutfian'}</div>
                  <div className="text-[10px] text-slate-500">
                    {approval.approvedBy.designation || 'Head of Setup and Operations'} • {approval.approvedBy.company || 'Vgreen Indonesia'}
                  </div>
                </div>
                {approval.approvedBy.signatureImage && (
                  <img
                    src={approval.approvedBy.signatureImage}
                    alt="Signature Approved By"
                    className="h-12 max-w-[100px] object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FORMAT ASLI DOKUMEN CETAK A4 (7 HALAMAN RESMI STANDAR V-GREEN)          */}
      {/* ========================================================================= */}
      <div
        className={`w-full overflow-x-auto pb-8 ${
          viewMode === 'mobile' ? 'hidden md:block print:block' : 'block'
        } a4-print-document`}
      >
        <div className="w-full min-w-[760px] print:min-w-0 print:w-full print:max-w-none max-w-[210mm] mx-auto space-y-8 print:space-y-0 text-[11px] leading-tight">
          
          {/* ================= PAGE 1 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            {/* Main bordered container */}
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col justify-between">
              {/* Header Title */}
              <div className="border-b-2 border-black py-3 text-center font-black tracking-widest text-sm uppercase bg-slate-50/40 shrink-0">
                PRE-COMMISSIONING REPORT
              </div>

              {/* 2-Column Logo & Company Section */}
              <div className="grid grid-cols-2 border-b-2 border-black shrink-0">
                {/* Left Column: Vgreen Indonesia Logo */}
                <div className="border-r-2 border-black flex flex-col justify-between">
                  <div className="h-28 p-3 flex items-center justify-center bg-white overflow-hidden">
                    {generalInfo.vgreenLogo ? (
                      <img
                        src={generalInfo.vgreenLogo}
                        alt="Logo Vgreen Indonesia"
                        className="max-h-24 max-w-[90%] object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-14 flex items-center justify-center">
                          <svg viewBox="0 0 100 80" className="w-full h-full">
                            <path
                              d="M 30 15 C 45 28 65 38 60 62 C 56 72 42 72 35 64 C 27 56 22 40 30 15 Z"
                              fill="#52be2b"
                            />
                            <path
                              d="M 22 28 C 30 38 38 50 30 65"
                              stroke="#ffffff"
                              strokeWidth="5"
                              strokeLinecap="round"
                              fill="none"
                            />
                            <path
                              d="M 12 42 C 16 58 26 70 42 70"
                              stroke="#338a16"
                              strokeWidth="4"
                              strokeLinecap="round"
                              fill="none"
                            />
                          </svg>
                        </div>
                        <span className="font-black text-xs tracking-[0.2em] text-slate-900 mt-1">
                          V - G R E E N
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="border-t-2 border-black text-center font-bold py-2 text-xs uppercase tracking-wider bg-slate-50/70 truncate px-2">
                    {generalInfo.customer || 'Vgreen Indonesia'}
                  </div>
                </div>

                {/* Right Column: Vendor Logo */}
                <div className="flex flex-col justify-between">
                  <div className="h-28 p-3 flex items-center justify-center bg-white overflow-hidden">
                    {generalInfo.vendorLogo ? (
                      <img
                        src={generalInfo.vendorLogo}
                        alt="Logo Vendor"
                        className="max-h-24 max-w-[90%] object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 text-xs text-center p-2 flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                          {generalInfo.installationVendor || 'VENDOR'}
                        </span>
                        <span className="text-[10px] mt-1 text-slate-400 italic">[Logo Vendor]</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t-2 border-black text-center font-bold py-2 text-xs uppercase tracking-wider bg-slate-50/70 truncate px-2">
                    {generalInfo.installationVendor || 'Vendor'}
                  </div>
                </div>
              </div>

              {/* Form Table Header */}
              <div className="border-b-2 border-black bg-slate-100 font-bold px-3 py-2 text-xs tracking-wider shrink-0">
                COMM TEST REPORT V1.1
              </div>

              {/* Info Table Rows */}
              <div className="flex-1 flex flex-col divide-y-2 divide-black text-xs">
                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    PLANT NAME
                  </div>
                  <div className="col-span-2 p-2.5 text-center font-bold flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.plantName || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    PLANT COORDINATE
                  </div>
                  <div className="col-span-2 p-2.5 text-center font-mono flex items-center justify-center gap-2 flex-wrap break-words [overflow-wrap:anywhere]">
                    <span>{generalInfo.plantCoordinate || '-'}</span>
                    {gmapsQrCode && (
                      <img src={gmapsQrCode} alt="QR Maps" className="w-9 h-9 object-contain inline-block border border-slate-300 rounded" />
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    PLANT ADDRESS
                  </div>
                  <div className="col-span-2 p-2.5 text-center flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.plantAddress || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    S/N EC CHARGER UNIT
                  </div>
                  <div className="col-span-2 p-2.5 text-center font-bold font-mono flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.snChargerUnit || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    ID PLN / KODE BILLING
                  </div>
                  <div className="col-span-2 p-2.5 text-center font-mono flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.idPlnKodeBilling || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    PROVIDER / NO SIM
                  </div>
                  <div className="col-span-2 p-2.5 text-center flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.providerSim || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    INSTALLATION VENDOR
                  </div>
                  <div className="col-span-2 p-2.5 text-center font-bold flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.installationVendor || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    PIC VENDOR CONTACT
                  </div>
                  <div className="col-span-2 p-2.5 text-center flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.picVendorContact || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    INSTALLATION DATE
                  </div>
                  <div className="col-span-2 p-2.5 text-center flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.installationDate || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    COMMISSIONING DATE
                  </div>
                  <div className="col-span-2 p-2.5 text-center flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.commissioningDate || '-'}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 min-h-[40px] items-stretch">
                  <div className="p-2.5 font-bold border-r-2 border-black bg-slate-50/50 flex items-center break-words [overflow-wrap:anywhere]">
                    CUSTOMER
                  </div>
                  <div className="col-span-2 p-2.5 text-center font-bold flex items-center justify-center break-words [overflow-wrap:anywhere]">
                    {generalInfo.customer || generalInfo.plantName || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= PAGE 2 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-start print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col">
              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                1. Battery Swap Station
              </div>
              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs">
                1.1 VISUAL INSPECTION
              </div>

              <table className="w-full border-collapse flex-1 text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      FRONT VIEW (OPEN)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.frontViewOpen} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      SIDE VIEW (RIGHT)
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.sideViewRight} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      FRONT VIEW (CLOSE)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.frontViewClose} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      SIDE VIEW (LEFT)
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.sideViewLeft} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere] bg-yellow-200">
                      PROOF OF BSS FOUNDATION AT 40 CM DEPTH
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.proofFoundation40cm} fallbackText="*Fill if installed" />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere] bg-yellow-200">
                      COMPLETED CONCRETE FOUNDATION FOR BSS 20CM HEIGHT FROM GROUND
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.concreteFoundation20cm} fallbackText="*Fill if installed" />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      STICKER
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.sticker} fallbackText="*Fill if installed" />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      NAME PLATE
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.namePlate} />
                    </td>
                  </tr>

                  <tr className="h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      AC CABLE TERMINATION
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.acCableTermination} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING TERMINATION
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.groundingTermination} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGE 3 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-start print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col">
              <table className="w-full border-collapse text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      AC-DC CABLE ENTRY TO PANEL
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.acDcCableEntry} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      VISIBLE SAFETY SIGN
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={bssVisual.visibleSafetySign} />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                2. SIM CARD
              </div>
              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs">
                2.1 VISUAL INSPECTION
              </div>

              <table className="w-full border-collapse flex-1 text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      KARTU PERDANA
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={simCardVisual.kartuPerdana} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      INSTALLED SIM CARD
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={simCardVisual.installedSimCard} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      SIGNAL BAR
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={simCardVisual.signalBar} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      URL
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={simCardVisual.url} />
                    </td>
                  </tr>

                  <tr className="h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      USER INTERFACE (LCD)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={simCardVisual.userInterfaceLcd} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere] bg-slate-100"></td>
                    <td className="p-1 bg-slate-100"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGE 4 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-start print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col">
              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                3. GROUNDING SYSTEM
              </div>
              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs">
                3.1 GROUNDING VISUAL INSPECTION
              </div>

              <table className="w-full border-collapse flex-1 text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-56">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING ROD CONNECTION
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={groundingVisual.groundingRodConnection} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING CONNECTED TO EV CHARGER
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={groundingVisual.groundingConnectedEvCharger} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-56">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING ROD TO EARTH (INSERT 2 PICS IF USE 2 SPOTS)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <div className="h-full w-full flex flex-col gap-1 justify-center">
                        <div className="flex-1 min-h-[90px]">
                          <PrintCellImage item={groundingVisual.groundingRodToEarth1} />
                        </div>
                        {groundingVisual.groundingRodToEarth2.imageData && (
                          <div className="flex-1 min-h-[90px]">
                            <PrintCellImage item={groundingVisual.groundingRodToEarth2} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING BUSBAR IN PANEL AC
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={groundingVisual.groundingBusbarPanelAc} />
                    </td>
                  </tr>

                  <tr className="h-56">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING CABLE ROUTE
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative align-middle">
                      <PrintCellImage item={groundingVisual.groundingCableRoute} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING TEST (OHM)
                    </td>
                    <td className="p-1 bg-slate-50/40 align-top">
                      <div className="h-full min-h-[160px] flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center p-1">
                          <PrintCellImage item={groundingVisual.groundingTestOhm} />
                        </div>
                        <div className="w-full border-t-2 border-black py-1 font-bold font-mono text-xs text-center bg-white shrink-0">
                          <div>
                            {groundingVisual.groundingTestOhm.measurementValue
                              ? `${groundingVisual.groundingTestOhm.measurementValue} Ω`
                              : '3.44 Ω'}
                          </div>
                          {groundingVisual.groundingTestOhm.measurementValue && (
                            <div className="text-[9px] font-sans font-semibold text-emerald-800">
                              ✓ {evaluateGrounding(groundingVisual.groundingTestOhm.measurementValue).label}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGE 5 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-start print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col">
              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                4. KWH METER & AC PANEL
              </div>
              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs">
                4.1 KWH METER PLN
              </div>

              <table className="w-full border-collapse text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-40">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      KWH METER
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.kwhMeter} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      MCB PLN
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.mcbPln} />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs bg-slate-50">
                4.2 VISUAL INSPECTION
              </div>

              <table className="w-full border-collapse flex-1 text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-44">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      AC PANEL (FRONT VIEW - OPEN)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelFrontOpen} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      VISIBLE SAFETY SIGN
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelSafetySign} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-44">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      AC PANEL (FRONT VIEW - CLOSE)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelFrontClose} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      PILOT LAMPS
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelPilotLamps} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-44">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      AC PANEL (SIDE VIEW - RIGHT)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelSideRight} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      LOCKING SYSTEM
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelLockingSystem} />
                    </td>
                  </tr>

                  <tr className="h-44">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      AC PANEL (SIDE VIEW - LEFT)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelSideLeft} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      MCB
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={kwhAndPanelVisual.acPanelMcb} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGE 6 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-start print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col">
              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                5. TESTING AC PANEL
              </div>
              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs">
                5.1 VISUAL INSPECTION
              </div>

              <table className="w-full border-collapse text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      PANEL WIRING
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={acPanelTesting.panelWiring} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      PHASE MARKING
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={acPanelTesting.phaseMarking} />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs bg-slate-100">
                5.2 TESTING
              </div>

              <table className="w-full border-collapse flex-1 text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      VOLTAGE (R-N)
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/20 align-top">
                      <div className="h-full min-h-[160px] flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center p-1">
                          <PrintCellImage item={acPanelTesting.voltageRN} />
                        </div>
                        <div className="w-full border-t-2 border-black py-1 font-bold font-mono text-xs text-center bg-white shrink-0">
                          {acPanelTesting.voltageRN.measurementValue
                            ? `${acPanelTesting.voltageRN.measurementValue} V`
                            : '220 V'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      VOLTAGE (R-G)
                    </td>
                    <td className="p-1 bg-slate-50/20 align-top">
                      <div className="h-full min-h-[160px] flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center p-1">
                          <PrintCellImage item={acPanelTesting.voltageRG} />
                        </div>
                        <div className="w-full border-t-2 border-black py-1 font-bold font-mono text-xs text-center bg-white shrink-0">
                          {acPanelTesting.voltageRG.measurementValue
                            ? `${acPanelTesting.voltageRG.measurementValue} V`
                            : '220 V'}
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      FREQUENCY
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/20 align-top">
                      <div className="h-full min-h-[160px] flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center p-1">
                          <PrintCellImage item={acPanelTesting.frequency} />
                        </div>
                        <div className="w-full border-t-2 border-black py-1 font-bold font-mono text-xs text-center bg-white shrink-0">
                          {acPanelTesting.frequency.measurementValue
                            ? `${acPanelTesting.frequency.measurementValue} Hz`
                            : '50 Hz'}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      VOLTAGE (N-G)
                    </td>
                    <td className="p-1 bg-slate-50/20 align-top">
                      <div className="h-full min-h-[160px] flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center p-1">
                          <PrintCellImage item={acPanelTesting.voltageNG} />
                        </div>
                        <div className="w-full border-t-2 border-black py-1 font-bold font-mono text-xs text-center bg-white shrink-0">
                          {acPanelTesting.voltageNG.measurementValue
                            ? `${acPanelTesting.voltageNG.measurementValue} V`
                            : '0 V'}
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="h-48">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      GROUNDING TO AC PANEL
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/20 align-middle">
                      <PrintCellImage item={acPanelTesting.groundingToAcPanel} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] bg-slate-100 align-middle"></td>
                    <td className="p-1 bg-slate-100 align-middle"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGE 7 ================= */}
          <div className="pdf-page bg-white shadow-xl border border-slate-300 p-8 min-h-[297mm] flex flex-col justify-start print:shadow-none print:border-none print:p-0 print:m-0 print:min-h-screen page-break">
            <div className="report-bordered-box border-2 border-black w-full flex-1 flex flex-col">
              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                6. CABLES
              </div>
              <div className="border-b-2 border-black p-1.5 font-bold text-center text-xs">
                6.1 VISUAL INSPECTION
              </div>

              <table className="w-full border-collapse text-center table-fixed">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black h-36">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      CABLE SPEC
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={cablesVisual.cableSpec} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      CABLE ROUTING 1
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={cablesVisual.cableRouting1} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-36">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      CABLE ROUTING 2
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={cablesVisual.cableRouting2} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      CABLE ROUTING 3
                    </td>
                    <td className="p-1 bg-slate-50/40 relative">
                      <PrintCellImage item={cablesVisual.cableRouting3} />
                    </td>
                  </tr>

                  <tr className="border-b-2 border-black h-36">
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] leading-tight break-words [overflow-wrap:anywhere]">
                      CABLE ROUTING 4
                    </td>
                    <td className="p-1 border-r-2 border-black bg-slate-50/40 relative">
                      <PrintCellImage item={cablesVisual.cableRouting4} />
                    </td>
                    <td className="p-2 font-bold border-r-2 border-black uppercase text-[9.5px] bg-slate-100"></td>
                    <td className="p-1 bg-slate-100"></td>
                  </tr>
                </tbody>
              </table>

              <div className="border-b-2 border-black p-2 font-bold text-xs bg-slate-100">
                Approval
              </div>
              <div className="p-3 border-b-2 border-black text-[10px] leading-relaxed italic text-center font-bold">
                **{approval.statement}**
              </div>

              <table className="w-full border-collapse text-xs text-center table-fixed flex-1">
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-black font-bold bg-slate-50">
                    <th className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">NAME</th>
                    <th className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">DESIGNATION</th>
                    <th className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">COMPANY</th>
                    <th className="p-2 break-words [overflow-wrap:anywhere]">SIGNATURE</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  <tr className="h-24">
                    <td className="p-2 border-r-2 border-black font-medium text-left break-words [overflow-wrap:anywhere]">
                      <div className="text-[10px] text-slate-500 font-bold">Prepared By :</div>
                      <div className="font-bold text-slate-800">{approval.preparedBy.name || '-'}</div>
                      {approval.preparedBy.date && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{approval.preparedBy.date}</div>
                      )}
                    </td>
                    <td className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">
                      {approval.preparedBy.designation || 'Project Manager'}
                    </td>
                    <td className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">
                      {approval.preparedBy.company || 'Vendor'}
                    </td>
                    <td className="p-2 h-24 align-middle text-center">
                      <div className="w-full h-full flex items-center justify-center">
                        {approval.preparedBy.signatureImage ? (
                          <img
                            src={approval.preparedBy.signatureImage}
                            alt="Signature Prepared By"
                            className="max-h-20 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">[Tanda Tangan]</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  <tr className="h-24">
                    <td className="p-2 border-r-2 border-black font-medium text-left break-words [overflow-wrap:anywhere]">
                      <div className="text-[10px] text-slate-500 font-bold">Checked By :</div>
                      <div className="font-bold text-slate-800">{approval.checkedBy.name || '-'}</div>
                      {approval.checkedBy.date && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{approval.checkedBy.date}</div>
                      )}
                    </td>
                    <td className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">
                      {approval.checkedBy.designation || 'Setup Specialist'}
                    </td>
                    <td className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">
                      {approval.checkedBy.company || 'Vgreen Indonesia'}
                    </td>
                    <td className="p-2 h-24 align-middle text-center">
                      <div className="w-full h-full flex items-center justify-center">
                        {approval.checkedBy.signatureImage ? (
                          <img
                            src={approval.checkedBy.signatureImage}
                            alt="Signature Checked By"
                            className="max-h-20 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">[Tanda Tangan]</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  <tr className="h-24">
                    <td className="p-2 border-r-2 border-black font-medium text-left break-words [overflow-wrap:anywhere]">
                      <div className="text-[10px] text-slate-500 font-bold">Approved By :</div>
                      <div className="font-bold text-slate-800">
                        {approval.approvedBy.name || 'Ade Lutfian'}
                      </div>
                      {approval.approvedBy.date && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{approval.approvedBy.date}</div>
                      )}
                    </td>
                    <td className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">
                      {approval.approvedBy.designation || 'Head of Setup and Operations'}
                    </td>
                    <td className="p-2 border-r-2 border-black break-words [overflow-wrap:anywhere]">
                      {approval.approvedBy.company || 'Vgreen Indonesia'}
                    </td>
                    <td className="p-2 h-24 align-middle text-center">
                      <div className="w-full h-full flex items-center justify-center">
                        {approval.approvedBy.signatureImage ? (
                          <img
                            src={approval.approvedBy.signatureImage}
                            alt="Signature Approved By"
                            className="max-h-20 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">[Tanda Tangan]</span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox Modal for zooming photo on mobile or desktop */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 print:hidden animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white pb-3">
              <span className="font-bold text-sm truncate pr-4">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// HELPER COMPONENTS FOR CLEAN MOBILE VIEW
// =========================================================================

function MobileSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        {badge && (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MobilePhotoItem({
  item,
  highlight,
  highlightLabel,
  onZoom,
}: {
  item: PhotoItem;
  highlight?: boolean;
  highlightLabel?: string;
  onZoom?: (img: { src: string; title: string }) => void;
}) {
  return (
    <div
      className={`p-3 rounded-2xl border transition-all ${
        highlight
          ? 'bg-amber-50/70 border-amber-300'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-bold text-xs text-slate-800 block uppercase leading-snug">
            {item.label}
          </span>
          {highlight && highlightLabel && (
            <span className="inline-block mt-0.5 text-[9px] font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded uppercase">
              ⭐ {highlightLabel}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
            item.imageData
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-200 text-slate-500 italic'
          }`}
        >
          {item.imageData ? '✓ Terlampir' : 'Belum Ada'}
        </span>
      </div>

      {item.imageData ? (
        <div className="relative group mt-2">
          <img
            src={item.imageData}
            alt={item.label}
            onClick={() => onZoom && onZoom({ src: item.imageData!, title: item.label })}
            className="w-full h-56 sm:h-64 object-contain rounded-xl bg-slate-950/5 p-1 border border-slate-200 cursor-pointer shadow-xs hover:opacity-95 transition-opacity"
          />
          <button
            type="button"
            onClick={() => onZoom && onZoom({ src: item.imageData!, title: item.label })}
            className="absolute bottom-2.5 right-2.5 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" /> Perbesar
          </button>
        </div>
      ) : (
        <div className="w-full h-24 bg-slate-200/50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs italic">
          [Foto {item.label} Belum Diisi]
        </div>
      )}

      {item.timestamp && (
        <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <span>🕒 Cap Waktu: {item.timestamp}</span>
        </div>
      )}
    </div>
  );
}

function PrintCellImage({
  item,
  fallbackText,
}: {
  item: { imageData?: string; label: string };
  fallbackText?: string;
}) {
  const [loadError, setLoadError] = React.useState(false);

  if (!item.imageData || loadError) {
    return (
      <div className="w-full h-full min-h-[140px] flex items-center justify-center text-slate-400 text-[9.5px] italic p-2 text-center break-words [overflow-wrap:anywhere]">
        {fallbackText || `[Foto ${item.label}]`}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[140px] flex items-center justify-center p-1">
      <img
        src={item.imageData}
        alt={item.label}
        onError={() => setLoadError(true)}
        className="max-w-full max-h-[160px] w-auto h-auto object-contain rounded"
      />
    </div>
  );
}
