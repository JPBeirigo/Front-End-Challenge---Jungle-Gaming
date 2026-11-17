import { useContext } from 'react';
import { RealtimeContext, type RealtimeContextValue } from './realtime-context-def';

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime deve ser utilizado dentro de um RealtimeProvider');
  }
  return context;
}
