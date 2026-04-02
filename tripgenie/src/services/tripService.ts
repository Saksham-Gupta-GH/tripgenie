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
    console.log('TripService: Creating trip...', tripData.destination);
    try {
      const relevantPlaces = availablePlaces.filter(
        (place) =>
          place.address.toLowerCase().includes(tripData.destination.toLowerCase()) ||
          place.category.toLowerCase().includes(tripData.destination.toLowerCase()) ||
          tripData.interests.some((interest) =>
            place.category.toLowerCase().includes(interest.toLowerCase())
          )
      );

      const itinerary = generateItinerary(
        relevantPlaces.slice(0, tripData.days * 3),
        tripData.days
      );

      const dataToSave = {
        ...tripData,
        itinerary,
        status: 'draft' as TripStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const tripRef = await addDoc(collection(db, TRIPS_COLLECTION), dataToSave);
      console.log('TripService: Trip created successfully ID:', tripRef.id);

      return {
        id: tripRef.id,
        ...tripData,
        itinerary,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('TripService Create Error:', error);
      throw new Error(error.message || 'Failed to create trip');
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
    } catch (error: any) {
      console.error('TripService GetById Error:', error);
      throw new Error(error.message || 'Failed to get trip');
    }
  },

  getTripsByUser: async (userId: string): Promise<Trip[]> => {
    console.log('TripService: Getting trips for user:', userId);
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
    } catch (error: any) {
      console.error('TripService GetByUser Error:', error);
      throw new Error(error.message || 'Failed to get user trips');
    }
  },

  updateTrip: async (tripId: string, updates: Partial<Trip>): Promise<void> => {
    console.log('TripService: Updating trip:', tripId);
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, tripId);
      await updateDoc(tripRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('TripService Update Error:', error);
      throw new Error(error.message || 'Failed to update trip');
    }
  },

  deleteTrip: async (tripId: string): Promise<void> => {
    console.log('TripService: Deleting trip:', tripId);
    try {
      await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    } catch (error: any) {
      console.error('TripService Delete Error:', error);
      throw new Error(error.message || 'Failed to delete trip');
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
    } catch (error: any) {
      console.error('TripService GetAll Error:', error);
      throw new Error(error.message || 'Failed to get all trips');
    }
  },

  updateTripStatus: async (tripId: string, status: TripStatus): Promise<void> => {
    console.log('TripService: Updating trip status:', { tripId, status });
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, tripId);
      await updateDoc(tripRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('TripService updateTripStatus Error:', error);
      throw new Error(error.message || 'Failed to update trip status');
    }
  },

  updateItinerary: async (tripId: string, itinerary: DayPlan[]): Promise<void> => {
    console.log('TripService: Updating itinerary:', tripId);
    try {
      const tripRef = doc(db, TRIPS_COLLECTION, tripId);
      await updateDoc(tripRef, {
        itinerary,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('TripService updateItinerary Error:', error);
      throw new Error(error.message || 'Failed to update itinerary');
    }
  },
};
