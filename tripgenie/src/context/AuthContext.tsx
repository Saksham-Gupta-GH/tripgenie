import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { auth } from '../firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const userData = await authService.getCurrentUser(fbUser);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        loadUser(fbUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loadUser]);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await authService.login(email, password, rememberMe);
      setUser(userData);
      setFirebaseUser(auth.currentUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await authService.register(email, password, name, role);
      setUser(userData);
      setFirebaseUser(auth.currentUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authService.resetPassword(email);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- useAuth co-located with AuthProvider
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
