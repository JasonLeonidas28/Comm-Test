import { CommissioningReport } from '../types/report';

export interface ValidationItem {
  key: string;
  label: string;
  value: string;
  unit: string;
  status: 'pass' | 'warning' | 'fail' | 'pending';
  standardNote: string;
  feedback: string;
}

export interface ElectricalVerdict {
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'PENDING';
  title: string;
  message: string;
  items: ValidationItem[];
  allPassed: boolean;
}

export function evaluateElectricalStatus(report: CommissioningReport): ElectricalVerdict {
  const items: ValidationItem[] = [];

  // 1. Grounding Test (Ohm)
  const groundingRaw = report.groundingVisual.groundingTestOhm.measurementValue?.replace(',', '.') || '';
  const groundingNum = parseFloat(groundingRaw);

  if (!groundingRaw || isNaN(groundingNum)) {
    items.push({
      key: 'grounding',
      label: 'Grounding Test (Resistansi Pembumian)',
      value: '-',
      unit: 'Ω',
      status: 'pending',
      standardNote: 'Standar PUIL ≤ 5.00 Ω (Rekomendasi BSS ≤ 1.00 Ω)',
      feedback: 'Belum diisi nilai hasil ukur earth tester.',
    });
  } else if (groundingNum <= 1.0) {
    items.push({
      key: 'grounding',
      label: 'Grounding Test (Resistansi Pembumian)',
      value: groundingNum.toFixed(2),
      unit: 'Ω',
      status: 'pass',
      standardNote: 'Standar PUIL ≤ 5.00 Ω (Target BSS ≤ 1.00 Ω)',
      feedback: 'Sangat Baik (< 1.00 Ω). Pembumian optimal untuk keselamatan.',
    });
  } else if (groundingNum <= 5.0) {
    items.push({
      key: 'grounding',
      label: 'Grounding Test (Resistansi Pembumian)',
      value: groundingNum.toFixed(2),
      unit: 'Ω',
      status: 'pass',
      standardNote: 'Standar PUIL ≤ 5.00 Ω',
      feedback: 'Memenuhi standar PUIL (≤ 5.00 Ω). Layak operasi.',
    });
  } else {
    items.push({
      key: 'grounding',
      label: 'Grounding Test (Resistansi Pembumian)',
      value: groundingNum.toFixed(2),
      unit: 'Ω',
      status: 'fail',
      standardNote: 'Standar PUIL ≤ 5.00 Ω',
      feedback: 'MELEBIHI BATAS AMAN (> 5.00 Ω). Berbahaya, wajib perbaikan titik ground!',
    });
  }

  // 2. Voltage (R-N)
  const vrnRaw = report.acPanelTesting.voltageRN.measurementValue?.replace(',', '.') || '';
  const vrnNum = parseFloat(vrnRaw);

  if (!vrnRaw || isNaN(vrnNum)) {
    items.push({
      key: 'voltageRN',
      label: 'Tegangan Fasa ke Netral (Voltage R-N)',
      value: '-',
      unit: 'V',
      status: 'pending',
      standardNote: 'Standar PLN 220 V ± 10% (198 V - 242 V)',
      feedback: 'Belum diisi hasil pengukuran multimeter.',
    });
  } else if (vrnNum >= 198 && vrnNum <= 242) {
    items.push({
      key: 'voltageRN',
      label: 'Tegangan Fasa ke Netral (Voltage R-N)',
      value: vrnNum.toString(),
      unit: 'V',
      status: 'pass',
      standardNote: 'Standar PLN 220 V ± 10% (198 V - 242 V)',
      feedback: 'Normal dalam batas toleransi jaringan PLN.',
    });
  } else {
    items.push({
      key: 'voltageRN',
      label: 'Tegangan Fasa ke Netral (Voltage R-N)',
      value: vrnNum.toString(),
      unit: 'V',
      status: 'warning',
      standardNote: 'Standar PLN 220 V ± 10% (198 V - 242 V)',
      feedback: vrnNum < 198 ? 'Tegangan drop / undervoltage (< 198 V).' : 'Tegangan tinggi / overvoltage (> 242 V).',
    });
  }

  // 3. Voltage (N-G)
  const vngRaw = report.acPanelTesting.voltageNG.measurementValue?.replace(',', '.') || '';
  const vngNum = parseFloat(vngRaw);

  if (!vngRaw || isNaN(vngNum)) {
    items.push({
      key: 'voltageNG',
      label: 'Tegangan Netral ke Ground (Voltage N-G)',
      value: '-',
      unit: 'V',
      status: 'pending',
      standardNote: 'Batas Aman ≤ 2.0 V (Semakin mendekati 0 V semakin baik)',
      feedback: 'Belum diisi hasil pengukuran multimeter.',
    });
  } else if (vngNum <= 2.0) {
    items.push({
      key: 'voltageNG',
      label: 'Tegangan Netral ke Ground (Voltage N-G)',
      value: vngNum.toString(),
      unit: 'V',
      status: 'pass',
      standardNote: 'Batas Aman ≤ 2.0 V',
      feedback: 'Sangat Baik (≤ 2.0 V). Tidak terindikasi kebocoran netral.',
    });
  } else {
    items.push({
      key: 'voltageNG',
      label: 'Tegangan Netral ke Ground (Voltage N-G)',
      value: vngNum.toString(),
      unit: 'V',
      status: 'warning',
      standardNote: 'Batas Aman ≤ 2.0 V',
      feedback: 'Tinggi (> 2.0 V). Potensi ketidakseimbangan beban atau grounding longgar.',
    });
  }

  // 4. Frequency
  const freqRaw = report.acPanelTesting.frequency.measurementValue?.replace(',', '.') || '';
  const freqNum = parseFloat(freqRaw);

  if (!freqRaw || isNaN(freqNum)) {
    items.push({
      key: 'frequency',
      label: 'Frekuensi Grid (Frequency)',
      value: '-',
      unit: 'Hz',
      status: 'pending',
      standardNote: 'Standar PLN 50.0 Hz ± 1% (49.5 - 50.5 Hz)',
      feedback: 'Belum diisi hasil ukur frekuensi.',
    });
  } else if (freqNum >= 49.5 && freqNum <= 50.5) {
    items.push({
      key: 'frequency',
      label: 'Frekuensi Grid (Frequency)',
      value: freqNum.toString(),
      unit: 'Hz',
      status: 'pass',
      standardNote: 'Standar PLN 50.0 Hz ± 1%',
      feedback: 'Frekuensi grid stabil sesuai standar nasional.',
    });
  } else {
    items.push({
      key: 'frequency',
      label: 'Frekuensi Grid (Frequency)',
      value: freqNum.toString(),
      unit: 'Hz',
      status: 'warning',
      standardNote: 'Standar PLN 50.0 Hz ± 1%',
      feedback: 'Frekuensi fluktuatif di luar batas normal 50 Hz.',
    });
  }

  // Determine overall verdict
  const hasFail = items.some((i) => i.status === 'fail');
  const hasWarning = items.some((i) => i.status === 'warning');
  const hasPending = items.some((i) => i.status === 'pending');

  if (hasFail) {
    return {
      status: 'FAILED',
      title: 'TIDAK LAYAK / PERLU PERBAIKAN SEGERA',
      message: 'Parameter keselamatan pembumian / kelistrikan melebihi batas toleransi. Unit belum aman untuk komisioning komersial.',
      items,
      allPassed: false,
    };
  }

  if (hasWarning) {
    return {
      status: 'WARNING',
      title: 'LAYAK BERSYARAT (CATATAN KHUSUS)',
      message: 'Parameter utama aman, namun terdapat peringatan teknis yang disarankan untuk penyesuaian lapangan.',
      items,
      allPassed: false,
    };
  }

  if (hasPending) {
    return {
      status: 'PENDING',
      title: 'DATA UJI BELUM LENGKAP',
      message: 'Masih ada kolom pengukuran kelistrikan atau resistansi grounding yang belum diisi.',
      items,
      allPassed: false,
    };
  }

  return {
    status: 'PASSED',
    title: 'LAYAK OPERASI (COMMISSIONING APPROVED)',
    message: 'Seluruh parameter pengujian grounding, tegangan kerja, dan frekuensi memenuhi standar teknis PLN & PUIL.',
    items,
    allPassed: true,
  };
}
