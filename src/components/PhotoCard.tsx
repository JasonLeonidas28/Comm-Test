import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  RotateCw,
  Pencil,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { PhotoItem } from '../types/report';
import { compressImage, getFormattedTimestamp } from '../utils/imageUtils';
import {
  evaluateGrounding,
  evaluateVoltagePhaseNeutral,
  evaluateVoltagePhasePhase,
  evaluateVoltageNeutralGround,
  ComplianceResult,
} from '../utils/complianceUtils';

interface PhotoCardProps {
  item: PhotoItem;
  onChange: (updatedItem: PhotoItem) => void;
  onOpenLiveCamera: (item: PhotoItem) => void;
  onPreview: (item: PhotoItem) => void;
  onOpenMarkup?: (item: PhotoItem) => void;
  withWatermark?: boolean;
  gpsCoord?: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  item,
  onChange,
  onOpenLiveCamera,
  onPreview,
  onOpenMarkup,
  withWatermark = true,
  gpsCoord,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const file = files[0];
      const timestamp = getFormattedTimestamp();
      const watermark = withWatermark ? `${item.label} • ${timestamp}` : undefined;
      const compressedDataUrl = await compressImage(file, 1400, 1400, 0.85, watermark, withWatermark ? gpsCoord : undefined);

      onChange({
        ...item,
        imageData: compressedDataUrl,
        timestamp,
      });
    } catch (err) {
      console.error('Failed to process image', err);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...item,
      imageData: undefined,
      timestamp: undefined,
    });
  };

  const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...item,
      measurementValue: e.target.value,
    });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...item,
      caption: e.target.value,
    });
  };

  const handleApplyPresetCaption = (preset: string) => {
    const current = item.caption ? `${item.caption}, ${preset}` : preset;
    onChange({
      ...item,
      caption: current,
    });
  };

  // Voice-to-Text Support via Web Speech API (Indonesian)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Fitur suara tidak didukung di browser ini. Gunakan Chrome di Android/PC.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const current = item.caption ? `${item.caption} ${transcript}` : transcript;
          onChange({
            ...item,
            caption: current,
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech error', err);
      setIsListening(false);
    }
  };

  // Calculate electrical compliance if this is a measurement card
  let compliance: ComplianceResult | null = null;
  if (item.measurementUnit === 'Ω' || item.label.includes('OHM')) {
    compliance = evaluateGrounding(item.measurementValue);
  } else if (item.label.includes('N - G') || item.label.includes('N-G')) {
    compliance = evaluateVoltageNeutralGround(item.measurementValue);
  } else if (item.label.includes('R - N') || item.label.includes('S - N') || item.label.includes('T - N')) {
    compliance = evaluateVoltagePhaseNeutral(item.measurementValue);
  } else if (item.label.includes('R - S') || item.label.includes('S - T') || item.label.includes('T - R')) {
    compliance = evaluateVoltagePhasePhase(item.measurementValue);
  }

  const isFilled = Boolean(item.imageData);

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden flex flex-col ${
        item.highlightYellow ? 'bg-amber-50/70 border-amber-300 shadow-xs' : 'bg-white border-slate-200 shadow-xs'
      } ${isFilled ? 'ring-1 ring-emerald-500/30' : 'hover:border-emerald-400'}`}
    >
      {/* Header bar of the card */}
      <div
        className={`px-3 py-2.5 border-b flex items-start justify-between gap-2 ${
          item.highlightYellow ? 'bg-amber-100/70 border-amber-200' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              {item.label}
            </span>
            {item.highlightYellow && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-200 text-amber-900 rounded">
                Foundasi
              </span>
            )}
            {isFilled && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Terisi
              </span>
            )}
          </div>
          {item.sublabel && (
            <p className="text-[11px] text-slate-500 italic mt-0.5">{item.sublabel}</p>
          )}
        </div>
      </div>

      {/* Main Photo Area */}
      <div className="p-3 flex-1 flex flex-col">
        {isFilled && item.imageData ? (
          <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 flex items-center justify-center">
            <img
              src={item.imageData}
              alt={item.label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              onClick={() => onPreview(item)}
            />

            {/* Hover overlay actions */}
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 flex-wrap p-2">
              <button
                type="button"
                onClick={() => onPreview(item)}
                className="p-2 bg-white/90 text-slate-800 rounded-lg shadow hover:bg-white hover:scale-110 transition-transform"
                title="Lihat Penuh"
              >
                <Eye className="w-4 h-4" />
              </button>
              {onOpenMarkup && (
                <button
                  type="button"
                  onClick={() => onOpenMarkup(item)}
                  className="p-2 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 hover:scale-110 transition-transform"
                  title="Anotasi / Coret Foto"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 hover:scale-110 transition-transform"
                title="Ambil Ulang (Kamera)"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:scale-110 transition-transform"
                title="Ganti Foto (Galeri)"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-rose-600 text-white rounded-lg shadow hover:bg-rose-700 hover:scale-110 transition-transform"
                title="Hapus Foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Timestamp tag bottom right */}
            {item.timestamp && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-[10px] text-white font-mono rounded">
                {item.timestamp}
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-4 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-emerald-50/30 transition-colors aspect-4/3 text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <RotateCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-medium text-slate-600">Memproses foto...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Belum ada foto</p>
                  <p className="text-[11px] text-slate-400">Ambil foto langsung atau unggah dari galeri</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
                  {/* Camera capture button (triggers direct mobile camera) */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Kamera HP
                  </button>

                  {/* WebCam modal for desktop / tablet */}
                  <button
                    type="button"
                    onClick={() => onOpenLiveCamera(item)}
                    className="inline-flex items-center justify-center px-2 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                    title="Live WebCam"
                  >
                    Webcam
                  </button>

                  {/* Gallery file picker */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Galeri
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Input for Measurements (Ohm, Voltage) with Live Electrical Compliance Badge */}
        {item.measurementUnit && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600">
              Hasil Pengukuran ({item.measurementUnit}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.measurementValue || ''}
                onChange={handleMeasurementChange}
                placeholder={`Contoh: ${item.label.includes('OHM') ? '3.44' : '220'}`}
                className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-xs font-bold px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                {item.measurementUnit}
              </span>
            </div>

            {/* Compliance Badge */}
            {compliance && item.measurementValue && (
              <div
                className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 ${compliance.badgeColor} ${compliance.textColor} ${compliance.borderColor}`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {compliance.status === 'PASS' || compliance.status === 'EXCELLENT' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{compliance.label}</span>
                </div>
                <span className="text-[10px] opacity-80 hidden sm:inline">{compliance.standard}</span>
              </div>
            )}
          </div>
        )}

        {/* Voice Note & Caption Input */}
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Catatan / Temuan Lapangan:
            </span>
            <div className="flex items-center gap-1">
              {isFilled && onOpenMarkup && (
                <button
                  type="button"
                  onClick={() => onOpenMarkup(item)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                >
                  <Pencil className="w-2.5 h-2.5" /> Anotasi
                </button>
              )}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Dikte Suara (Bicara)"
              >
                {isListening ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5 text-emerald-600" />}
                {isListening ? 'Mendengarkan...' : 'Suara'}
              </button>
            </div>
          </div>

          <input
            type="text"
            value={item.caption || ''}
            onChange={handleCaptionChange}
            placeholder="Ketik catatan atau klik 'Suara' untuk dikte..."
            className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:outline-none"
          />

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {['Kondisi Baik', 'Sesuai Standar', 'Baut Kencang', 'Segel Utuh'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleApplyPresetCaption(preset)}
                className="px-1.5 py-0.5 text-[9px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Hidden inputs for file uploads */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};
