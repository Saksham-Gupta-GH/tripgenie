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

// Plan Types
export interface Plan {
  id: string;
  title: string;
  destination: string;
  numberOfDays: number;
  budget: number;
  itinerary: string[];
  imageUrls?: string[];
  createdBy: string;
  createdAt: Date;
}

export interface SelectedPlan {
  id: string;
  userId: string;
  planId: string;
  travelDate: Date;
  addedAt: Date;
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
