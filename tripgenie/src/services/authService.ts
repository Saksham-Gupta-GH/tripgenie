import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User, UserRole } from '../types';

export const authService = {
  register: async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<User> => {
    console.log('Auth: Registering user...', { email, role });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      const userData = {
        id: firebaseUser.uid,
        email: email.toLowerCase(),
        name,
        role,
        createdAt: serverTimestamp(),
      };

      console.log('Auth: Creating Firestore user document...', userData);
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      return {
        ...userData,
        createdAt: new Date(),
      } as User;
    } catch (error: any) {
      console.error('Auth Register Error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    console.log('Auth: Logging in...', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        console.error('Auth: User document missing in Firestore');
        throw new Error('User data not found in database.');
      }

      const data = userDoc.data();
      return {
        id: firebaseUser.uid,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    } catch (error: any) {
      console.error('Auth Login Error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  logout: async (): Promise<void> => {
    console.log('Auth: Logging out...');
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Auth Logout Error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  },

  getCurrentUser: async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) return null;
      const data = userDoc.data();
      return {
        id: firebaseUser.uid,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      console.error('Auth GetCurrentUser Error:', error);
      return null;
    }
  },

  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};
