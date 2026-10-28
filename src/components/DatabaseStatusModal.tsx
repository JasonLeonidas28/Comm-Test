import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  X,
  Server,
  ShieldCheck,
  HardDrive,
  LogOut,
  Mail,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutFirebase } from '../firebase/authService';
import { CommissioningReport } from '../types/report';
import { saveReportToFirestore, getAllReportsFromFirestore } from '../firebase/reportService';
import firebaseConfig from '../../firebase-applet-config.json';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: CommissioningReport[];
  onReportsMerged: (merged: CommissioningReport[]) => void;
  firebaseUser: User | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  reports,
  onReportsMerged,
  firebaseUser,
  syncStatus,
  lastSyncTime,
}) => {
  const [isOperating, setIsOperating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsOperating(true);
    setStatusMessage('Membuka jendela login Google...');
    try {
      await loginWithGoogle();
      setStatusMessage('Berhasil masuk dengan akun Google.');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setStatusMessage(`Gagal masuk: ${err?.message || 'Error otentikasi'}`);
      } else {
        setStatusMessage('');
      }
    } finally {
      setIsOperating(false);
    }
  };

  const handleGoogleLogout = async () => {
    setIsOperating(true);
    try {
      await logoutFirebase();
      setStatusMessage('Berhasil keluar dari akun Google.');
    } catch (err: any) {
      setStatusMessage(`Gagal keluar: ${err?.message || 'Error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleSyncAllToFirestore = async () => {
    setIsOperating(true);
    setStatusMessage(`Menyimpan ${reports.length} laporan ke Firebase Firestore...`);
    try {
      let count = 0;
      for (const report of reports) {
        await saveReportToFirestore(report);
        count++;
        setStatusMessage(`Menyimpan (${count}/${reports.length}): ${report.generalInfo.plantName || report.id}...`);
      }
      setStatusMessage(`✓ Berhasil menyimpan ${count} laporan ke Database Cloud Firestore!`);
    } catch (err: any) {
      console.error('Sync to Firestore error:', err);
      setStatusMessage(`Gagal sinkronisasi: ${err?.message || 'Periksa koneksi database'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handlePullFromFirestore = async () => {
    setIsOperating(true);
    setStatusMessage('Mengambil seluruh laporan tersimpan dari database Firestore...');
    try {
      const cloudReports = await getAllReportsFromFirestore();
      if (cloudReports.length === 0) {
        setStatusMessage('Belum ada laporan di database cloud. Gunakan "Simpan ke Cloud" untuk upload.');
      } else {
        // Merge cloud reports with local
        const mergedMap = new Map<string, CommissioningReport>();
        // Add cloud reports
        cloudReports.forEach((r) => mergedMap.set(r.id, r));
        // Add existing local reports if not present
        reports.forEach((r) => {
          if (!mergedMap.has(r.id)) {
            mergedMap.set(r.id, r);
          }
        });
        const mergedList = Array.from(mergedMap.values());
        onReportsMerged(mergedList);
        setStatusMessage(`✓ Berhasil memuat ${cloudReports.length} laporan dari database cloud Firestore!`);
      }
    } catch (err: any) {
      console.error('Fetch from Firestore error:', err);
      setStatusMessage(`Gagal memuat: ${err?.message || 'Periksa koneksi internet'}`);
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Database Cloud Firestore
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  Online
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Penyimpanan cloud resmi untuk seluruh data hasil pengujian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-slate-700 text-xs max-h-[75vh] overflow-y-auto">
          {/* Cloud Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" /> Status Koneksi Database
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung (Aktif)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Project ID:</span>
                <span className="font-mono font-bold text-slate-800">{firebaseConfig.projectId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Database ID:</span>
                <span className="font-mono text-[10px] font-bold text-slate-800 truncate block">
                  {firebaseConfig.firestoreDatabaseId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Laporan di Aplikasi:</span>
                <span className="font-bold text-slate-800">{reports.length} Laporan</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status Sinkronisasi:</span>
                <span className="font-bold text-emerald-700">
                  {syncStatus === 'syncing' ? 'Sedang Menyinkronkan...' : 'Real-time Aktif'}
                </span>
              </div>
            </div>

            {lastSyncTime && (
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Sinkronisasi Terakhir:</span>
                <span className="font-mono">{new Date(lastSyncTime).toLocaleTimeString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* User Auth Section */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Akun Sinkronisasi Google
              </span>
            </div>

            {firebaseUser ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {firebaseUser.email ? firebaseUser.email[0].toUpperCase() : 'G'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {firebaseUser.displayName || 'Akun Google Terhubung'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">{firebaseUser.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  disabled={isOperating}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">
                  Masuk dengan akun Google untuk mengaktifkan sinkronisasi otomatis antar handphone & komputer.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isOperating}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Sync Operations */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 block">Tindakan Database</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSyncAllToFirestore}
                disabled={isOperating}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold transition-all text-left flex items-start gap-2.5"
              >
                <UploadCloud className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Simpan ke Cloud</div>
                  <div className="text-[10px] text-emerald-800 font-normal">
                    Upload semua laporan lokal ke Firestore
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handlePullFromFirestore}
                disabled={isOperating}
                className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-950 font-bold transition-all text-left flex items-start gap-2.5"
              >
                <DownloadCloud className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold">Muat dari Cloud</div>
                  <div className="text-[10px] text-indigo-800 font-normal">
                    Ambil data laporan dari database cloud
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Live Status Feedback Message */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center gap-2 animate-fade-in">
              <RefreshCw className={`w-4 h-4 text-emerald-600 shrink-0 ${isOperating ? 'animate-spin' : ''}`} />
              <span className="leading-snug">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Struktur: <code>/reports</code> & <code>/reports/&#123;id&#125;/photos</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
