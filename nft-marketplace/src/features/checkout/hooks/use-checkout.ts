import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/use-auth';
import { useCart } from '../../cart/hooks/use-cart';
import { useQuote } from '../../cart/hooks/use-quote';
import { useWallets } from '../../wallets/hooks/use-wallets';
import { ordersApi, quoteApi } from '../../../shared/api/services';
import { cartKeys } from '../../cart/hooks/query-keys';
import { generateIdempotencyKey } from '../../../shared/utils/idempotency';
import { compareEth } from '../../../shared/utils/currency';
import { AppApiError } from '../../../shared/api/errors';
import type {
  CollectorInfo,
  CreateOrderRequest,
  Order,
  QuoteResponse,
  Wallet,
} from '../../../shared/types/contracts';

export type CheckoutStep = 'details' | 'review';

export interface QuoteChangeDetails {
  previousTotalEth: string;
  newTotalEth: string;
  hasUnavailableItems: boolean;
  unavailableItemTitles: string[];
  changedPriceTitles: string[];
}

export function useCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { items, cart, itemCount, isLoading: isCartLoading } = useCart();
  const { wallets, defaultWallet, isLoading: isWalletsLoading } = useWallets();

  // Cotação atual através dos itens no carrinho
  const {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponApplied,
    isValid: isQuoteValid,
    isLoading: isQuoteLoading,
    refetch: refetchQuote,
  } = useQuote({ items, couponCode: cart?.couponCode });

  // 1. Etapa do Checkout
  const [step, setStep] = useState<CheckoutStep>('details');

  // 2. Dados do Colecionador
  const [collectorInfo, setCollectorInfo] = useState<CollectorInfo>({
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
  });

  // Atualiza se o usuário carregar posteriormente
  useEffect(() => {
    if (user) {
      setCollectorInfo((prev) => ({
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
        phone: prev.phone,
      }));
    }
  }, [user]);

  // 3. Carteira e Rede
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Ethereum Mainnet');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(true);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [simulateWalletRefusal, setSimulateWalletRefusal] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Inicializa carteira selecionada com a padrão
  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      const initial = defaultWallet || wallets[0];
      setSelectedWalletId(initial.id);
      setSelectedNetwork(initial.network || 'Ethereum Mainnet');
    }
  }, [wallets, defaultWallet, selectedWalletId]);

  const selectedWallet: Wallet | null = useMemo(() => {
    return wallets.find((w) => w.id === selectedWalletId) || defaultWallet || null;
  }, [wallets, selectedWalletId, defaultWallet]);

  // Validação de saldo suficiente na carteira
  const hasInsufficientBalance = useMemo(() => {
    if (!selectedWallet?.balanceEth || !totalEth) return false;
    return compareEth(selectedWallet.balanceEth, totalEth) < 0;
  }, [selectedWallet, totalEth]);

  // Simulação de Conexão/Desconexão de Carteira
  const handleConnectWallet = useCallback(async () => {
    setIsConnectingWallet(true);
    setWalletError(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    if (simulateWalletRefusal) {
      setIsWalletConnected(false);
      setWalletError('Conexão recusada pelo usuário na interface da carteira.');
      setIsConnectingWallet(false);
      return;
    }

    setIsWalletConnected(true);
    setIsConnectingWallet(false);
  }, [simulateWalletRefusal]);

  const handleDisconnectWallet = useCallback(() => {
    setIsWalletConnected(false);
    setWalletError(null);
  }, []);

  // 4. Chave de Idempotência persistente para tentativas seguras
  const [idempotencyKey] = useState<string>(() => generateIdempotencyKey());

  // 5. Estados de Envio e Falha
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isTimeoutError, setIsTimeoutError] = useState<boolean>(false);

  // 6. Detecção de Alteração de Cotação Pré-Confirmação
  const [quoteChange, setQuoteChange] = useState<QuoteChangeDetails | null>(null);
  const [pendingQuoteResponse, setPendingQuoteResponse] = useState<QuoteResponse | null>(null);

  // Transição para o passo de revisão com validação básica
  const handleProceedToReview = useCallback(() => {
    setSubmissionError(null);
    if (!collectorInfo.fullName.trim()) {
      setSubmissionError('O nome completo do colecionador é obrigatório.');
      return;
    }
    if (!collectorInfo.email.trim() || !collectorInfo.email.includes('@')) {
      setSubmissionError('Um e-mail válido é obrigatório para envio do recibo.');
      return;
    }
    if (!isWalletConnected || !selectedWallet) {
      setSubmissionError('Você precisa conectar uma carteira antes de prosseguir.');
      return;
    }
    setStep('review');
  }, [collectorInfo, isWalletConnected, selectedWallet]);

  const handleBackToDetails = useCallback(() => {
    setSubmissionError(null);
    setStep('details');
  }, []);

  // Envio do Pedido (com revalidação obrigatória de cotação antes do envio)
  const submitOrder = useCallback(
    async (overrideQuote?: QuoteResponse) => {
      if (!selectedWallet) {
        setSubmissionError('Carteira não selecionada.');
        return;
      }

      try {
        setIsSubmitting(true);
        setSubmissionError(null);
        setIsTimeoutError(false);

        // Passo A: Revalidação ativa da cotação com a API
        let currentQuote = overrideQuote;
        if (!currentQuote) {
          const freshQuote = await quoteApi.getQuote({
            items: items.map((i) => ({
              nftId: i.nftId,
              editionId: i.editionId,
              quantity: i.quantity,
            })),
            couponCode: cart?.couponCode,
          });

          // Verifica se houve alteração de preço ou disponibilidade
          const changedItems = freshQuote.itemsVerified.filter((i) => i.changed);
          const unavailableItems = freshQuote.itemsVerified.filter((i) => !i.available);
          const priceDiffers = freshQuote.totalEth !== totalEth;

          if (changedItems.length > 0 || unavailableItems.length > 0 || priceDiffers || !freshQuote.valid) {
            // Interrompe o envio e solicita confirmação explícita do usuário
            const unavailableTitles: string[] = [];
            const changedTitles: string[] = [];

            freshQuote.itemsVerified.forEach((iv) => {
              const matchedCartItem = items.find(
                (ci) => ci.nftId === iv.nftId && ci.editionId === iv.editionId
              );
              const title = matchedCartItem?.title || 'Obra';
              if (!iv.available) unavailableTitles.push(title);
              else if (iv.changed) changedTitles.push(title);
            });

            setPendingQuoteResponse(freshQuote);
            setQuoteChange({
              previousTotalEth: totalEth,
              newTotalEth: freshQuote.totalEth,
              hasUnavailableItems: unavailableItems.length > 0,
              unavailableItemTitles: unavailableTitles,
              changedPriceTitles: changedTitles,
            });
            setIsSubmitting(false);
            return;
          }

          currentQuote = freshQuote;
        }

        // Passo B: Construção do Payload do Pedido
        const orderPayload: CreateOrderRequest = {
          idempotencyKey,
          collectorInfo,
          walletAddress: selectedWallet.address,
          network: selectedNetwork,
          items: items.map((i) => {
            const verified = currentQuote?.itemsVerified.find(
              (v) => v.nftId === i.nftId && v.editionId === i.editionId
            );
            return {
              nftId: i.nftId,
              editionId: i.editionId,
              quantity: i.quantity,
              priceEth: verified?.currentPriceEth || i.priceEth,
            };
          }),
          couponCode: cart?.couponCode,
        };

        // Passo C: Disparo Idempotente
        const createdOrder: Order = await ordersApi.create(orderPayload);

        // Se o pedido teve sucesso ou falha simulada (status terminal no mock),
        // invalida o carrinho para remover os itens comprados (em caso de confirmed)
        if (createdOrder.status === 'confirmed') {
          void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
        }

        // Redireciona para a tela do recibo / confirmação
        void navigate({
          to: '/orders/$id',
          params: { id: createdOrder.id },
        });
      } catch (err: unknown) {
        if (err instanceof AppApiError) {
          if (err.status === 408 || err.code === 'TIMEOUT_ERROR') {
            setIsTimeoutError(true);
            setSubmissionError(
              'A rede demorou para responder (Timeout). Você pode tentar reenviar com a mesma chave de transação com segurança.'
            );
          } else if (err.status === 409 || err.code === 'CONFLICT') {
            setSubmissionError(
              'Conflito na transação: A cotação expirou ou os itens foram alterados. Por favor, revise seu pedido.'
            );
          } else {
            setSubmissionError(err.message || 'Erro ao processar o pagamento.');
          }
        } else {
          setSubmissionError('Falha de conexão com a rede. Verifique seu sinal e tente novamente.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedWallet,
      items,
      cart,
      totalEth,
      idempotencyKey,
      collectorInfo,
      selectedNetwork,
      queryClient,
      user,
      navigate,
    ]
  );

  // Usuário aceita a nova cotação após aviso de alteração
  const handleAcceptNewQuote = useCallback(() => {
    if (!pendingQuoteResponse) return;
    const accepted = pendingQuoteResponse;
    setQuoteChange(null);
    setPendingQuoteResponse(null);
    void refetchQuote();
    void submitOrder(accepted);
  }, [pendingQuoteResponse, refetchQuote, submitOrder]);

  // Usuário recusa a nova cotação e cancela
  const handleRejectNewQuote = useCallback(() => {
    setQuoteChange(null);
    setPendingQuoteResponse(null);
    void navigate({ to: '/cart' });
  }, [navigate]);

  // Reenvio seguro com a MESMA chave de idempotência após timeout
  const handleRetrySameKey = useCallback(() => {
    void submitOrder();
  }, [submitOrder]);

  return {
    step,
    setStep,
    collectorInfo,
    setCollectorInfo,
    wallets,
    selectedWallet,
    selectedWalletId,
    setSelectedWalletId,
    selectedNetwork,
    setSelectedNetwork,
    isWalletConnected,
    isConnectingWallet,
    simulateWalletRefusal,
    setSimulateWalletRefusal,
    walletError,
    hasInsufficientBalance,
    handleConnectWallet,
    handleDisconnectWallet,
    items,
    itemCount,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponApplied,
    isQuoteLoading,
    isQuoteValid,
    isCartLoading,
    isWalletsLoading,
    isSubmitting,
    submissionError,
    isTimeoutError,
    idempotencyKey,
    quoteChange,
    handleProceedToReview,
    handleBackToDetails,
    submitOrder,
    handleAcceptNewQuote,
    handleRejectNewQuote,
    handleRetrySameKey,
  };
}
