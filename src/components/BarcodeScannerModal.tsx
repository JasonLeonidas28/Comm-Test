import React, { useRef, useState, useEffect } from 'react';
import { X, QrCode, Camera, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedValue: string) => void;
  title?: string;
  expectedType?: string; // e.g. "S/N Unit" or "ID PLN"
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Pindai Barcode / QR Code',
  expectedType = 'S/N Unit / ID PLN',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const scanIntervalRef = useRef<number | null>(null);

  // Start Camera
  useEffect(() => {
    if (!isOpen) return;

    let localStream: MediaStream | null = null;
    const startCam = async () => {
      try {
        setCameraError(null);
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.play();
        }
      } catch (err: any) {
        console.error('Camera open error:', err);
        setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
      }
    };

    startCam();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Use native BarcodeDetector if available in browser
  useEffect(() => {
    if (!isOpen || !stream) return;

    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix'],
      });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleDetected(rawValue);
            }
          }
        } catch (e) {
          // ignore transient detection errors
        }
      }, 500);
    }

    return () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen, stream]);

  if (!isOpen) return null;

  const handleDetected = (code: string) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onScanSuccess(code.trim());
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetected(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Arahkan kamera ke stiker barcode / QR code</p>
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

        {/* Video / Camera Viewport */}
        <div className="relative bg-black h-72 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="text-center p-6 text-slate-300">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
              <p className="text-[11px] text-slate-400">
                Anda juga dapat memasukkan nomor secara manual di kolom input bawah.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Target Aim Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-40 border-2 border-emerald-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Glowing Scanning Line */}
                  <div className="absolute left-0 right-0 top-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                  <div className="absolute -top-6 left-0 right-0 text-center">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase bg-black/60 px-2 py-0.5 rounded">
                      Posisikan Barcode / QR
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manual Input or Presets */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={`Ketik manual ${expectedType}...`}
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Gunakan
            </button>
          </form>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
              Contoh Format Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setManualCode('BSS-26051341000745')}
                className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                BSS-26051341000745
              </button>
              <button
                type="button"
                onClick={() => setManualCode('PLN-54710293817')}
                className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                PLN-54710293817
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
