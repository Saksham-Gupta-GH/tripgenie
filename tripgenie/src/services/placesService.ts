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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Place } from '../types';

const PLACES_COLLECTION = 'places';
const PLACE_IMAGES_PATH = 'place-images';

export const placesService = {
  createPlace: async (
    placeData: Omit<Place, 'id' | 'createdAt'>,
    imageFiles?: File[]
  ): Promise<Place> => {
    try {
      const imageUrls: string[] = [];

      if (imageFiles && imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(
            storage,
            `${PLACE_IMAGES_PATH}/${Date.now()}_${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      const placeRef = await addDoc(collection(db, PLACES_COLLECTION), {
        ...placeData,
        images: [...placeData.images, ...imageUrls],
        createdAt: serverTimestamp(),
      });

      console.log('Place created successfully with ID:', placeRef.id);

      return {
        id: placeRef.id,
        ...placeData,
        images: [...placeData.images, ...imageUrls],
      };
    } catch (error) {
      console.error('CRITICAL: Error in createPlace:', error);
      
      // Handle Firebase specific errors
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        console.error(`Firebase Error Code: ${code}`);
        
        if (code === 'permission-denied') {
          throw new Error('PERMISSION_DENIED: You do not have permission to add places. Please ensure your account has the "Travel Agent" or "Admin" role in your profile.');
        }
      }

      // Re-throw with more context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create place: ${errorMessage}`);
    }
  },

  getPlaceById: async (placeId: string): Promise<Place | null> => {
    try {
      const placeDoc = await getDoc(doc(db, PLACES_COLLECTION, placeId));
      if (!placeDoc.exists()) return null;

      return {
        id: placeDoc.id,
        ...placeDoc.data(),
      } as Place;
    } catch (error) {
      console.error('Error getting place:', error);
      throw new Error('Failed to get place');
    }
  },

  getAllPlaces: async (): Promise<Place[]> => {
    try {
      const q = query(
        collection(db, PLACES_COLLECTION)
      );
      const snapshot = await getDocs(q);

      const places = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Place)
      );

      // Sort client-side to avoid index requirement
      return places.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting all places:', error);
      throw new Error('Failed to get places');
    }
  },

  getGlobalPlaces: async (): Promise<Place[]> => {
    try {
      const q = query(
        collection(db, PLACES_COLLECTION),
        where('isGlobal', '==', true)
      );
      const snapshot = await getDocs(q);

      const places = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Place)
      );

      // Sort client-side
      return places.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting global places:', error);
      throw new Error('Failed to get places');
    }
  },

  getPlacesByCategory: async (category: string): Promise<Place[]> => {
    try {
      const q = query(
        collection(db, PLACES_COLLECTION),
        where('category', '==', category)
      );
      const snapshot = await getDocs(q);

      const places = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Place)
      );

      // Sort client-side
      return places.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting places by category:', error);
      throw new Error('Failed to get places');
    }
  },

  getPlacesByDestination: async (destination: string): Promise<Place[]> => {
    try {
      // Use client-side filtering for destinations to avoid complex queries/indexes
      const q = query(collection(db, PLACES_COLLECTION));
      const snapshot = await getDocs(q);

      const places = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Place)
      );

      const filtered = places.filter(place => 
        place.address.toLowerCase().includes(destination.toLowerCase()) ||
        place.name.toLowerCase().includes(destination.toLowerCase())
      );

      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting places by destination:', error);
      throw new Error('Failed to get places');
    }
  },

  getPlacesByCreator: async (userId: string): Promise<Place[]> => {
    try {
      console.log('Fetching places for creator:', userId);
      const q = query(
        collection(db, PLACES_COLLECTION),
        where('createdBy', '==', userId)
      );
      const snapshot = await getDocs(q);

      const places = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Place)
      );

      console.log(`Found ${places.length} places for creator`);
      return places.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('CRITICAL: Error getting places by creator:', error);
      throw new Error('Failed to get user places. Please try refreshing.');
    }
  },

  updatePlace: async (
    placeId: string,
    updates: Partial<Omit<Place, 'id'>>,
    newImageFiles?: File[]
  ): Promise<void> => {
    try {
      const placeRef = doc(db, PLACES_COLLECTION, placeId);
      const updateData: Record<string, unknown> = { ...updates };

      if (newImageFiles && newImageFiles.length > 0) {
        const newImageUrls: string[] = [];
        for (const file of newImageFiles) {
          const storageRef = ref(
            storage,
            `${PLACE_IMAGES_PATH}/${Date.now()}_${file.name}`
          );
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          newImageUrls.push(url);
        }
        updateData.images = [...(updates.images || []), ...newImageUrls];
      }

      await updateDoc(placeRef, updateData);
    } catch (error) {
      console.error('Error updating place:', error);
      throw new Error('Failed to update place');
    }
  },

  deletePlace: async (placeId: string): Promise<void> => {
    try {
      const place = await placesService.getPlaceById(placeId);
      if (place && place.images.length > 0) {
        // Delete images from storage
        for (const imageUrl of place.images) {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (e) {
            console.warn('Failed to delete image:', e);
          }
        }
      }
      await deleteDoc(doc(db, PLACES_COLLECTION, placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
      throw new Error('Failed to delete place');
    }
  },

  uploadPlaceImage: async (file: File): Promise<string> => {
    try {
      const storageRef = ref(
        storage,
        `${PLACE_IMAGES_PATH}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  },

  deletePlaceImage: async (imageUrl: string): Promise<void> => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  },

  // Categories
  getCategories: async (): Promise<string[]> => {
    try {
      const places = await placesService.getAllPlaces();
      const categories = new Set(places.map((place) => place.category));
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  },
};
