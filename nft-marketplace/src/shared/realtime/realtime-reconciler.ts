import type { QueryClient } from '@tanstack/react-query';
import type {
  Cart,
  NFTItem,
  NFTUpdatedEvent,
  Order,
  OrderUpdatedEvent,
  PaginatedResponse,
} from '../types/contracts';
import { catalogKeys } from '../../features/catalog/hooks/query-keys';
import { cartKeys } from '../../features/cart/hooks/query-keys';

/**
 * Reconciliador de eventos em tempo real do catálogo e carrinho.
 * Executa mutações granulares no cache do TanStack Query respeitando versões.
 */
export function handleNftUpdatedEvent(
  event: NFTUpdatedEvent,
  queryClient: QueryClient,
  userId?: string,
): { title?: string; priceChanged?: boolean; soldOut?: boolean } {
  const { data } = event;
  let affectedTitle: string | undefined;
  let priceChanged = false;
  let soldOut = false;

  // 1. Atualiza detalhe do NFT se estiver em cache
  queryClient.setQueryData<NFTItem>(catalogKeys.detail(userId, data.nftId), (old) => {
    if (!old) return old;
    affectedTitle = old.title;
    if (old.priceEth !== data.priceEth) priceChanged = true;
    if (old.totalAvailable > 0 && data.totalAvailable === 0) soldOut = true;

    return {
      ...old,
      priceEth: data.priceEth,
      totalAvailable: data.totalAvailable,
      version: Math.max(old.version, event.version),
      editions: old.editions.map((ed) => {
        const update = data.editions?.find((e) => e.id === ed.id);
        if (!update) return ed;
        return {
          ...ed,
          available: update.available,
          priceEth: update.priceEth,
        };
      }),
    };
  });

  // 2. Atualiza listagens do catálogo sem refetch desnecessário
  queryClient.setQueriesData<PaginatedResponse<NFTItem>>(
    { queryKey: catalogKeys.all(userId) },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((nft) => {
          if (nft.id !== data.nftId) return nft;
          affectedTitle = affectedTitle || nft.title;
          if (nft.priceEth !== data.priceEth) priceChanged = true;
          if (nft.totalAvailable > 0 && data.totalAvailable === 0) soldOut = true;

          return {
            ...nft,
            priceEth: data.priceEth,
            totalAvailable: data.totalAvailable,
            version: Math.max(nft.version, event.version),
            editions: nft.editions.map((ed) => {
              const update = data.editions?.find((e) => e.id === ed.id);
              if (!update) return ed;
              return {
                ...ed,
                available: update.available,
                priceEth: update.priceEth,
              };
            }),
          };
        }),
      };
    },
  );

  // 3. Atualiza o carrinho se o NFT modificado estiver presente
  const cartKey = cartKeys.detail(userId);
  queryClient.setQueryData<Cart>(cartKey, (oldCart) => {
    if (!oldCart) return oldCart;

    const hasItem = oldCart.items.some((item) => item.nftId === data.nftId);
    if (!hasItem) return oldCart;

    return {
      ...oldCart,
      items: oldCart.items.map((item) => {
        if (item.nftId !== data.nftId) return item;
        affectedTitle = affectedTitle || item.title;

        // Procura nova edição ou preço
        const updatedEd = data.editions?.find((e) => e.id === item.editionId);
        const newPrice = updatedEd?.priceEth ?? data.priceEth;
        if (item.priceEth !== newPrice) priceChanged = true;

        return {
          ...item,
          priceEth: newPrice,
          maxAvailable: data.totalAvailable,
        };
      }),
      updatedAt: new Date().toISOString(),
    };
  });

  // Se o item estiver no carrinho, invalida a cotação para exigir revalidação
  void queryClient.invalidateQueries({
    queryKey: [...cartKeys.all(userId), 'quote'],
  });

  return { title: affectedTitle, priceChanged, soldOut };
}

/**
 * Reconciliador de eventos em tempo real de pedidos.
 */
export function handleOrderUpdatedEvent(
  event: OrderUpdatedEvent,
  queryClient: QueryClient,
  userId?: string,
): void {
  const { data } = event;

  // Atualiza cache de detalhes do pedido
  queryClient.setQueryData<Order>(['order', userId, data.orderId], (old) => {
    if (!old) return old;
    return {
      ...old,
      status: data.status,
      transactionHash: data.transactionHash ?? old.transactionHash,
      failureReason: data.failureReason ?? old.failureReason,
      version: Math.max(old.version, event.version),
      updatedAt: new Date().toISOString(),
    };
  });

  // Invalida listas de pedidos
  void queryClient.invalidateQueries({ queryKey: ['orders', userId] });
}
