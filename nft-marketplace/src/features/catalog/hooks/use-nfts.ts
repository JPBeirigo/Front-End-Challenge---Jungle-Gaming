import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { nftsApi } from '../../../shared/api/services';
import type { NFTFilterParams } from '../../../shared/types/contracts';
import { useAuth } from '../../auth/context/use-auth';
import { catalogKeys } from './query-keys';

/**
 * Hook para listar NFTs do catálogo com filtros e paginação.
 * Inclui debounce de 300ms no campo `search`.
 */
export function useNFTs(filters: NFTFilterParams) {
  const { user } = useAuth();

  // Debounce do campo search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search ?? '');
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const debouncedFilters: NFTFilterParams = {
    ...filters,
    search: debouncedSearch || undefined,
  };

  return useQuery({
    queryKey: catalogKeys.list(user?.id, debouncedFilters),
    queryFn: ({ signal }) => nftsApi.list(debouncedFilters, signal),
    placeholderData: (prev) => prev, // keepPreviousData equivalente no v5
    staleTime: 30_000,
  });
}
