import React, { useRef } from 'react';
import { CommissioningReport } from '../types/report';
import { X, Plus, Trash2, Download, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: CommissioningReport[];
  currentReportId: string;
  onSelectReport: (report: CommissioningReport) => void;
  onNewReport: () => void;
  onDeleteReport: (id: string) => void;
  onImportReport: (report: CommissioningReport) => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  isOpen,
  onClose,
  reports,
  currentReportId,
  onSelectReport,
  onNewReport,
  onDeleteReport,
  onImportReport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJson = (report: CommissioningReport, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `comm-report-${report.generalInfo.plantName || report.id}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.generalInfo && json.bssVisual) {
          onImportReport(json);
          onClose();
        } else {
          alert('Format berkas tidak valid untuk Commissioning Test Report');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Kelola Laporan Commissioning</h3>
            <p className="text-xs text-slate-500">Daftar formulir & draf tersimpan di perangkat ini</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              onNewReport();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Formulir Baru
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Impor dari Backup JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {/* List of drafts */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {reports.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Belum ada laporan tersimpan.
            </div>
          ) : (
            reports.map((r) => {
              const isCurrent = r.id === currentReportId;
              const dateStr = new Date(r.updatedAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    onSelectReport(r);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-lg ${
                        isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">
                          {r.generalInfo.plantName || r.title || 'Laporan Tanpa Nama'}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                            Sedang Dibuka
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.generalInfo.snChargerUnit ? `SN: ${r.generalInfo.snChargerUnit} • ` : ''}
                        Vendor: {r.generalInfo.installationVendor || 'Belum diisi'}
                      </p>
                      <span className="text-[11px] text-slate-400">Diperbarui: {dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleExportJson(r, e)}
                      className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Download JSON Backup"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus laporan "${r.generalInfo.plantName || r.title}" secara permanen? Data tidak akan muncul kembali saat refresh.`)) {
                          onDeleteReport(r.id);
                        }
                      }}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Laporan Secara Permanen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
