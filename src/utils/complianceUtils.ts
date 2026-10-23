export interface ComplianceResult {
  status: 'EXCELLENT' | 'PASS' | 'WARNING' | 'FAIL' | 'UNTESTED';
  label: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  standard: string;
  recommendation?: string;
}

/**
 * Evaluates Grounding Resistance based on Indonesian Electrical Standard (PUIL 2011 / SPLN D3.022-1:2012)
 * Standard PUIL: < 5.0 Ohm
 * Recommended EV Charging Station: < 1.0 - 2.0 Ohm
 */
export function evaluateGrounding(valueStr?: string): ComplianceResult {
  if (!valueStr) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Standar PUIL ≤ 5.0 Ω (Rekomendasi EV ≤ 1.0 Ω)',
    };
  }

  // Parse numeric value, handles "3.44", "3,44", "3.44 Ω", "3.44 Ohm"
  const cleanStr = valueStr.replace(',', '.').replace(/[^0-9.]/g, '');
  const val = parseFloat(cleanStr);

  if (isNaN(val)) {
    return {
      status: 'UNTESTED',
      label: 'Format Tidak Valid',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Masukkan angka Ohm',
    };
  }

  if (val <= 1.0) {
    return {
      status: 'EXCELLENT',
      label: `SANGAT BAIK (${val} Ω)`,
      badgeColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-500',
      standard: 'Memenuhi Rekomendasi EV Charging Station (≤ 1.0 Ω)',
    };
  } else if (val <= 5.0) {
    return {
      status: 'PASS',
      label: `MEMENUHI STANDAR (${val} Ω)`,
      badgeColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-500',
      standard: 'Lulus Standar PUIL / PLN (≤ 5.0 Ω)',
    };
  } else {
    return {
      status: 'FAIL',
      label: `MELEBIHI BATAS (${val} Ω)`,
      badgeColor: 'bg-rose-100',
      textColor: 'text-rose-800',
      borderColor: 'border-rose-500',
      standard: 'Melebihi Batas PUIL (> 5.0 Ω)',
      recommendation: 'Periksa kedalaman ground rod atau tambahkan rod paralel & bentonit.',
    };
  }
}

/**
 * Evaluates Phase-to-Neutral Voltage (R-N, S-N, T-N)
 * Nominal: 220 V ±10% (198 V - 242 V)
 */
export function evaluateVoltagePhaseNeutral(valueStr?: string): ComplianceResult {
  if (!valueStr) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Nominal 220 V (198V - 242V)',
    };
  }

  const cleanStr = valueStr.replace(',', '.').replace(/[^0-9.]/g, '');
  const val = parseFloat(cleanStr);

  if (isNaN(val)) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Nominal 220 V (198V - 242V)',
    };
  }

  if (val >= 210 && val <= 230) {
    return {
      status: 'EXCELLENT',
      label: `OPTIMAL (${val} V)`,
      badgeColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-500',
      standard: 'Sangat Stabil (210 - 230 V)',
    };
  } else if (val >= 198 && val <= 242) {
    return {
      status: 'PASS',
      label: `NORMAL (${val} V)`,
      badgeColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-500',
      standard: 'Toleransi PLN ±10% (198 - 242 V)',
    };
  } else {
    return {
      status: 'FAIL',
      label: `ABNORMAL (${val} V)`,
      badgeColor: 'bg-rose-100',
      textColor: 'text-rose-800',
      borderColor: 'border-rose-500',
      standard: 'Di Luar Toleransi PLN (198 - 242 V)',
      recommendation: val < 198 ? 'Tegangan drop (undervoltage)' : 'Tegangan lebih (overvoltage)',
    };
  }
}

/**
 * Evaluates Phase-to-Phase Voltage (R-S, S-T, T-R)
 * Nominal: 380 V ±10% (342 V - 418 V)
 */
export function evaluateVoltagePhasePhase(valueStr?: string): ComplianceResult {
  if (!valueStr) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Nominal 380 V (342V - 418V)',
    };
  }

  const cleanStr = valueStr.replace(',', '.').replace(/[^0-9.]/g, '');
  const val = parseFloat(cleanStr);

  if (isNaN(val)) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Nominal 380 V (342V - 418V)',
    };
  }

  if (val >= 365 && val <= 395) {
    return {
      status: 'EXCELLENT',
      label: `OPTIMAL (${val} V)`,
      badgeColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-500',
      standard: 'Sangat Stabil (365 - 395 V)',
    };
  } else if (val >= 342 && val <= 418) {
    return {
      status: 'PASS',
      label: `NORMAL (${val} V)`,
      badgeColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-500',
      standard: 'Toleransi PLN ±10% (342 - 418 V)',
    };
  } else {
    return {
      status: 'FAIL',
      label: `ABNORMAL (${val} V)`,
      badgeColor: 'bg-rose-100',
      textColor: 'text-rose-800',
      borderColor: 'border-rose-500',
      standard: 'Di Luar Toleransi PLN (342 - 418 V)',
      recommendation: val < 342 ? 'Tegangan antar fasa drop' : 'Tegangan antar fasa overvoltage',
    };
  }
}

/**
 * Evaluates Neutral-to-Ground Voltage (N-G)
 * Ideal: < 2.0 V
 * Acceptable: < 5.0 V
 * Danger: > 5.0 V
 */
export function evaluateVoltageNeutralGround(valueStr?: string): ComplianceResult {
  if (!valueStr) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Aman ≤ 2.0 V (Maksimum 5.0 V)',
    };
  }

  const cleanStr = valueStr.replace(',', '.').replace(/[^0-9.]/g, '');
  const val = parseFloat(cleanStr);

  if (isNaN(val)) {
    return {
      status: 'UNTESTED',
      label: 'Belum Diuji',
      badgeColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      standard: 'Aman ≤ 2.0 V (Maksimum 5.0 V)',
    };
  }

  if (val <= 2.0) {
    return {
      status: 'EXCELLENT',
      label: `AMAN & SEIMBANG (${val} V)`,
      badgeColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-500',
      standard: 'Sangat Baik (≤ 2.0 V)',
    };
  } else if (val <= 5.0) {
    return {
      status: 'WARNING',
      label: `PERHATIAN (${val} V)`,
      badgeColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-500',
      standard: 'Batas Toleransi (≤ 5.0 V)',
      recommendation: 'Periksa beban tidak seimbang antar fasa atau kualitas pembumian.',
    };
  } else {
    return {
      status: 'FAIL',
      label: `BAHAYA KEBOCORAN (${val} V)`,
      badgeColor: 'bg-rose-100',
      textColor: 'text-rose-800',
      borderColor: 'border-rose-500',
      standard: 'Melebihi Batas Aman (> 5.0 V)',
      recommendation: 'Tegangan N-G tinggi berisiko merusak modul elektronik BSS. Wajib perbaiki grounding!',
    };
  }
}
