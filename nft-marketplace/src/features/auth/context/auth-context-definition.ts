import { createContext } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../../../shared/types/contracts';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (credentials: LoginRequest, redirectUrl?: string) => Promise<void>;
  register: (data: RegisterRequest, redirectUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissSessionExpiredNotice: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
