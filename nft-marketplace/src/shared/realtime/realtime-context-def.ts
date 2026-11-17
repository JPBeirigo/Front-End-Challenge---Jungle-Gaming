import { createContext } from 'react';

export interface RealtimeNotice {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: number;
}

export interface RealtimeContextValue {
  isConnected: boolean;
  activeNotice: RealtimeNotice | null;
  dismissNotice: () => void;
  triggerManualSync: () => Promise<void>;
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null);
