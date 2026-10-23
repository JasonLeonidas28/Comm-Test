import React, { useState } from 'react';
import { ApprovalSection, SignatureData } from '../types/report';
import { PenTool, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { SignatureModal } from './SignatureModal';

interface ApprovalSectionViewProps {
  approval: ApprovalSection;
  onChange: (updated: ApprovalSection) => void;
  vendorName?: string;
}

export const ApprovalSectionView: React.FC<ApprovalSectionViewProps> = ({
  approval,
  onChange,
  vendorName,
}) => {
  const [activeSignerKey, setActiveSignerKey] = useState<'preparedBy' | 'checkedBy' | 'approvedBy' | null>(
    null
  );

  const handleSignerChange = (
    key: 'preparedBy' | 'checkedBy' | 'approvedBy',
    field: keyof SignatureData,
    value: string
  ) => {
    onChange({
      ...approval,
      [key]: {
        ...approval[key],
        [field]: value,
      },
    });
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (!activeSignerKey) return;
    onChange({
      ...approval,
      [activeSignerKey]: {
        ...approval[activeSignerKey],
        signatureImage: signatureDataUrl,
        date: approval[activeSignerKey].date || new Date().toLocaleDateString('id-ID'),
      },
    });
  };

  const signersConfig: Array<{
    key: 'preparedBy' | 'checkedBy' | 'approvedBy';
    label: string;
    defaultRole: string;
    defaultCompany: string;
  }> = [
    {
      key: 'preparedBy',
      label: 'Prepared By (Vendor)',
      defaultRole: 'Project Manager',
      defaultCompany: vendorName || 'Vendor',
    },
    {
      key: 'checkedBy',
      label: 'Checked By (Setup Specialist)',
      defaultRole: 'Setup Specialist',
      defaultCompany: 'Vgreen Indonesia',
    },
    {
      key: 'approvedBy',
      label: 'Approved By (Head of Operations)',
      defaultRole: 'Head of Setup and Operations',
      defaultCompany: 'Vgreen Indonesia',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Persetujuan & Tanda Tangan (Approval)</h2>
        </div>
        <p className="text-xs text-slate-500">
          Lembar pengesahan hasil pengetesan commissioning sesuai format halaman 7 dokumen resmi V-Green.
        </p>

        {/* Statement quote box matching PDF */}
        <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 font-medium leading-relaxed italic">
          "{approval.statement}"
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {signersConfig.map(({ key, label, defaultRole, defaultCompany }) => {
            const data = approval[key];
            const hasSignature = Boolean(data.signatureImage);

            return (
              <div
                key={key}
                className="flex flex-col border border-slate-200 rounded-xl p-4 bg-slate-50/40 relative hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {label}
                  </span>
                  {hasSignature && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Ditandatangani
                    </span>
                  )}
                </div>

                {/* Signature box */}
                <div
                  onClick={() => setActiveSignerKey(key)}
                  className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg bg-white flex flex-col items-center justify-center p-2 mb-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group relative overflow-hidden"
                >
                  {data.signatureImage ? (
                    <>
                      <img
                        src={data.signatureImage}
                        alt="Tanda tangan"
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                        <PenTool className="w-3.5 h-3.5" /> Ganti Tanda Tangan
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-emerald-600">
                      <PenTool className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-xs font-medium">Klik untuk Tanda Tangan</span>
                    </div>
                  )}
                </div>

                {/* Form fields for Name, Designation, Company, Date */}
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Nama Lengkap:
                    </label>
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => handleSignerChange(key, 'name', e.target.value)}
                      placeholder="Nama terang"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Jabatan (Designation):
                    </label>
                    <input
                      type="text"
                      value={data.designation || defaultRole}
                      onChange={(e) => handleSignerChange(key, 'designation', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Perusahaan (Company):
                    </label>
                    <input
                      type="text"
                      value={data.company || defaultCompany}
                      onChange={(e) => handleSignerChange(key, 'company', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Tanggal:
                    </label>
                    <input
                      type="text"
                      value={data.date || ''}
                      onChange={(e) => handleSignerChange(key, 'date', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={Boolean(activeSignerKey)}
        title={
          activeSignerKey === 'preparedBy'
            ? 'Prepared By (Vendor)'
            : activeSignerKey === 'checkedBy'
            ? 'Checked By (Setup Specialist - Vgreen)'
            : 'Approved By (Head of Setup and Operations - Vgreen)'
        }
        currentSignature={activeSignerKey ? approval[activeSignerKey].signatureImage : undefined}
        onClose={() => setActiveSignerKey(null)}
        onSave={handleSaveSignature}
      />
    </div>
  );
};
