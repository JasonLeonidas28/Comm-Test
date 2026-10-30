import React, { useState } from 'react';
import { AuthSession, RentalTenant } from '../types/rental';
import {
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
  Database,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import {
  loginWithGoogle,
  loginOrLinkWithEmail,
  formatFirebaseAuthError,
} from '../firebase/authService';
import { NewCustomerOnboardingModal } from './NewCustomerOnboardingModal';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New customer onboarding state
  const [pendingOnboardingUser, setPendingOnboardingUser] = useState<{
    email: string;
    displayName?: string;
    uid?: string;
  } | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanInput = emailInput.toLowerCase().trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanInput || !cleanPassword) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      setIsLoading(false);
      return;
    }

    // Logging in with Firebase Email & Password
    let targetEmail = cleanInput;
    let displayName = '';
    let isTargetOwner = false;

    // Check if input is a shortcut for Owner / Platform Seller
    const foundTenant = getRentalTenantByEmailOrCode(cleanInput);
    if (
      cleanInput === 'voltcheck@admin' ||
      cleanInput === 'voltcheck@admin.com' ||
      cleanInput === 'admin@voltcheck.id' ||
      cleanInput === 'admin@vgreen.id' ||
      cleanInput === 'owner' ||
      cleanInput === 'admin'
    ) {
      targetEmail = 'voltcheck@admin.com';
      displayName = 'Admin VoltCheck';
      isTargetOwner = true;
    } else if (foundTenant) {
      targetEmail = foundTenant.email;
      displayName = `${foundTenant.picName} (${foundTenant.shortCode})`;
      // Validate customer password against password set by admin
      if (foundTenant.password && cleanPassword !== foundTenant.password.trim()) {
        setErrorMessage('Kata sandi salah. Masukkan kata sandi yang telah ditentukan oleh Admin untuk akun ini.');
        setIsLoading(false);
        return;
      }
    }

    // If input lacks domain format and not admin, require valid email
    if (!targetEmail.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid (contoh: voltcheck@admin atau user@gmail.com).');
      setIsLoading(false);
      return;
    }

    try {
      const user = await loginOrLinkWithEmail(
        targetEmail,
        cleanPassword,
        displayName,
        true
      );

      const userEmail = (user.email || targetEmail).toLowerCase().trim();

      // Check if Owner
      if (
        isTargetOwner ||
        userEmail === 'voltcheck@admin.com' ||
        userEmail === 'admin@vgreen.id' ||
        userEmail === 'kerjaanjason@gmail.com' ||
        userEmail.startsWith('admin@') ||
        userEmail.includes('voltcheck')
      ) {
        onLoginSuccess(OWNER_DEFAULT_SESSION);
        return;
      }

      // Check if matching registered tenant
      const verifiedTenant = getRentalTenantByEmailOrCode(userEmail) || foundTenant;
      if (verifiedTenant) {
        const session: AuthSession = {
          role: 'tenant',
          tenantId: verifiedTenant.id,
          tenantName: verifiedTenant.companyName,
          userEmail: verifiedTenant.email,
          userName: `${verifiedTenant.picName} (${verifiedTenant.shortCode})`,
          loginTime: new Date().toISOString(),
          impersonatedByOwner: false,
        };
        onLoginSuccess(session);
        return;
      }

      // Customer account not registered in tenants list yet:
      // Open onboarding modal to complete registration form & package selection
      setPendingOnboardingUser({
        email: userEmail,
        displayName: user.displayName || userEmail.split('@')[0],
        uid: user.uid,
      });
      setShowOnboardingModal(true);
    } catch (err: any) {
      // If Firebase Auth threw an error but credentials match the tenant registered by owner
      if (foundTenant && foundTenant.password && foundTenant.password.trim() === cleanPassword) {
        onLoginSuccess({
          role: 'tenant',
          tenantId: foundTenant.id,
          tenantName: foundTenant.companyName,
          userEmail: foundTenant.email,
          userName: `${foundTenant.picName} (${foundTenant.shortCode})`,
          loginTime: new Date().toISOString(),
          impersonatedByOwner: false,
        });
        return;
      }
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      const userEmail = (user.email || '').toLowerCase().trim();
      
      // If admin or bootstrap email
      if (
        userEmail === 'voltcheck@admin.com' ||
        userEmail === 'admin@voltcheck.id' ||
        userEmail === 'admin@vgreen.id' ||
        userEmail === 'kerjaanjason@gmail.com' ||
        userEmail.startsWith('admin@') ||
        userEmail.includes('voltcheck')
      ) {
        onLoginSuccess(OWNER_DEFAULT_SESSION);
        return;
      }

      // Check if matches an existing registered tenant
      const foundTenant = getRentalTenantByEmailOrCode(userEmail);
      if (foundTenant) {
        onLoginSuccess({
          role: 'tenant',
          tenantId: foundTenant.id,
          tenantName: foundTenant.companyName,
          userEmail: foundTenant.email,
          userName: `${user.displayName || foundTenant.picName} (${foundTenant.shortCode})`,
          loginTime: new Date().toISOString(),
          impersonatedByOwner: false,
        });
        return;
      }

      // New Google User: DO NOT allow direct unmetered access!
      // Must complete the customer registration form and choose package (or Free Trial 1 Token)
      setPendingOnboardingUser({
        email: user.email || '',
        displayName: user.displayName || '',
        uid: user.uid,
      });
      setShowOnboardingModal(true);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Gagal masuk dengan Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = (newTenant: RentalTenant) => {
    setShowOnboardingModal(false);
    setPendingOnboardingUser(null);
    onLoginSuccess({
      role: 'tenant',
      tenantId: newTenant.id,
      tenantName: newTenant.companyName,
      userEmail: newTenant.email,
      userName: `${newTenant.picName} (${newTenant.shortCode})`,
      loginTime: new Date().toISOString(),
      impersonatedByOwner: false,
    });
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
              <div className="font-black text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>VoltCheck</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Sistem Commissioning BSS & Manajemen Sewa
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Standar PUIL 2020 & SPLN EV</span>
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
                  <span>Penyimpanan Aman: Laporan Tersimpan Otomatis & Terenkripsi</span>
                </div>
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
              <span>Sistem Terverifikasi</span>
            </div>
          </div>

          {/* Right Column: Direct Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900/90 flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white tracking-tight">Masuk ke Sistem</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gunakan Akun Google atau login via Email & Sandi.
                </p>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 mb-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-200 cursor-pointer"
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

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="shrink-0 mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">atau dengan Email & Sandi</span>
                <div className="flex-grow border-t border-slate-800"></div>
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
                      placeholder="Masukkan alamat email Anda..."
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
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLoading ? 'Menghubungkan ke Firebase...' : 'Masuk ke Sistem'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Registration Link for New Users */}
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setPendingOnboardingUser({ email: '', displayName: '', uid: '' });
                    setShowOnboardingModal(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Belum punya akun? Klik di sini untuk Daftar Akun Baru</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
              Aplikasi Commissioning Test BSS VoltCheck & Multi-Tenant Rental Platform
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-3 text-center text-xs text-slate-500">
        © 2026 VoltCheck • EV Charging & Battery Swap Station Infrastructure
      </footer>

      {/* New Customer Registration & Package Selection Modal */}
      {showOnboardingModal && (
        <NewCustomerOnboardingModal
          isOpen={showOnboardingModal}
          userEmail={pendingOnboardingUser?.email || ''}
          userDisplayName={pendingOnboardingUser?.displayName || ''}
          userUid={pendingOnboardingUser?.uid || ''}
          onComplete={handleOnboardingComplete}
          onCancel={() => {
            setShowOnboardingModal(false);
            setPendingOnboardingUser(null);
          }}
        />
      )}
    </div>
  );
};
