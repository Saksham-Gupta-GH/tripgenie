import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Trip, TripStatus, DayPlan, ItineraryItem, Place } from '../types';

const TRIPS_COLLECTION = 'trips';

// Group places by proximity using a simple clustering algorithm
const groupPlacesByProximity = (
  places: Place[],
  numDays: number
): Place[][] => {
  if (places.length === 0 || numDays === 0) return [];

  // Sort places by latitude for initial grouping
  const sortedPlaces = [...places].sort(
    (a, b) => a.location.lat - b.location.lat
  );

  const groups: Place[][] = Array.from({ length: numDays }, () => []);
  const placesPerDay = Math.ceil(sortedPlaces.length / numDays);

  // Distribute places evenly across days
  sortedPlaces.forEach((place, index) => {
    const dayIndex = Math.min(Math.floor(index / placesPerDay), numDays - 1);
    groups[dayIndex].push(place);
  });

  // Optimize by checking distances and swapping if beneficial
  for (let day = 0; day < numDays; day++) {
    const dayPlaces = groups[day];
    if (dayPlaces.length <= 1) continue;

    // Sort within each day by longitude for a logical route
    dayPlaces.sort((a, b) => a.location.lng - b.location.lng);
  }

  return groups;
};

// Generate time slots for itinerary items
const generateTimeSlots = (numItems: number): { start: string; end: string }[] => {
  const slots: { start: string; end: string }[] = [];
  let currentHour = 9; // Start at 9 AM

  for (let i = 0; i < numItems; i++) {
    const duration = 2; // Default 2 hours per place
    const startTime = `${currentHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(currentHour + duration).toString().padStart(2, '0')}:00`;

    slots.push({ start: startTime, end: endTime });
    currentHour += duration + 1; // 1 hour break between places

    // Lunch break
    if (currentHour === 13) {
      currentHour = 14;
    }

    // End by 8 PM
    if (currentHour >= 20) {
      break;
    }
  }

  return slots;
};

// Generate itinerary from places
const generateItinerary = (places: Place[], days: number): DayPlan[] => {
  const groupedPlaces = groupPlacesByProximity(places, days);
  const itinerary: DayPlan[] = [];

  groupedPlaces.forEach((dayPlaces, index) => {
    const timeSlots = generateTimeSlots(dayPlaces.length);
    const items: ItineraryItem[] = dayPlaces.map((place, placeIndex) => ({
      placeId: place.id,
      placeName: place.name,
      startTime: timeSlots[placeIndex]?.start || '09:00',
      endTime: timeSlots[placeIndex]?.end || '11:00',
      notes: `Visit ${place.name} - ${place.category}`,
    }));

    itinerary.push({
      day: index + 1,
      items,
    });
  });

  return itinerary;
};

export const tripService = {
  createTrip: async (
    tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'itinerary' | 'status'>,
    availablePlaces: Place[]
  ): Promise<Trip> => {
    try {
      // Filter places by interests and destination
      const relevantPlaces = availablePlaces.filter(
        (place) =>
          place.category
            .toLowerCase()
            .includes(tripData.destination.toLowerCase()) ||
          tripData.interests.some((interest) =>
            place.category.toLowerCase().includes(interest.toLowerCase())
          )
      );

      // Generate itinerary using system logic
      const itinerary = generateItinerary(
        relevantPlaces.slice(0, tripData.days * 3), // Max 3 places per day
        tripData.days
      );

      const tripRef = await addDoc(collection(db, TRIPS_COLLECTION), {
        ...tripData,
        itinerary,
        status: 'draft' as TripStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: tripRef.id,
        ...tripData,
        itinerary,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating trip:', error);
      throw new Error('Failed to create trip');
    }
  },

  getTripById: async (tripId: string): Promise<Trip | null> => {
    try {
      const tripDoc = await getDoc(doc(db, TRIPS_COLLECTION, tripId));
      if (!tripDoc.exists()) return null;

      const data = tripDoc.data();
      return {
        id: tripDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Trip;
    } catch (error) {
      console.error('Error getting trip:', error);
      throw new Error('Failed to get trip');
    }
  },

  getTripsByUser: async (userId: string): Promise<Trip[]> => {
    try {
      const q = query(
        collection(db, TRIPS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Trip;
      });
    } catch (error) {
      console.error('Error getting user trips:', error);
      throw new Error('Failed to get trips');
    }
  },

  getAllTrips: async (): Promise<Trip[]> => {
    try {
      const q = query(
        collection(db, TRIPS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Trip;
      });
    } catch (error) {
      console.error('Error getting all trips:', error);
      throw new Error('Failed to get trips');
    }
  },

  getTripsByStatus: async (status: TripStatus): Promise<Trip[]> => {
    try {
      const q = query(
        collection(db, TRIPS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Trip;
      });
    } catch (error) {
      console.error('Error getting trips by status:', error);
      throw new Error('Failed to get trips');
    }
  },

  updateTrip: async (
    tripId: string,
    updates: Partial<Omit<Trip, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, tripId);
      await updateDoc(tripRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating trip:', error);
      throw new Error('Failed to update trip');
    }
  },

  updateTripStatus: async (
    tripId: string,
    status: TripStatus,
    agentId?: string
  ): Promise<void> => {
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, tripId);
      const updates: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (agentId) {
        updates.agentId = agentId;
      }
      await updateDoc(tripRef, updates);
    } catch (error) {
      console.error('Error updating trip status:', error);
      throw new Error('Failed to update trip status');
    }
  },

  updateItinerary: async (
    tripId: string,
    itinerary: DayPlan[]
  ): Promise<void> => {
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, tripId);
      await updateDoc(tripRef, {
        itinerary,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating itinerary:', error);
      throw new Error('Failed to update itinerary');
    }
  },

  deleteTrip: async (tripId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw new Error('Failed to delete trip');
    }
  },

  // Helper function to regenerate itinerary
  regenerateItinerary: async (
    tripId: string,
    places: Place[]
  ): Promise<void> => {
    try {
      const trip = await tripService.getTripById(tripId);
      if (!trip) throw new Error('Trip not found');

      const newItinerary = generateItinerary(places, trip.days);
      await tripService.updateItinerary(tripId, newItinerary);
    } catch (error) {
      console.error('Error regenerating itinerary:', error);
      throw new Error('Failed to regenerate itinerary');
    }
  },
};
