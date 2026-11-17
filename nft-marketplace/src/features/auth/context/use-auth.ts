import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './auth-context-definition';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
}
