import type { NFTFilterParams } from '../../../shared/types/contracts';

/**
 * Chaves de query para o catálogo — incluem userId para isolamento de sessão.
 */
export const catalogKeys = {
  all: (userId?: string) => ['catalog', userId] as const,

  list: (userId?: string, filters?: NFTFilterParams) =>
    [...catalogKeys.all(userId), 'list', filters] as const,

  detail: (userId?: string, id?: string) =>
    [...catalogKeys.all(userId), 'detail', id] as const,

  favorites: (userId?: string) => ['favorites', userId] as const,
};
