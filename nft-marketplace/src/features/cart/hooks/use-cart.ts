import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../../shared/api/services';
import { useAuth } from '../../auth/context/use-auth';
import { cartKeys } from './query-keys';
import type { AddToCartRequest, UpdateCartItemRequest } from '../../../shared/types/contracts';

/**
 * Hook para carregar o carrinho do usuário ou visitante e realizar alterações.
 */
export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cartQueryKey = cartKeys.detail(user?.id);

  // Consulta do carrinho
  const query = useQuery({
    queryKey: cartQueryKey,
    queryFn: ({ signal }) => cartApi.get(signal),
    staleTime: 10_000,
  });

  // Mutação: Adicionar item
  const addItemMutation = useMutation({
    mutationFn: (data: AddToCartRequest) => cartApi.addItem(data),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey, updatedCart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
    },
  });

  // Mutação: Atualizar quantidade
  const updateQuantityMutation = useMutation({
    mutationFn: (data: UpdateCartItemRequest) => cartApi.updateItem(data),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey, updatedCart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
    },
  });

  // Mutação: Remover item
  const removeItemMutation = useMutation({
    mutationFn: ({ nftId, editionId }: { nftId: string; editionId: string }) =>
      cartApi.removeItem(nftId, editionId),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey, updatedCart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
    },
  });

  // Mutação: Aplicar cupom
  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon(code),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey, updatedCart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
    },
  });

  // Mutação: Remover cupom
  const removeCouponMutation = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartQueryKey, updatedCart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
    },
  });

  const cart = query.data;
  const items = cart?.items ?? [];
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    ...query,
    cart,
    items,
    itemCount,
    addItem: addItemMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    applyCoupon: applyCouponMutation.mutateAsync,
    removeCoupon: removeCouponMutation.mutateAsync,
    isUpdating:
      addItemMutation.isPending ||
      updateQuantityMutation.isPending ||
      removeItemMutation.isPending ||
      applyCouponMutation.isPending ||
      removeCouponMutation.isPending,
    couponError: applyCouponMutation.error,
    resetCouponError: applyCouponMutation.reset,
  };
}
