// User Types
export type UserRole = 'traveller' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  profileImage?: string;
}

// Location Types
export interface Location {
  lat: number;
  lng: number;
}

// Place Types
export interface Place {
  id: string;
  name: string;
  location: Location;
  address: string;
  category: string;
  description: string;
  images: string[];
  estimatedCost: number;
  duration: number; // in hours
  createdBy: string;
  isGlobal: boolean;
}

// Itinerary Types
export interface ItineraryItem {
  placeId: string;
  placeName: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface DayPlan {
  day: number;
  items: ItineraryItem[];
}

// Trip Types
export type TripStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Trip {
  id: string;
  userId: string;
  destination: string;
  budget: number;
  days: number;
  interests: string[];
  itinerary: DayPlan[];
  status: TripStatus;
  agentId?: string;
  isPublic?: boolean; // If true, all travellers can see and choose this plan
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Form Types
export interface CreateTripForm {
  destination: string;
  budget: number;
  days: number;
  interests: string[];
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginForm {
  email: string;
  password: string;
}

// Stats Types
export interface DashboardStats {
  totalTrips: number;
  pendingTrips: number;
  approvedTrips: number;
  totalUsers?: number;
  totalAgents?: number;
}
