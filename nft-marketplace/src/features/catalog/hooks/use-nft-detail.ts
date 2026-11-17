import { useQuery } from '@tanstack/react-query';
import { nftsApi } from '../../../shared/api/services';
import { useAuth } from '../../auth/context/use-auth';
import { catalogKeys } from './query-keys';

/**
 * Hook para carregar o detalhe de um NFT específico.
 */
export function useNFTDetail(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: catalogKeys.detail(user?.id, id),
    queryFn: ({ signal }) => nftsApi.getById(id, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Não tentar novamente em 404
      const status = (error as { status?: number })?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}
