import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../shared/api/services';
import { useAuth } from '../../auth/context/use-auth';
import type { Order } from '../../../shared/types/contracts';

export const orderKeys = {
  all: (userId?: string) => ['orders', userId ?? 'anonymous'] as const,
  detail: (userId?: string, orderId?: string) =>
    ['order', userId ?? 'anonymous', orderId ?? ''] as const,
};

export function useOrder(orderId: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: orderKeys.detail(user?.id, orderId),
    queryFn: ({ signal }) => {
      if (!orderId) throw new Error('Identificador de pedido não fornecido.');
      return ordersApi.getById(orderId, signal);
    },
    enabled: !!orderId && !!user,
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: (query) => {
      const data = query.state.data as Order | undefined;
      // Se o pedido estiver pendente, realiza polling a cada 3 segundos como redundância ao Socket.IO
      return data?.status === 'pending' ? 3000 : false;
    },
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
