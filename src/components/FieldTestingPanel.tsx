import React from 'react';
import { CommissioningReport, FieldTestingData } from '../types/report';
import { calculatePhaseUnbalance } from '../utils/electricalValidation';
import {
  Activity,
  ShieldCheck,
  Flame,
  Gauge,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface FieldTestingPanelProps {
  report: CommissioningReport;
  onChange: (updated: FieldTestingData) => void;
}

export const FieldTestingPanel: React.FC<FieldTestingPanelProps> = ({ report, onChange }) => {
  const ft: FieldTestingData = report.fieldTesting || {};
  const vrn = report.acPanelTesting.voltageRN.measurementValue || '';
  const phaseBalance = calculatePhaseUnbalance(vrn, ft.voltageSN, ft.voltageTN);

  const isThreePhaseUnit =
    /3\s*PHASE|DC\s*20|DC\s*30|DC\s*60/i.test(report.generalInfo.evChargerType || '');

  const rccbMs = parseFloat((ft.rccbTripTimeMs || '').replace(',', '.'));
  const rccbStatus =
    !ft.rccbTripTimeMs || isNaN(rccbMs)
      ? 'pending'
      : rccbMs <= 300
      ? 'pass'
      : 'fail';

  const meggerVal = parseFloat((ft.insulationMohm || '').replace(',', '.'));
  const meggerStatus =
    !ft.insulationMohm || isNaN(meggerVal)
      ? 'pending'
      : meggerVal >= 1.0
      ? 'pass'
      : 'fail';

  const tempVal = parseFloat((ft.panelTempCelsius || '').replace(',', '.'));
  const tempStatus =
    !ft.panelTempCelsius || isNaN(tempVal)
      ? 'pending'
      : tempVal <= 65
      ? 'pass'
      : 'warning';

  const updateField = <K extends keyof FieldTestingData>(key: K, value: FieldTestingData[K]) => {
    onChange({
      ...ft,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Uji Kelistrikan Lanjutan, Proteksi K3 & Kalibrasi Alat
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data tambahan berstandar audit PLN / ISO: Pengukuran 3-Fasa & balance, uji trip RCCB/ELCB, Megger isolasi, suhu panel, dan K3 lapangan.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border self-start md:self-auto ${
            isThreePhaseUnit
              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          Unit: {report.generalInfo.evChargerType || 'BSS'} {isThreePhaseUnit ? '(3-Fasa)' : '(1-Fasa / Standar)'}
        </span>
      </div>

      {/* 1. 3-Phase Voltage & Balance */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-blue-600" />
              1. Pengukuran Tegangan 3-Fasa & Kalkulator Unbalance Otomatis
            </h3>
            <p className="text-[11px] text-slate-500">
              Tegangan R-N ({vrn || '-'} V) diambil otomatis dari kartu Voltage R-N di bawah.
            </p>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
              phaseBalance.status === 'pass'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : phaseBalance.status === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {phaseBalance.status === 'pass' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : phaseBalance.status === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>{phaseBalance.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-500 mb-1">R-N (Otomatis)</span>
            <div className="font-mono font-black text-slate-800 text-sm py-1">
              {vrn ? `${vrn} V` : '- V'}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">S-N (Volt)</label>
            <input
              type="text"
              value={ft.voltageSN || ''}
              onChange={(e) => updateField('voltageSN', e.target.value)}
              placeholder="221"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">T-N (Volt)</label>
            <input
              type="text"
              value={ft.voltageTN || ''}
              onChange={(e) => updateField('voltageTN', e.target.value)}
              placeholder="219"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">R-S (Volt L-L)</label>
            <input
              type="text"
              value={ft.voltageRS || ''}
              onChange={(e) => updateField('voltageRS', e.target.value)}
              placeholder="382"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">S-T (Volt L-L)</label>
            <input
              type="text"
              value={ft.voltageST || ''}
              onChange={(e) => updateField('voltageST', e.target.value)}
              placeholder="380"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">R-T (Volt L-L)</label>
            <input
              type="text"
              value={ft.voltageRT || ''}
              onChange={(e) => updateField('voltageRT', e.target.value)}
              placeholder="381"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Proteksi RCCB, Megger & Thermal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* RCCB */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Uji Trip RCCB / ELCB
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                rccbStatus === 'pass'
                  ? 'bg-emerald-100 text-emerald-800'
                  : rccbStatus === 'fail'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {rccbStatus === 'pass' ? 'PASS (≤300ms)' : rccbStatus === 'fail' ? 'TERLALU LAMBAT' : 'Standar ≤300ms'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Sensitivitas</label>
              <select
                value={ft.rccbRatingMa || '30'}
                onChange={(e) => updateField('rccbRatingMa', e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="10">10 mA</option>
                <option value="30">30 mA (Personal)</option>
                <option value="100">100 mA</option>
                <option value="300">300 mA (Fire)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Waktu Trip (ms)</label>
              <input
                type="text"
                value={ft.rccbTripTimeMs || ''}
                onChange={(e) => updateField('rccbTripTimeMs', e.target.value)}
                placeholder="cth: 28"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Megger Insulation */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              Uji Isolasi Kabel (Megger)
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                meggerStatus === 'pass'
                  ? 'bg-emerald-100 text-emerald-800'
                  : meggerStatus === 'fail'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {meggerStatus === 'pass' ? 'AMAN (≥1 MΩ)' : meggerStatus === 'fail' ? 'BOCOR (<1 MΩ)' : 'Min ≥ 1.0 MΩ'}
            </span>
          </div>
          <div>
            <label className="block text-[11px] text-slate-600 mb-1">Nilai Tahanan Isolasi (MΩ)</label>
            <input
              type="text"
              value={ft.insulationMohm || ''}
              onChange={(e) => updateField('insulationMohm', e.target.value)}
              placeholder="Contoh: 250 MΩ (pada uji 500V DC)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Panel Thermal */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              Thermal Terminasi Panel
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                tempStatus === 'pass'
                  ? 'bg-emerald-100 text-emerald-800'
                  : tempStatus === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tempStatus === 'pass' ? 'NORMAL (≤65°C)' : tempStatus === 'warning' ? 'HOTSPOT (>65°C)' : 'Maks ≤ 65°C'}
            </span>
          </div>
          <div>
            <label className="block text-[11px] text-slate-600 mb-1">Suhu Maksimum Busbar / MCB (°C)</label>
            <input
              type="text"
              value={ft.panelTempCelsius || ''}
              onChange={(e) => updateField('panelTempCelsius', e.target.value)}
              placeholder="Contoh: 34.5"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Checklist K3 & Kalibrasi Alat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        {/* K3 Checkboxes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Checklist Keselamatan K3 & Mekanik Panel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300">
              <input
                type="checkbox"
                checked={Boolean(ft.torqueChecked)}
                onChange={(e) => updateField('torqueChecked', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-700">Torsi Baut Terminasi Kencang</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300">
              <input
                type="checkbox"
                checked={Boolean(ft.k3LotoApplied)}
                onChange={(e) => updateField('k3LotoApplied', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-700">Prosedur LOTO & Labeling MCB</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300">
              <input
                type="checkbox"
                checked={Boolean(ft.k3ApdVerified)}
                onChange={(e) => updateField('k3ApdVerified', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-700">APD Tim Lapangan Lengkap</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300">
              <input
                type="checkbox"
                checked={Boolean(ft.k3FireExtAvailable)}
                onChange={(e) => updateField('k3FireExtAvailable', e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-700">Area Kering & Bebas Risiko Api</span>
            </label>
          </div>
        </div>

        {/* Calibration & Notes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-slate-600" />
            Log Kalibrasi Alat Ukur & Catatan Surveyor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={ft.instrumentName || ''}
              onChange={(e) => updateField('instrumentName', e.target.value)}
              placeholder="Alat (cth: Kyoritsu 4105A)"
              className="px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={ft.instrumentSerial || ''}
              onChange={(e) => updateField('instrumentSerial', e.target.value)}
              placeholder="No. Seri Alat"
              className="px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={ft.instrumentCalDate || ''}
              onChange={(e) => updateField('instrumentCalDate', e.target.value)}
              placeholder="Berlaku Kalibrasi"
              className="px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={ft.fieldNotes || ''}
              onChange={(e) => updateField('fieldNotes', e.target.value)}
              placeholder="Catatan teknis tambahan lapangan (rekomendasi beban, kondisi panel PLN, dll)..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
