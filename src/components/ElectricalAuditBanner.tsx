import React from 'react';
import { CommissioningReport } from '../types/report';
import { evaluateElectricalStatus, ElectricalVerdict } from '../utils/electricalValidation';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Zap, Gauge, Info } from 'lucide-react';

interface ElectricalAuditBannerProps {
  report: CommissioningReport;
}

export const ElectricalAuditBanner: React.FC<ElectricalAuditBannerProps> = ({ report }) => {
  const verdict: ElectricalVerdict = evaluateElectricalStatus(report);

  const getStatusBadge = (status: 'pass' | 'warning' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> PERINGATAN
          </span>
        );
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" /> TIDAK LAYAK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            BELUM DIISI
          </span>
        );
    }
  };

  const getVerdictTheme = () => {
    switch (verdict.status) {
      case 'PASSED':
        return {
          bg: 'bg-emerald-50 border-emerald-300',
          text: 'text-emerald-900',
          icon: <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />,
          badgeBg: 'bg-emerald-600 text-white',
        };
      case 'FAILED':
        return {
          bg: 'bg-rose-50 border-rose-300',
          text: 'text-rose-900',
          icon: <XCircle className="w-7 h-7 text-rose-600 shrink-0" />,
          badgeBg: 'bg-rose-600 text-white',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 border-amber-300',
          text: 'text-amber-900',
          icon: <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />,
          badgeBg: 'bg-amber-600 text-white',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200',
          text: 'text-slate-800',
          icon: <Info className="w-7 h-7 text-slate-500 shrink-0" />,
          badgeBg: 'bg-slate-700 text-white',
        };
    }
  };

  const theme = getVerdictTheme();

  return (
    <div className={`rounded-2xl border p-5 shadow-xs transition-all ${theme.bg}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div className="flex items-start gap-3.5">
          {theme.icon}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 text-xs font-black tracking-wider uppercase rounded-full ${theme.badgeBg}`}>
                {verdict.status}
              </span>
              <h3 className={`text-base font-black ${theme.text}`}>{verdict.title}</h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">{verdict.message}</p>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-start md:self-auto flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-black/10">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Audit Standar PUIL / PLN</span>
        </div>
      </div>

      {/* Grid of electrical items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {verdict.items.map((item) => (
          <div
            key={item.key}
            className="bg-white p-3.5 rounded-xl border border-black/5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase line-clamp-1">
                  {item.label}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <div className="flex items-baseline gap-1 my-1">
                <span className="text-xl font-black font-mono text-slate-900">
                  {item.value}
                </span>
                <span className="text-xs font-bold text-slate-500">{item.unit}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] space-y-0.5">
              <p className="text-slate-400 font-medium">{item.standardNote}</p>
              <p
                className={`font-semibold ${
                  item.status === 'fail'
                    ? 'text-rose-600'
                    : item.status === 'warning'
                    ? 'text-amber-700'
                    : item.status === 'pass'
                    ? 'text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {item.feedback}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
