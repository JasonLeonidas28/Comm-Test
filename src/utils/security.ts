import { RentalTenant } from '../types/rental';

const ADMIN_SALT = 'voltcheck_adm_salt_2026';
const ADMIN_SHA256_DIGEST = '2e757d688387d3791152ead024caaa4a47d38f8772998086eda7b11f12a29000';

// Explicit allowlist of exact owner/admin emails (prevents substring spoofing like evil+voltcheck@gmail.com)
export const ALLOWLISTED_OWNER_EMAILS = new Set<string>([
  'kerjaanjason@gmail.com',
  'voltcheck@admin.com',
  'voltcheck@admin',
  'admin@voltcheck.id',
  'admin@vgreen.id',
]);

export function isAllowlistedOwnerEmail(email: string | undefined | null): boolean {
  const clean = (email || '').toLowerCase().trim();
  return ALLOWLISTED_OWNER_EMAILS.has(clean);
}

/**
 * Generates a cryptographically secure random hex salt.
 */
export function generateSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes a salted SHA-256 hex digest using the browser Web Crypto API.
 */
export async function hashPasswordWithSalt(plainPassword: string, salt: string): Promise<string> {
  const input = `${salt}:${plainPassword}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Web Crypto API (SHA-256) tidak tersedia pada browser ini.');
}

/**
 * Constant-time string comparison to reduce timing side-channel leaks.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Creates a salted SHA-256 credential pair ready for Firestore persistence.
 */
export async function createPasswordCredentials(plainPassword: string): Promise<{
  passwordHash: string;
  passwordSalt: string;
  passwordUpdatedAt: string;
}> {
  const salt = generateSalt(16);
  const hash = await hashPasswordWithSalt(plainPassword, salt);
  return {
    passwordHash: hash,
    passwordSalt: salt,
    passwordUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Verifies the admin password strictly against the salted SHA-256 digest (no shortcut backdoors).
 */
export async function verifyAdminPassword(plainPassword: string): Promise<boolean> {
  const clean = plainPassword.trim();
  if (!clean) return false;
  try {
    const computed = await hashPasswordWithSalt(clean, ADMIN_SALT);
    return safeEqual(computed, ADMIN_SHA256_DIGEST);
  } catch {
    return false;
  }
}

/**
 * Verifies a tenant's password strictly against their salted SHA-256 hash
 * (or exact legacy password if not yet migrated — zero backdoors).
 */
export async function verifyTenantPassword(
  inputPassword: string,
  tenant: RentalTenant
): Promise<{ valid: boolean; needsMigration: boolean }> {
  const clean = inputPassword.trim();
  if (!clean) return { valid: false, needsMigration: false };

  // Prefer salted SHA-256 verification
  if (tenant.passwordHash && tenant.passwordSalt) {
    try {
      const computed = await hashPasswordWithSalt(clean, tenant.passwordSalt);
      return {
        valid: safeEqual(computed, tenant.passwordHash),
        needsMigration: false,
      };
    } catch {
      return { valid: false, needsMigration: false };
    }
  }

  // Legacy unhashed record: strict exact comparison only (NO blank or universal bypass)
  const legacyPass = (tenant.password || '').trim();
  if (legacyPass && safeEqual(clean, legacyPass)) {
    return { valid: true, needsMigration: true };
  }

  return { valid: false, needsMigration: false };
}

/**
 * Strips sensitive plaintext password before saving to Firestore or persistent storage.
 */
export function stripPlaintextPassword<T extends { password?: string }>(obj: T): Omit<T, 'password'> {
  const clone = { ...obj };
  delete clone.password;
  return clone;
}

// ==========================================
// BRUTE-FORCE LOGIN RATE LIMITER (5 ATTEMPTS / 60s LOCKOUT)
// ==========================================
const RATE_LIMIT_KEY = 'voltcheck_login_attempts_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 60 seconds cooldown
const WINDOW_MS = 5 * 60 * 1000; // 5 minute tracking window

interface AttemptRecord {
  count: number;
  firstFailedAt: number;
  lockedUntil: number;
}

function getAttemptStore(): Record<string, AttemptRecord> {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function saveAttemptStore(store: Record<string, AttemptRecord>): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(store));
  } catch {}
}

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const key = (identifier || 'global').toLowerCase().trim();
  const store = getAttemptStore();
  const rec = store[key];
  const now = Date.now();

  if (!rec) {
    return { allowed: true, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  if (rec.lockedUntil && now < rec.lockedUntil) {
    return {
      allowed: false,
      remainingSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
      attemptsLeft: 0,
    };
  }

  // Reset expired tracking window or expired lockout
  if (now - rec.firstFailedAt > WINDOW_MS || (rec.lockedUntil && now >= rec.lockedUntil)) {
    delete store[key];
    saveAttemptStore(store);
    return { allowed: true, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  return {
    allowed: true,
    remainingSeconds: 0,
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - rec.count),
  };
}

export function recordLoginAttempt(identifier: string, success: boolean): {
  lockedNow: boolean;
  attemptsLeft: number;
  lockoutSeconds: number;
} {
  const key = (identifier || 'global').toLowerCase().trim();
  const store = getAttemptStore();
  const now = Date.now();

  if (success) {
    delete store[key];
    saveAttemptStore(store);
    return { lockedNow: false, attemptsLeft: MAX_FAILED_ATTEMPTS, lockoutSeconds: 0 };
  }

  const prev = store[key];
  const withinWindow = prev && now - prev.firstFailedAt <= WINDOW_MS;
  const nextCount = withinWindow ? prev.count + 1 : 1;
  const firstFailedAt = withinWindow ? prev.firstFailedAt : now;
  const lockedNow = nextCount >= MAX_FAILED_ATTEMPTS;

  store[key] = {
    count: nextCount,
    firstFailedAt,
    lockedUntil: lockedNow ? now + LOCKOUT_MS : 0,
  };
  saveAttemptStore(store);

  return {
    lockedNow,
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - nextCount),
    lockoutSeconds: lockedNow ? Math.ceil(LOCKOUT_MS / 1000) : 0,
  };
}
