import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';
import { scenarioManager } from '../scenarios';
import { applyScenarioInterceptors } from './middleware';
import { createPayloadFingerprint } from '../../shared/utils/idempotency';
import type { CreateOrderRequest, OrderItemSnapshot } from '../../shared/types/contracts';

const timeoutSimulatedKeys = new Set<string>();

export const orderHandlers = [
  // 1. POST /api/orders
  http.post('/api/orders', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Você precisa estar autenticado para finalizar uma compra.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const idempotencyHeader = request.headers.get('Idempotency-Key');
    const body = (await request.json()) as CreateOrderRequest;
    const idempotencyKey = idempotencyHeader || body.idempotencyKey;

    if (!idempotencyKey) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Chave de idempotência ausente no cabeçalho ou corpo.',
          status: 400,
        },
        { status: 400 }
      );
    }

    const scenario = scenarioManager.getActiveScenario();

    // Simulação do cenário de Timeout no envio com recuperação por idempotência
    if (scenario === 'order_timeout' && !timeoutSimulatedKeys.has(idempotencyKey)) {
      timeoutSimulatedKeys.add(idempotencyKey);
      await delay(2000);
      return HttpResponse.json(
        {
          code: 'TIMEOUT_ERROR',
          message: 'A confirmação do pedido demorou mais que o esperado. Reenvie com a mesma chave.',
          status: 408,
          retryable: true,
        },
        { status: 408 }
      );
    }

    const fingerprint = createPayloadFingerprint({
      userId: user.id,
      items: body.items,
      walletAddress: body.walletAddress,
      network: body.network,
    });

    // Calcula snapshot financeiro através da cotação oficial
    const quote = mockDb.calculateQuote(body.items, body.couponCode);
    if (!quote.valid) {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: 'A cotação do pedido está desatualizada ou algum item ficou indisponível. Revise o carrinho.',
          status: 409,
        },
        { status: 409 }
      );
    }

    const orderItems: OrderItemSnapshot[] = body.items.map((item) => {
      const nft = mockDb.getNFTById(item.nftId);
      const edition = nft?.editions.find((e) => e.id === item.editionId);
      const unitPriceEth = edition?.priceEth || item.priceEth;
      return {
        nftId: item.nftId,
        editionId: item.editionId,
        editionNumber: edition?.editionNumber || 1,
        title: nft?.title || 'NFT',
        imageUrl: nft?.imageUrl || '',
        creatorName: nft?.creator.name || 'Criador',
        quantity: item.quantity,
        unitPriceEth,
        subtotalEth: (parseFloat(unitPriceEth) * item.quantity).toFixed(4),
      };
    });

    let initialStatus: 'pending' | 'confirmed' | 'failed' = 'confirmed';
    let transactionHash: string | undefined = '0x' + Math.random().toString(16).substring(2, 18) + '...f9c0';
    let failureReason: string | undefined;

    if (scenario === 'payment_declined') {
      initialStatus = 'failed';
      transactionHash = undefined;
      failureReason = 'Transação recusada pela rede de blockchain (saldo insuficiente ou limite de gás excedido).';
    }

    if (scenario === 'order_pending') {
      initialStatus = 'pending';
      transactionHash = undefined;
    }

    try {
      const { order, isReplay } = mockDb.createOrder(idempotencyKey, fingerprint, {
        idempotencyKey,
        userId: user.id,
        status: initialStatus,
        items: orderItems,
        subtotalEth: quote.subtotalEth,
        discountEth: quote.discountEth,
        networkFeeEth: quote.networkFeeEth,
        totalEth: quote.totalEth,
        collectorInfo: body.collectorInfo,
        walletAddress: body.walletAddress,
        network: body.network,
        transactionHash,
        failureReason,
      });

      // Se o pedido foi confirmado com sucesso e não é um replay, limpa os itens comprados do carrinho do usuário
      if (initialStatus === 'confirmed' && !isReplay) {
        const cartKey = `cart_user_${user.id}`;
        body.items.forEach((boughtItem) => {
          mockDb.removeCartItem(cartKey, boughtItem.nftId, boughtItem.editionId);
        });
      }

      return HttpResponse.json(order, { status: isReplay ? 200 : 201 });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'CONFLICT_PAYLOAD') {
        return HttpResponse.json(
          {
            code: 'CONFLICT',
            message: 'A mesma chave de idempotência foi reutilizada com dados diferentes da transação original.',
            status: 409,
          },
          { status: 409 }
        );
      }
      return HttpResponse.json(
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha ao processar o pedido.',
          status: 500,
        },
        { status: 500 }
      );
    }
  }),

  // 2. GET /api/orders/:id
  http.get('/api/orders/:id', async ({ request, params }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Acesso não autorizado ao recibo do pedido.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const { id } = params as { id: string };
    const order = mockDb.getOrderById(id);

    if (!order) {
      return HttpResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'Pedido não encontrado.',
          status: 404,
        },
        { status: 404 }
      );
    }

    // Proteção de privacidade: impede visualizar pedidos de outros usuários
    if (order.userId !== user.id) {
      return HttpResponse.json(
        {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para visualizar este pedido.',
          status: 403,
        },
        { status: 403 }
      );
    }

    return HttpResponse.json(order);
  }),
];
