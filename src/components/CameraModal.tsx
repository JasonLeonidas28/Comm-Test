import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RotateCw, Check, AlertCircle } from 'lucide-react';
import { PhotoItem } from '../types/report';
import { compressImage, getFormattedTimestamp } from '../utils/imageUtils';

interface CameraModalProps {
  item: PhotoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCapture: (capturedDataUrl: string, timestamp: string) => void;
  withWatermark?: boolean;
  gpsCoord?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  item,
  isOpen,
  onClose,
  onCapture,
  withWatermark = true,
  gpsCoord,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setPreviewImage(null);
      setErrorMsg(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      // Fallback try any camera
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (e: any) {
        setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setPreviewImage(dataUrl);
  };

  const handleRetake = () => {
    setPreviewImage(null);
  };

  const handleConfirm = async () => {
    if (!previewImage || !item) return;
    const timestamp = getFormattedTimestamp();
    const watermark = withWatermark ? `${item.label} • ${timestamp}` : undefined;

    // Convert dataUrl to blob and compress
    const res = await fetch(previewImage);
    const blob = await res.blob();
    const compressed = await compressImage(
      blob,
      1400,
      1400,
      0.85,
      watermark,
      withWatermark ? gpsCoord : undefined
    );

    onCapture(compressed, timestamp);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Ambil Foto Inspeksi
            </span>
            <h3 className="text-base font-bold text-white">{item.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-rose-300 flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <p className="text-sm">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500"
              >
                Coba Lagi
              </button>
            </div>
          ) : previewImage ? (
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          )}

          {/* Grid target overlay */}
          {!previewImage && !errorMsg && (
            <div className="pointer-events-none absolute inset-6 border border-white/30 rounded-lg flex flex-col justify-between p-4">
              <div className="flex justify-between text-[11px] text-white/70 font-mono">
                <span>[ FRAME FOTO ]</span>
                <span>V-GREEN INSPECTION</span>
              </div>
              <div className="self-center w-8 h-8 border-2 border-emerald-400/80 rounded-full" />
              <div className="text-center text-[10px] text-white/60">
                Posisikan objek di dalam frame dengan pencahayaan cukup
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          {previewImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Ulangi
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/40 transition-colors"
              >
                <Check className="w-5 h-5" />
                Gunakan Foto Ini
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Putar Kamera (Depan/Belakang)"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSnap}
                disabled={Boolean(errorMsg)}
                className="w-16 h-16 rounded-full bg-white hover:bg-emerald-50 active:scale-95 flex items-center justify-center border-4 border-slate-400 transition-all shadow-lg mx-auto disabled:opacity-40"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>
              <div className="w-11" /> {/* balance spacing */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
