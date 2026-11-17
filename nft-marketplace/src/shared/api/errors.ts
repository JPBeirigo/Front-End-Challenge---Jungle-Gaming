/**
 * Formato padronizado de erro retornado pela API e tratado pela UI.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SESSION_EXPIRED'
  | 'PRICE_CHANGED'
  | 'EDITION_SOLD_OUT'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  status: number;
  details?: Record<string, string[]>;
  retryable?: boolean;
  timestamp?: string;
}

export class AppApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, string[]>;
  public readonly retryable: boolean;

  constructor(payload: ApiErrorResponse) {
    super(payload.message);
    this.name = 'AppApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.details = payload.details;
    this.retryable = payload.retryable ?? (payload.status >= 500 || payload.status === 408);
  }

  static fromUnknown(error: unknown): AppApiError {
    if (error instanceof AppApiError) {
      return error;
    }

    // Erro do Axios com response padronizada
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosErr = error as {
        response?: { status: number; data?: Partial<ApiErrorResponse> };
        code?: string;
        message?: string;
      };

      const status = axiosErr.response?.status || 500;
      const data = axiosErr.response?.data;

      if (data && data.code && data.message) {
        return new AppApiError({
          code: data.code,
          message: data.message,
          status,
          details: data.details,
          retryable: data.retryable,
        });
      }

      // Fallback para códigos HTTP comuns
      const codeMap: Record<number, ApiErrorCode> = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        408: 'TIMEOUT_ERROR',
        500: 'INTERNAL_SERVER_ERROR',
      };

      return new AppApiError({
        code: codeMap[status] || 'INTERNAL_SERVER_ERROR',
        message: data?.message || axiosErr.message || 'Ocorreu um erro no servidor.',
        status,
        retryable: status >= 500,
      });
    }

    // Erros de timeout ou rede
    if (error && typeof error === 'object' && 'code' in error) {
      const netErr = error as { code: string; message: string };
      if (netErr.code === 'ECONNABORTED' || netErr.message?.includes('timeout')) {
        return new AppApiError({
          code: 'TIMEOUT_ERROR',
          message: 'A requisição expirou por tempo limite. Tente novamente.',
          status: 408,
          retryable: true,
        });
      }
      if (netErr.code === 'ERR_NETWORK') {
        return new AppApiError({
          code: 'NETWORK_ERROR',
          message: 'Sem conexão com o servidor. Verifique sua rede.',
          status: 0,
          retryable: true,
        });
      }
    }

    return new AppApiError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido.',
      status: 500,
      retryable: false,
    });
  }
}

export function isApiError(error: unknown): error is AppApiError {
  return error instanceof AppApiError;
}
