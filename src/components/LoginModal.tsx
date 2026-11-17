import React, { useState } from 'react';
import { AuthSession, RentalTenant } from '../types/rental';
import {
  getRentalTenants,
  getRentalTenantByEmailOrCode,
  saveRentalTenant,
  OWNER_DEFAULT_SESSION,
} from '../utils/rentalStorage';
import {
  findTenantByEmailOrShortCode,
} from '../firebase/tenantService';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import {
  loginOrLinkWithEmail,
  formatFirebaseAuthError,
} from '../firebase/authService';
import {
  verifyAdminPassword,
  verifyTenantPassword,
  createPasswordCredentials,
  stripPlaintextPassword,
  isAllowlistedOwnerEmail,
  checkLoginRateLimit,
  recordLoginAttempt,
} from '../utils/security';
import { logSecurityEvent } from '../firebase/securityLogService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: AuthSession;
  onLoginSuccess: (session: AuthSession) => void;
  onOpenOwnerDashboard?: () => void;
  onLogout?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onLoginSuccess,
  onOpenOwnerDashboard,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = async (e: React.FormEvent) => {
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

    const rateCheck = checkLoginRateLimit(cleanInput);
    if (!rateCheck.allowed) {
      setErrorMessage(
        `Terlalu banyak percobaan login gagal. Coba kembali dalam ${rateCheck.remainingSeconds} detik.`
      );
      logSecurityEvent({
        eventType: 'rate_limit_blocked',
        severity: 'critical',
        actorEmail: cleanInput,
        actorRole: 'anonymous',
        summary: `Login modal diblokir sementara (${rateCheck.remainingSeconds}s).`,
      });
      setIsLoading(false);
      return;
    }

    // 1. Check Owner / Platform Admin login (Verified SHA-256)
    if (
      cleanInput === 'voltcheck@admin' ||
      cleanInput === 'voltcheck@admin.com' ||
      cleanInput === 'admin@voltcheck.id' ||
      cleanInput === 'admin@vgreen.id' ||
      cleanInput === 'owner' ||
      cleanInput === 'admin'
    ) {
      const isValidAdmin = await verifyAdminPassword(cleanPassword);
      if (isValidAdmin) {
        recordLoginAttempt(cleanInput, true);
        loginOrLinkWithEmail('voltcheck@admin.com', cleanPassword, 'Admin VoltCheck', true).catch(() => {});
        logSecurityEvent({
          eventType: 'login_success',
          severity: 'info',
          actorEmail: 'voltcheck@admin.com',
          actorRole: 'owner',
          summary: 'Admin berganti/masuk sesi melalui LoginModal.',
        });
        onLoginSuccess(OWNER_DEFAULT_SESSION);
        setIsLoading(false);
        onClose();
        return;
      } else {
        const failInfo = recordLoginAttempt(cleanInput, false);
        logSecurityEvent({
          eventType: 'login_failed',
          severity: 'warning',
          actorEmail: cleanInput,
          actorRole: 'anonymous',
          summary: 'Percobaan login Admin via modal gagal.',
        });
        setErrorMessage(
          failInfo.lockedNow
            ? `Kata sandi Admin salah. Dikunci sementara ${failInfo.lockoutSeconds} detik.`
            : `Kata sandi Admin salah (sisa percobaan: ${failInfo.attemptsLeft}x).`
        );
        setIsLoading(false);
        return;
      }
    }

    // 2. Check registered customer / tenant
    let foundTenant = getRentalTenantByEmailOrCode(cleanInput);
    if (!foundTenant) {
      try {
        const cloudMatch = await findTenantByEmailOrShortCode(cleanInput);
        if (cloudMatch) {
          foundTenant = cloudMatch;
          saveRentalTenant(cloudMatch);
        }
      } catch (err) {
        console.warn('Could not query tenant from Firestore in modal:', err);
      }
    }

    if (foundTenant) {
      const { valid, needsMigration } = await verifyTenantPassword(cleanPassword, foundTenant);

      if (!valid) {
        const failInfo = recordLoginAttempt(cleanInput, false);
        logSecurityEvent({
          eventType: 'login_failed',
          severity: 'warning',
          actorEmail: foundTenant.email,
          actorRole: 'tenant',
          targetId: foundTenant.id,
          summary: `Login modal customer ${foundTenant.companyName} gagal (kata sandi salah).`,
        });
        setErrorMessage(
          failInfo.lockedNow
            ? `Kata sandi salah. Dikunci sementara ${failInfo.lockoutSeconds} detik.`
            : `Kata sandi salah (sisa percobaan: ${failInfo.attemptsLeft}x).`
        );
        setIsLoading(false);
        return;
      }

      recordLoginAttempt(cleanInput, true);

      if (needsMigration) {
        try {
          const creds = await createPasswordCredentials(cleanPassword);
          const secured = stripPlaintextPassword({ ...foundTenant, ...creds }) as RentalTenant;
          saveRentalTenant(secured);
          foundTenant = secured;
        } catch {}
      }

      const session: AuthSession = {
        role: 'tenant',
        tenantId: foundTenant.id,
        tenantName: foundTenant.companyName,
        userEmail: foundTenant.email,
        userName: `${foundTenant.picName} (${foundTenant.shortCode})`,
        loginTime: new Date().toISOString(),
        impersonatedByOwner: false,
      };

      loginOrLinkWithEmail(
        foundTenant.email,
        cleanPassword,
        `${foundTenant.picName} (${foundTenant.shortCode})`,
        true
      ).catch(() => {});

      logSecurityEvent({
        eventType: 'login_success',
        severity: 'info',
        actorEmail: foundTenant.email,
        actorRole: 'tenant',
        targetId: foundTenant.id,
        summary: `Customer ${foundTenant.companyName} berganti akun via LoginModal.`,
      });

      onLoginSuccess(session);
      setIsLoading(false);
      onClose();
      return;
    }

    // 3. User is not a pre-registered tenant
    if (!cleanInput.includes('.') && cleanInput.includes('@voltcheck')) {
      setErrorMessage(`Akun "${cleanInput}" belum terdaftar di sistem VoltCheck. Silakan hubungi Admin untuk mendaftarkan akun.`);
      setIsLoading(false);
      return;
    }

    if (!cleanInput.includes('@')) {
      setErrorMessage('Format email tidak valid. Masukkan alamat email lengkap (contoh: user@gmail.com).');
      setIsLoading(false);
      return;
    }

    try {
      const user = await loginOrLinkWithEmail(
        cleanInput,
        cleanPassword,
        cleanInput.split('@')[0],
        false
      );

      const userEmail = (user.email || cleanInput).toLowerCase().trim();
      recordLoginAttempt(cleanInput, true);

      if (isAllowlistedOwnerEmail(userEmail)) {
        onLoginSuccess({
          ...OWNER_DEFAULT_SESSION,
          userEmail,
          loginTime: new Date().toISOString(),
        });
        setIsLoading(false);
        onClose();
        return;
      }

      let verifiedTenant = getRentalTenantByEmailOrCode(userEmail);
      if (!verifiedTenant) {
        try {
          const cloudMatch = await findTenantByEmailOrShortCode(userEmail);
          if (cloudMatch) {
            verifiedTenant = cloudMatch;
            saveRentalTenant(cloudMatch);
          }
        } catch (e) {}
      }

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
        setIsLoading(false);
        onClose();
        return;
      }

      setErrorMessage('Akun ini belum terdaftar sebagai penyewa aktif. Silakan keluar dan daftar melalui halaman utama.');
      setIsLoading(false);
    } catch (err: any) {
      recordLoginAttempt(cleanInput, false);
      setErrorMessage(formatFirebaseAuthError(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 border-b border-slate-800 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Login Akun Sistem</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded-full border border-emerald-500/40">
                  Autentikasi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan email dan kata sandi untuk masuk atau berganti akun.
              </p>
            </div>
          </div>

          {/* Current Logged In Pill */}
          {currentSession && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-400 shrink-0">Akun Aktif:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded truncate ${
                    currentSession.role === 'owner'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {currentSession.role === 'owner'
                    ? '👑 Penjual (Admin)'
                    : `🏢 ${currentSession.tenantName || 'Customer Penyewa'}`}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Keluar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body: Direct Form */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
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

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Footer note & shortcut */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Sistem Persewaan BSS & EV v2.4</span>
            {currentSession?.role === 'owner' && onOpenOwnerDashboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOwnerDashboard();
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1"
              >
                Buka Dashboard Penjual →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
