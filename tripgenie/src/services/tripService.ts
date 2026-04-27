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
  updateDoc,
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
      // Clean undefined fields just in case
      const cleanData: any = {};
      Object.entries(planData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      const dataToSave = {
        ...cleanData,
        createdAt: serverTimestamp(),
      };

      const planRef = await addDoc(collection(db, PLANS_COLLECTION), dataToSave);

      return {
        id: planRef.id,
        ...planData,
        createdAt: new Date(),
      };
    } catch (error: any) {
      console.error('TripService Create Error Details:', error);
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
        addedAt: serverTimestamp(),
        status: 'pending'
      });

      return {
        id: docRef.id,
        userId,
        planId,
        travelDate,
        addedAt: new Date(),
        status: 'pending'
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

  getSelectedPlansForUser: async (userId: string): Promise<{plan: Plan, booking: SelectedPlan}[]> => {
    try {
      const q = query(
        collection(db, SELECTED_PLANS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const results = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const plan = await tripService.getPlanById(data.planId);
        if (plan) {
          results.push({
            plan,
            booking: {
              id: docSnap.id,
              userId: data.userId,
              planId: data.planId,
              travelDate: data.travelDate?.toDate() || new Date(),
              addedAt: data.addedAt?.toDate() || new Date(),
              status: data.status || 'pending',
              agentMessage: data.agentMessage
            }
          });
        }
      }
      return results;
    } catch (error: any) {
      console.error('TripService GetSelected Error:', error);
      throw new Error(error.message || 'Failed to fetch selected plans');
    }
  },

  getAllBookingsForAgent: async (agentId: string): Promise<{plan: Plan, booking: SelectedPlan}[]> => {
    try {
      // Get all plans created by this agent
      const agentPlans = await tripService.getPlansByCreator(agentId);
      const planIds = agentPlans.map(p => p.id);
      
      if (planIds.length === 0) return [];

      // Note: Firestore 'in' query supports max 10 values. For simplicity in this demo, 
      // we'll fetch all bookings and filter in memory if planIds > 10, or chunk it.
      // But let's just fetch all and filter in memory to avoid index limits here.
      const q = query(collection(db, SELECTED_PLANS_COLLECTION));
      const snapshot = await getDocs(q);
      
      const results = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (planIds.includes(data.planId)) {
          const plan = agentPlans.find(p => p.id === data.planId)!;
          results.push({
            plan,
            booking: {
              id: docSnap.id,
              userId: data.userId,
              planId: data.planId,
              travelDate: data.travelDate?.toDate() || new Date(),
              addedAt: data.addedAt?.toDate() || new Date(),
              status: data.status || 'pending',
              agentMessage: data.agentMessage
            }
          });
        }
      }
      return results;
    } catch (error: any) {
      console.error('TripService GetAllBookings Error:', error);
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  },

  updateBookingStatus: async (bookingId: string, status: 'confirmed' | 'denied', message: string): Promise<void> => {
    try {
      await updateDoc(doc(db, SELECTED_PLANS_COLLECTION, bookingId), {
        status,
        agentMessage: message
      });
    } catch (error: any) {
      console.error('TripService updateBooking Error:', error);
      throw new Error(error.message || 'Failed to update booking');
    }
  },

  ratePlan: async (planId: string, userId: string, rating: number, review?: string): Promise<void> => {
    try {
      const plan = await tripService.getPlanById(planId);
      if (!plan) return;
      const ratings = plan.ratings || [];
      const existing = ratings.findIndex(r => r.userId === userId);
      if (existing >= 0) {
        ratings[existing] = { userId, rating, review };
      } else {
        ratings.push({ userId, rating, review });
      }
      await updateDoc(doc(db, PLANS_COLLECTION, planId), {
        ratings
      });
    } catch (error: any) {
      console.error('TripService Rate Error:', error);
      throw new Error(error.message || 'Failed to rate plan');
    }
  }
};
