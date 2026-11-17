import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../../../shared/types/contracts';
import { authApi } from '../../../shared/api/services';
import { authStorage } from '../../../shared/api/auth-storage';
import { onSessionExpired } from '../../../shared/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AppApiError } from '../../../shared/api/errors';
import { getSocket, disconnectSocket } from '../../../shared/realtime/socket-client';
import { AuthContext } from './auth-context-definition';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Função para limpar estado, cache e desconectar sockets sem vazamento de dados privados
  const clearSession = useCallback(() => {
    disconnectSocket();
    authStorage.clear();
    setUser(null);
    setToken(null);
    queryClient.clear(); // Limpa absolutamente todas as queries em cache
  }, [queryClient]);

  // Inicialização e recuperação da sessão após refresh (F5)
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const session = await authApi.getSession();
        if (!session.valid) {
          if (isMounted) clearSession();
          return;
        }
        if (isMounted) {
          setUser(session.user);
          authStorage.setUser(session.user);
          // Conecta e autentica o socket em segundo plano para o usuário
          getSocket(storedToken);
        }
      } catch (err) {
        console.warn('Falha ao restaurar sessão:', err);
        if (isMounted) clearSession();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  // Registra ouvinte para respostas 401 emitidas pelo interceptor do Axios
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      clearSession();
      setSessionExpired(true);
    });
    return unsubscribe;
  }, [clearSession]);

  const login = useCallback(async (credentials: LoginRequest, redirectUrl?: string) => {
    try {
      const session = await authApi.login(credentials);
      authStorage.setToken(session.token);
      authStorage.setUser(session.user);
      setToken(session.token);
      setUser(session.user);
      setSessionExpired(false);

      // Limpa cache da sessão anterior para evitar contaminação
      queryClient.clear();

      // Conecta o socket com a nova identidade autenticada
      getSocket(session.token);

      if (redirectUrl) {
        navigate({ to: redirectUrl });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      throw AppApiError.fromUnknown(err);
    }
  }, [queryClient, navigate]);

  const register = useCallback(async (data: RegisterRequest, redirectUrl?: string) => {
    try {
      const session = await authApi.register(data);
      authStorage.setToken(session.token);
      authStorage.setUser(session.user);
      setToken(session.token);
      setUser(session.user);
      setSessionExpired(false);

      queryClient.clear();
      getSocket(session.token);

      if (redirectUrl) {
        navigate({ to: redirectUrl });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      throw AppApiError.fromUnknown(err);
    }
  }, [queryClient, navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignora erro de rede no logout
    } finally {
      clearSession();
      navigate({ to: '/' });
    }
  }, [clearSession, navigate]);

  const dismissSessionExpiredNotice = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    authStorage.setUser(updatedUser);
  }, []);

  const isSessionActive = (!!user && !!token) || (!!authStorage.getToken() && !!authStorage.getUser());

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: isSessionActive,
      isLoading,
      sessionExpired,
      login,
      register,
      logout,
      dismissSessionExpiredNotice,
      updateUser,
    }),
    [user, token, isSessionActive, isLoading, sessionExpired, login, register, logout, dismissSessionExpiredNotice, updateUser],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
