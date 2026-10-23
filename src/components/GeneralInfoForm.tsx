import React, { useState, useRef } from 'react';
import { GeneralInfo } from '../types/report';
import {
  MapPin,
  ExternalLink,
  Calendar,
  Building,
  Cpu,
  UserCheck,
  ShieldCheck,
  Zap,
  Upload,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  QrCode,
  Mic,
  MicOff,
  Building2,
} from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import { DEFAULT_VGREEN_LOGO } from '../utils/sampleData';

interface GeneralInfoFormProps {
  info: GeneralInfo;
  onChange: (updated: GeneralInfo) => void;
  onOpenScanner?: (targetField: 'snChargerUnit' | 'idPlnKodeBilling') => void;
  onOpenTenantProfile?: () => void;
}

export const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({
  info,
  onChange,
  onOpenScanner,
  onOpenTenantProfile,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [isListeningAddress, setIsListeningAddress] = useState(false);
  const vgreenLogoInputRef = useRef<HTMLInputElement>(null);
  const vendorLogoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (type: 'vgreen' | 'vendor', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImage(file, 900, 400, 0.9);
      if (type === 'vgreen') {
        onChange({ ...info, vgreenLogo: dataUrl });
      } else {
        onChange({ ...info, vendorLogo: dataUrl });
      }
    } catch (err) {
      console.error('Failed to upload logo', err);
      alert('Gagal memproses gambar logo');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleChange = (field: keyof GeneralInfo, value: string) => {
    const updated = { ...info, [field]: value };
    // If coordinate changes, optionally auto-suggest GMaps link if empty
    if (field === 'plantCoordinate' && value.includes(',') && !info.gmapsLink) {
      const [lat, lng] = value.split(',').map((s) => s.trim());
      if (lat && lng) {
        updated.gmapsLink = `https://maps.google.com/?q=${lat},${lng}`;
      }
    }
    onChange(updated);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser ini.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const coordString = `${lat}, ${lng}`;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

        onChange({
          ...info,
          plantCoordinate: coordString,
          gmapsLink: info.gmapsLink || mapsUrl,
        });
        setIsLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (err) => {
        setIsLocating(false);
        alert('Gagal mengambil koordinat: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleVoiceAddress = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Fitur suara tidak didukung oleh browser ini. Gunakan Google Chrome.');
      return;
    }

    if (isListeningAddress) {
      setIsListeningAddress(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningAddress(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          const current = info.plantAddress ? `${info.plantAddress} ${text}` : text;
          handleChange('plantAddress', current);
        }
      };
      recognition.onerror = () => setIsListeningAddress(false);
      recognition.onend = () => setIsListeningAddress(false);
      recognition.start();
    } catch (err) {
      setIsListeningAddress(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner with V-Green Official Styling */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* V-Green stylized leaf mark */}
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center p-2.5 shadow-inner">
              <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-300 fill-current">
                <path d="M 50 15 C 65 30 85 45 80 75 C 75 90 55 90 45 80 C 35 70 30 50 50 15 Z" fill="#4ade80" />
                <path d="M 40 30 C 50 42 60 55 50 75" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" fill="none" />
                <path d="M 25 50 C 30 70 45 85 65 85" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-widest text-lg text-white">V-GREEN</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 rounded border border-emerald-400/30">
                  COMM TEST REPORT V1.1
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mt-0.5">
                PRE-COMMISSIONING REPORT
              </h2>
              <p className="text-xs text-emerald-100/80">
                Formulir Inspeksi & Verifikasi Standar Battery Swap Station (BSS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
            <span className="text-emerald-300 font-semibold">Vendor:</span>
            <span className="text-white font-medium">{info.installationVendor || 'Belum diisi'}</span>
          </div>
        </div>
      </div>

      {/* Form Fields Grid matching the PDF */}
      <div className="p-6 space-y-6">
        {/* Section: Logo Perusahaan (2 Kolom: Vgreen & Vendor) */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Logo Header Dokumen (2 Kolom: Klien & Vendor)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unggah logo kustom Vgreen/Klien di sebelah kiri dan logo perusahaan Vendor di sebelah kanan untuk Halaman 1 laporan PDF.
              </p>
            </div>
            {onOpenTenantProfile && (
              <button
                type="button"
                onClick={onOpenTenantProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pengaturan Profil Penyewa & White-Label</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Kiri: Logo Vgreen Indonesia */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Logo Kolom Kiri: Vgreen Indonesia
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Resmi
                  </span>
                </div>
                <div className="w-full h-24 border border-slate-200 rounded-lg p-2 flex items-center justify-center bg-slate-50/50 overflow-hidden mb-3">
                  {info.vgreenLogo ? (
                    <img
                      src={info.vgreenLogo}
                      alt="Logo Vgreen"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada logo</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => vgreenLogoInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Ganti Logo Vgreen
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...info, vgreenLogo: DEFAULT_VGREEN_LOGO })}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Kembalikan ke Logo Default V-GREEN"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={vgreenLogoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload('vgreen', e)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Kolom Kanan: Logo Vendor */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Logo Kolom Kanan: Vendor ({info.installationVendor || 'Perusahaan Pelaksana'})
                  </span>
                  {info.vendorLogo && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                      Terunggah
                    </span>
                  )}
                </div>
                <div className="w-full h-24 border border-slate-200 rounded-lg p-2 flex items-center justify-center bg-slate-50/50 overflow-hidden mb-3">
                  {info.vendorLogo ? (
                    <img
                      src={info.vendorLogo}
                      alt="Logo Vendor"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <span className="text-xs font-semibold text-slate-500 block">
                        {info.installationVendor || 'Belum Ada Logo Vendor'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Klik tombol di bawah untuk mengunggah logo perusahaan vendor
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => vendorLogoInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Unggah Logo Vendor
                </button>
                {info.vendorLogo && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...info, vendorLogo: '' })}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                    title="Hapus Logo Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <input
                  ref={vendorLogoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload('vendor', e)}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Lokasi & Identitas Plant */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            1. Informasi Lokasi & Plant
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PLANT NAME <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={info.plantName}
                onChange={(e) => handleChange('plantName', e.target.value)}
                placeholder="Contoh: KJA APPAREL"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CUSTOMER
              </label>
              <input
                type="text"
                value={info.customer}
                onChange={(e) => handleChange('customer', e.target.value)}
                placeholder="Contoh: KJA APPAREL"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  PLANT ADDRESS <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleVoiceAddress}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                    isListeningAddress
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Dikte Alamat dengan Suara"
                >
                  {isListeningAddress ? <MicOff className="w-3 h-3 text-rose-600" /> : <Mic className="w-3 h-3 text-emerald-600" />}
                  {isListeningAddress ? 'Mendengarkan...' : 'Dikte Suara'}
                </button>
              </div>
              <textarea
                rows={2}
                value={info.plantAddress}
                onChange={(e) => handleChange('plantAddress', e.target.value)}
                placeholder="Jln. Bumi Sani Permai, Setiamekar, Kec. Tambun Sel., Kabupaten Bekasi, Jawa Barat 17510"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  PLANT COORDINATE
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {isLocating ? 'Mencari...' : locationSuccess ? '✓ Didapat!' : 'Ambil GPS HP'}
                </button>
              </div>
              <input
                type="text"
                value={info.plantCoordinate}
                onChange={(e) => handleChange('plantCoordinate', e.target.value)}
                placeholder="-6.257321, 107.034567"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono transition-shadow"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  GMAPS LINK
                </label>
                {info.gmapsLink && (
                  <a
                    href={info.gmapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                  >
                    Buka Peta <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={info.gmapsLink}
                onChange={(e) => handleChange('gmapsLink', e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Section: Unit EV Charger & Kelistrikan */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            2. Spesifikasi Unit & Kelistrikan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                EV CHARGER TYPE <span className="text-rose-500">*</span>
              </label>
              <select
                value={info.evChargerType}
                onChange={(e) => handleChange('evChargerType', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold bg-white"
              >
                {!['BSS 6 SLOT', 'BSS 12 SLOT 1 PHASE', 'BSS 12 SLOT 3 PHASE', 'DC 20', 'DC 30', 'DC 60'].includes(info.evChargerType) && info.evChargerType && (
                  <option value={info.evChargerType}>{info.evChargerType}</option>
                )}
                <option value="BSS 6 SLOT">BSS 6 SLOT</option>
                <option value="BSS 12 SLOT 1 PHASE">BSS 12 SLOT 1 PHASE</option>
                <option value="BSS 12 SLOT 3 PHASE">BSS 12 SLOT 3 PHASE</option>
                <option value="DC 20">DC 20</option>
                <option value="DC 30">DC 30</option>
                <option value="DC 60">DC 60</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  S/N EC CHARGER UNIT <span className="text-rose-500">*</span>
                </label>
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={() => onOpenScanner('snChargerUnit')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    title="Pindai Barcode / QR S/N Unit"
                  >
                    <QrCode className="w-3 h-3 text-emerald-600" />
                    Scan Barcode
                  </button>
                )}
              </div>
              <input
                type="text"
                value={info.snChargerUnit}
                onChange={(e) => handleChange('snChargerUnit', e.target.value)}
                placeholder="Contoh: BSS-26051341000745"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  ID PLN / KODE BILLING
                </label>
                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={() => onOpenScanner('idPlnKodeBilling')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    title="Pindai Barcode ID PLN Meter"
                  >
                    <QrCode className="w-3 h-3 text-emerald-600" />
                    Scan Barcode
                  </button>
                )}
              </div>
              <input
                type="text"
                value={info.idPlnKodeBilling}
                onChange={(e) => handleChange('idPlnKodeBilling', e.target.value)}
                placeholder="Contoh: 532810098765"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PROVIDER / NO SIM
              </label>
              <input
                type="text"
                value={info.providerSim}
                onChange={(e) => handleChange('providerSim', e.target.value)}
                placeholder="Telkomsel / 081234567890"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Pelaksana & Tanggal Pelaksanaan */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            3. Data Vendor & Jadwal Commissioning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                INSTALLATION VENDOR <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={info.installationVendor}
                onChange={(e) => handleChange('installationVendor', e.target.value)}
                placeholder="Contoh: DUTA HITA JAYA (DHJ)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIC VENDOR CONTACT
              </label>
              <input
                type="text"
                value={info.picVendorContact}
                onChange={(e) => handleChange('picVendorContact', e.target.value)}
                placeholder="Nama PIC (No HP/WA)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                INSTALLATION DATE
              </label>
              <input
                type="text"
                value={info.installationDate}
                onChange={(e) => handleChange('installationDate', e.target.value)}
                placeholder="DD/MM/YYYY (e.g. 18/09/2026)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                COMMISSIONING DATE
              </label>
              <input
                type="text"
                value={info.commissioningDate}
                onChange={(e) => handleChange('commissioningDate', e.target.value)}
                placeholder="DD/MM/YYYY (e.g. 19/09/2026)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
