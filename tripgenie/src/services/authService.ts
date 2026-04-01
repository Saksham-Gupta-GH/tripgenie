import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  deleteUser,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ADMIN_EMAIL } from '../config/admin';
import type { User, UserRole } from '../types';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
};

const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied':
    'Could not save your profile (Firestore permission denied). In Firebase Console, open Firestore → Rules, publish the rules from this project’s firestore.rules file, and ensure the database exists.',
  'failed-precondition': 'Firestore request failed. Check that Firestore is enabled for this project.',
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Only ADMIN_EMAIL may register as admin; that email always becomes admin. */
export function resolveRegisterRole(email: string, requested: UserRole): UserRole {
  const e = normalizeEmail(email);
  if (e === normalizeEmail(ADMIN_EMAIL)) return 'admin';
  if (requested === 'admin') {
    throw new Error('Administrator accounts cannot be created from sign-up. Use traveller or travel agent.');
  }
  return requested;
}

const getErrorMessage = (error: unknown): string => {
  // Always log the error to console for debugging in production
  console.error('Firebase Auth/Firestore Error:', error);

  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code.startsWith('auth/')) {
      return AUTH_ERROR_MESSAGES[code] || `Authentication error (${code}).`;
    }
    if (code === 'permission-denied' || code === 'failed-precondition') {
      return FIRESTORE_ERROR_MESSAGES[code];
    }
    return `Error (${code}).`;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please check the browser console for details.';
};

export const authService = {
  register: async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<User> => {
    const resolvedRole = resolveRegisterRole(email, role);
    const emailNorm = normalizeEmail(email);

    let firebaseUser: FirebaseUser | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      const userData = {
        email: emailNorm,
        name,
        role: resolvedRole,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      return {
        id: firebaseUser.uid,
        email: emailNorm,
        name,
        role: resolvedRole,
        createdAt: new Date(),
      };
    } catch (error) {
      if (firebaseUser) {
        try {
          await deleteUser(firebaseUser);
        } catch {
          /* ignore rollback failure */
        }
      }
      throw new Error(getErrorMessage(error));
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found.');
      }

      const raw = userDoc.data();
      const userData = {
        ...raw,
        createdAt:
          raw.createdAt && typeof raw.createdAt === 'object' && 'toDate' in raw.createdAt
            ? (raw.createdAt as { toDate: () => Date }).toDate()
            : new Date(),
      } as Omit<User, 'id'>;

      return {
        id: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getCurrentUser: async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        return null;
      }

      const raw = userDoc.data();
      const userData = {
        ...raw,
        createdAt:
          raw.createdAt && typeof raw.createdAt === 'object' && 'toDate' in raw.createdAt
            ? (raw.createdAt as { toDate: () => Date }).toDate()
            : new Date(),
      } as Omit<User, 'id'>;

      return {
        id: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  updateUserProfile: async (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'profileImage'>>
  ): Promise<void> => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};
