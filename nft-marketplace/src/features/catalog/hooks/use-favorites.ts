import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../../../shared/api/services';
import type { NFTItem, PaginatedResponse } from '../../../shared/types/contracts';
import { useAuth } from '../../auth/context/use-auth';
import { catalogKeys } from './query-keys';

/**
 * Hook para listar favoritos do usuário autenticado.
 */
export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: catalogKeys.favorites(user?.id),
    queryFn: () => favoritesApi.list(),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}

/**
 * Hook para favoritar / desfavoritar um NFT com atualização otimista.
 * Faz rollback automático em caso de erro.
 */
export function useFavoriteToggle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nftId, isFavorite }: { nftId: string; isFavorite: boolean }) => {
      return isFavorite ? favoritesApi.remove(nftId) : favoritesApi.add(nftId);
    },

    onMutate: async ({ nftId, isFavorite }) => {
      // Cancela qualquer refetch em curso para não sobrescrever o optimistic update
      await queryClient.cancelQueries({ queryKey: catalogKeys.all(user?.id) });
      await queryClient.cancelQueries({ queryKey: catalogKeys.favorites(user?.id) });

      // Snapshot do estado anterior (para rollback)
      const previousList = queryClient.getQueriesData<PaginatedResponse<NFTItem>>({
        queryKey: catalogKeys.all(user?.id),
      });
      const previousFavorites = queryClient.getQueryData(catalogKeys.favorites(user?.id));

      // Atualiza otimisticamente todas as queries de listagem
      queryClient.setQueriesData<PaginatedResponse<NFTItem>>(
        { queryKey: catalogKeys.all(user?.id) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((nft) =>
              nft.id === nftId ? { ...nft, isFavorite: !isFavorite } : nft,
            ),
          };
        },
      );

      // Atualiza detalhe se em cache
      queryClient.setQueryData<NFTItem>(catalogKeys.detail(user?.id, nftId), (old) => {
        if (!old) return old;
        return { ...old, isFavorite: !isFavorite };
      });

      return { previousList, previousFavorites };
    },

    onError: (_err, { nftId }, context) => {
      // Rollback
      if (context?.previousList) {
        for (const [queryKey, data] of context.previousList) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousFavorites !== undefined) {
        queryClient.setQueryData(catalogKeys.favorites(user?.id), context.previousFavorites);
      }
      // Detalhe
      queryClient.invalidateQueries({ queryKey: catalogKeys.detail(user?.id, nftId) });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.favorites(user?.id) });
    },
  });
}
