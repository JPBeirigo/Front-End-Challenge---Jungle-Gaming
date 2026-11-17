import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { quoteApi } from '../../../shared/api/services';
import { useAuth } from '../../auth/context/use-auth';
import { cartKeys } from './query-keys';
import type { CartItem, QuoteResponse } from '../../../shared/types/contracts';

interface UseQuoteOptions {
  items: CartItem[];
  couponCode?: string;
}

/**
 * Hook para obter a cotação oficial e autoritativa da API para os itens do carrinho.
 * Garante que taxas, descontos e total venham do servidor sem discrepância no cliente.
 */
export function useQuote({ items, couponCode }: UseQuoteOptions) {
  const { user } = useAuth();

  // Gera uma chave de dependência estável a partir dos itens e quantidades
  const itemsKey = useMemo(() => {
    return items
      .map((i) => `${i.nftId}:${i.editionId}:${i.quantity}`)
      .sort()
      .join('|');
  }, [items]);

  const queryKey = cartKeys.quote(user?.id, itemsKey, couponCode);

  const query = useQuery<QuoteResponse>({
    queryKey,
    queryFn: ({ signal }) => {
      const quotePayload = {
        items: items.map((i) => ({
          nftId: i.nftId,
          editionId: i.editionId,
          quantity: i.quantity,
        })),
        couponCode: couponCode || undefined,
      };
      return quoteApi.getQuote(quotePayload, signal);
    },
    enabled: items.length > 0,
    staleTime: 15_000,
    retry: 1,
  });

  // Valores padrão quando o carrinho estiver vazio
  const fallbackQuote: QuoteResponse = {
    subtotalEth: '0.0000',
    discountEth: '0.0000',
    networkFeeEth: '0.0000',
    totalEth: '0.0000',
    couponApplied: null,
    itemsVerified: [],
    expiresAt: new Date().toISOString(),
    valid: true,
  };

  const quote = query.data ?? fallbackQuote;

  return {
    ...query,
    quote,
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    couponApplied: quote.couponApplied,
    itemsVerified: quote.itemsVerified,
    isValid: quote.valid,
  };
}
