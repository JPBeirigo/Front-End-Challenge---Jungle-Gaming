import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AppApiError } from './errors';
import { authStorage } from './auth-storage';
import { getGuestCartId } from './cart-storage';

// Listener para notificações de expiração de sessão
type SessionExpiredCallback = () => void;
const sessionExpiredCallbacks = new Set<SessionExpiredCallback>();

export function onSessionExpired(callback: SessionExpiredCallback): () => void {
  sessionExpiredCallbacks.add(callback);
  return () => {
    sessionExpiredCallbacks.delete(callback);
  };
}

function notifySessionExpired() {
  authStorage.clear();
  sessionExpiredCallbacks.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Erro ao executar callback de sessão expirada:', e);
    }
  });
}

/**
 * Instância única e global do cliente Axios da aplicação.
 * Configurada com interceptors para autenticação, padronização de erros e timeout.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Injeção de Token e Sessão de Visitante
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getToken();
    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['X-Cart-Session'] = getGuestCartId();
    }
    return config;
  },
  (error) => {
    return Promise.reject(AppApiError.fromUnknown(error));
  }
);

// Interceptor de Resposta: Tratamento de Erros e 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      // Deixa o erro de cancelamento passar intacto para o TanStack Query gerenciar
      return Promise.reject(error);
    }

    const appError = AppApiError.fromUnknown(error);

    // Se o erro for 401 (Não Autorizado ou Sessão Expirada)
    if (error instanceof AxiosError && error.response?.status === 401) {
      notifySessionExpired();
    }

    return Promise.reject(appError);
  }
);
