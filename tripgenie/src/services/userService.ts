import {
  collection,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { User, UserRole } from '../types';

const USERS_COLLECTION = 'users';

export const userService = {
  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (!userDoc.exists()) return null;

      const data = userDoc.data();
      return {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  },

  getUsersByRole: async (role: UserRole): Promise<User[]> => {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as User;
      });
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw new Error('Failed to get users');
    }
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, { role });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  },

  updateUserProfile: async (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'profileImage'>>
  ): Promise<void> => {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  },

  getUserStats: async (): Promise<{
    totalUsers: number;
    travellers: number;
    agents: number;
    admins: number;
  }> => {
    try {
      const users = await userService.getAllUsers();
      return {
        totalUsers: users.length,
        travellers: users.filter((u) => u.role === 'traveller').length,
        agents: users.filter((u) => u.role === 'agent').length,
        admins: users.filter((u) => u.role === 'admin').length,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user stats');
    }
  },
};
