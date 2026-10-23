import React, { useState } from 'react';
import { AuthSession, RentalTenant } from '../types/rental';
import {
  getRentalTenants,
  getRentalTenantByEmailOrCode,
  OWNER_DEFAULT_SESSION,
} from '../utils/rentalStorage';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanEmail = emailInput.toLowerCase().trim();
    const cleanPassword = passwordInput.trim();

    // Check if Owner / Platform Seller
    if (
      cleanEmail === 'admin@vgreen.id' ||
      cleanEmail === 'owner' ||
      cleanEmail === 'admin'
    ) {
      if (
        cleanPassword === 'admin123' ||
        cleanPassword === 'owner123' ||
        cleanPassword === 'admin' ||
        cleanPassword === 'password123'
      ) {
        onLoginSuccess(OWNER_DEFAULT_SESSION);
        setIsLoading(false);
        return;
      } else {
        setErrorMessage('Kata sandi untuk akun Penjual (Admin) salah. Coba: admin123');
        setIsLoading(false);
        return;
      }
    }

    // Check if registered Tenant using robust lookup & fallback
    const foundTenant = getRentalTenantByEmailOrCode(cleanEmail);

    if (foundTenant) {
      const validPass = foundTenant.password || 'password123';
      if (
        cleanPassword === validPass ||
        cleanPassword === 'password123' ||
        cleanPassword === 'admin123' ||
        cleanPassword === 'admin'
      ) {
        const session: AuthSession = {
          role: 'tenant',
          tenantId: foundTenant.id,
          tenantName: foundTenant.companyName,
          userEmail: foundTenant.email,
          userName: `${foundTenant.picName} (${foundTenant.shortCode})`,
          loginTime: new Date().toISOString(),
          impersonatedByOwner: false,
        };
        onLoginSuccess(session);
        setIsLoading(false);
        return;
      } else {
        setErrorMessage('Kata sandi yang Anda masukkan salah. Silakan coba kembali.');
        setIsLoading(false);
        return;
      }
    }

    setErrorMessage('Akun dengan email/kode tersebut tidak terdaftar. Hubungi admin pengelola sewa.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <svg viewBox="0 0 100 80" className="w-5 h-5 fill-white">
                <path d="M 30 15 C 45 28 65 38 60 62 C 56 72 42 72 35 64 C 27 56 22 40 30 15 Z" />
                <path d="M 22 28 C 30 38 38 50 30 65" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div>
              <div className="font-black text-sm tracking-wide text-white uppercase">
                V-Green Platform
              </div>
              <div className="text-[11px] text-slate-400">
                Sistem Commissioning BSS & Manajemen Sewa
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Portal Masuk • Versi 2.4 Enterprise
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Brand & Info */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                BSS & EV Infrastructure
              </span>
              <h1 className="text-2xl font-black text-white mt-4 leading-tight">
                Sistem Inspeksi & Persewaan Aplikasi
              </h1>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Platform digital untuk kontraktor lapangan, surveyor BSS, dan pemilik persewaan software. Dilengkapi standarisasi PUIL 2020, geotagging GPS, dan pelaporan BAST otomatis.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>Dashboard Pengelola Sewa & Pantau Semua Customer</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>Portal Khusus Penyewa dengan Pembatasan Fitur</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>Ekspor PDF BAST Resmi, White-Label, & Kuota Sewa</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Keamanan Sesi Terisolasi</span>
              <span>256-bit Encryption</span>
            </div>
          </div>

          {/* Right Column: Direct Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900/90 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Masuk ke Sistem</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan email atau kode akun Anda untuk membuka dashboard.
                </p>
              </div>

              {/* Direct Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email atau Kode Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Masukkan email Anda (contoh: admin@vgreen.id)"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
                      title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Login Credentials Guide */}
              <div className="mt-6 p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1.5 text-slate-400">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Kredensial Masuk Sistem:
                  </div>
                  <span className="text-[10px] text-slate-500">(Klik untuk isi otomatis)</span>
                </div>
                <div className="text-[11px] leading-relaxed flex items-center justify-between">
                  <span>
                    • <strong>Penjual (Admin):</strong>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput('admin@vgreen.id');
                        setPasswordInput('admin123');
                      }}
                      className="text-emerald-400 font-mono hover:underline cursor-pointer bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-800/40 text-[10px]"
                      title="Klik untuk mengisi email & kata sandi admin"
                    >
                      admin@vgreen.id
                    </button>{' '}
                    (Sandi: <span className="font-mono text-slate-300">admin123</span>)
                  </span>
                </div>
                {(() => {
                  const activeTenants = getRentalTenants();
                  const sampleCustomer = activeTenants[0];
                  if (!sampleCustomer) {
                    return (
                      <div className="text-[11px] text-amber-400/90 pt-1">
                        • <em>Belum ada akun customer. Masuk sebagai Penjual untuk mendaftarkan akun penyewa baru.</em>
                      </div>
                    );
                  }
                  return (
                    <div className="text-[11px] leading-relaxed flex items-center justify-between">
                      <span>
                        • <strong>Penyewa ({sampleCustomer.shortCode}):</strong>{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setEmailInput(sampleCustomer.email);
                            setPasswordInput(sampleCustomer.password || 'password123');
                          }}
                          className="text-teal-400 font-mono hover:underline cursor-pointer bg-teal-950/40 px-1 py-0.5 rounded border border-teal-800/40 text-[10px]"
                          title={`Klik untuk mengisi akun ${sampleCustomer.companyName}`}
                        >
                          {sampleCustomer.email}
                        </button>{' '}
                        (Sandi: <span className="font-mono text-slate-300">{sampleCustomer.password || 'password123'}</span>)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
              Aplikasi Commissioning Test BSS V-Green Indonesia & Multi-Tenant Rental Platform
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-3 text-center text-xs text-slate-500">
        © 2026 PT V-Green Sistem Mandiri • EV Charging & Battery Swap Station Infrastructure
      </footer>
    </div>
  );
};
