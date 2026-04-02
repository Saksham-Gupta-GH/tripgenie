import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Plan, SelectedPlan } from '../types';

const PLANS_COLLECTION = 'plans';
const SELECTED_PLANS_COLLECTION = 'selected_plans';

export const tripService = {
  createPlan: async (
    planData: Omit<Plan, 'id' | 'createdAt'>
  ): Promise<Plan> => {
    try {
      const dataToSave = {
        ...planData,
        createdAt: serverTimestamp(),
      };

      const planRef = await addDoc(collection(db, PLANS_COLLECTION), dataToSave);

      return {
        id: planRef.id,
        ...planData,
        createdAt: new Date(),
      };
    } catch (error: any) {
      console.error('TripService Create Error:', error);
      throw new Error(error.message || 'Failed to create plan');
    }
  },

  getPlanById: async (planId: string): Promise<Plan | null> => {
    try {
      const planDoc = await getDoc(doc(db, PLANS_COLLECTION, planId));
      if (!planDoc.exists()) return null;

      const data = planDoc.data();
      return {
        id: planDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Plan;
    } catch (error: any) {
      console.error('TripService GetById Error:', error);
      throw new Error(error.message || 'Failed to get plan');
    }
  },

  getPlansByCreator: async (userId: string): Promise<Plan[]> => {
    try {
      const q = query(
        collection(db, PLANS_COLLECTION),
        where('createdBy', '==', userId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Plan;
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      console.error('TripService GetByCreator Error:', error);
      throw new Error(error.message || 'Failed to get user plans');
    }
  },

  deletePlan: async (planId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, PLANS_COLLECTION, planId));
    } catch (error: any) {
      console.error('TripService Delete Error:', error);
      throw new Error(error.message || 'Failed to delete plan');
    }
  },

  getAllPlans: async (): Promise<Plan[]> => {
    try {
      const q = query(collection(db, PLANS_COLLECTION));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Plan;
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
      console.error('TripService GetAll Error:', error);
      throw new Error(error.message || 'Failed to get all plans');
    }
  },

  // Traveller functions
  selectPlan: async (
    userId: string,
    planId: string,
    travelDate: Date
  ): Promise<SelectedPlan> => {
    try {
      // Check if already selected
      const q = query(
        collection(db, SELECTED_PLANS_COLLECTION),
        where('userId', '==', userId),
        where('planId', '==', planId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error('Plan already selected');
      }

      const docRef = await addDoc(collection(db, SELECTED_PLANS_COLLECTION), {
        userId,
        planId,
        travelDate: Timestamp.fromDate(travelDate),
        addedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        userId,
        planId,
        travelDate,
        addedAt: new Date()
      };
    } catch (error: any) {
      console.error('TripService Select Error:', error);
      throw new Error(error.message || 'Failed to select plan');
    }
  },

  unselectPlan: async (userId: string, planId: string): Promise<void> => {
    try {
      const q = query(
        collection(db, SELECTED_PLANS_COLLECTION),
        where('userId', '==', userId),
        where('planId', '==', planId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }
    } catch (error: any) {
      console.error('TripService Unselect Error:', error);
      throw new Error(error.message || 'Failed to remove selected plan');
    }
  },

  getSelectedPlansForUser: async (userId: string): Promise<Plan[]> => {
    try {
      const q = query(
        collection(db, SELECTED_PLANS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const plans = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const plan = await tripService.getPlanById(data.planId);
        if (plan) {
          plans.push(plan);
        }
      }
      return plans;
    } catch (error: any) {
      console.error('TripService GetSelected Error:', error);
      throw new Error(error.message || 'Failed to fetch selected plans');
    }
  }
};
