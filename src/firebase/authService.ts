import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in with Google Auth Provider
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign in with Email and Password via Firebase Authentication
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error) {
    console.error('Firebase Email sign-in failed:', error);
    throw error;
  }
}

/**
 * Register a new user with Email and Password via Firebase Authentication
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName }).catch((e) =>
        console.warn('Update profile display name error:', e)
      );
    }
    return result.user;
  } catch (error) {
    console.error('Firebase Email registration failed:', error);
    throw error;
  }
}

/**
 * Intelligent Link & Login:
 * Attempts to sign in with email and password to Firebase Authentication.
 * If user does not exist in Firebase Auth yet, and autoCreateIfNew is true
 * (e.g. for existing registered tenant/admin in local database),
 * automatically registers and links the account into Firebase Auth.
 */
export async function loginOrLinkWithEmail(
  email: string,
  pass: string,
  displayName?: string,
  autoCreateIfNew: boolean = false
): Promise<User> {
  const cleanEmail = email.trim();
  try {
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return userCred.user;
  } catch (error: any) {
    const code = error?.code || '';
    // If account not found in Firebase Auth yet, and autoCreateIfNew is allowed
    if (
      autoCreateIfNew &&
      (code === 'auth/user-not-found' || code === 'auth/invalid-credential')
    ) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (displayName && newCred.user) {
          await updateProfile(newCred.user, { displayName }).catch(() => {});
        }
        console.log(`Auto-linked user account (${cleanEmail}) to Firebase Authentication.`);
        return newCred.user;
      } catch (createErr: any) {
        // If create fails (e.g. email exists with different pass), throw the original auth error
        console.warn('Auto create Firebase Auth account notice:', createErr);
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Format Firebase Auth errors into clear, friendly Indonesian messages
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid. Periksa kembali penulisan email Anda.';
    case 'auth/user-disabled':
      return 'Akun pengguna ini telah dinonaktifkan oleh administrator.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini belum terdaftar di Firebase.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar di sistem Firebase. Silakan langsung masuk.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Akses diblokir sementara, silakan coba beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.';
    case 'auth/popup-closed-by-user':
      return 'Jendela masuk Google ditutup sebelum proses selesai.';
    default:
      return error?.message || 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.';
  }
}

/**
 * Sign out from Firebase Authentication
 */
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign-out error:', error);
    throw error;
  }
}

/**
 * Listen to Firebase Auth state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
