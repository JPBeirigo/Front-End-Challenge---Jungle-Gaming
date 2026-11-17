import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { scenarioManager } from '../scenarios';
import { applyScenarioInterceptors } from './middleware';

function resolveCartKey(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  const user = mockDb.getUserByToken(authHeader || undefined);
  if (user) {
    return `cart_user_${user.id}`;
  }
  return request.headers.get('X-Cart-Session') || 'cart_guest_default';
}

export const cartHandlers = [
  // 1. GET /api/cart
  http.get('/api/cart', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const cartKey = resolveCartKey(request);
    const cart = mockDb.getCart(cartKey);

    return HttpResponse.json(cart);
  }),

  // 2. POST /api/cart/items
  http.post('/api/cart/items', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const scenario = scenarioManager.getActiveScenario();
    if (scenario === 'edition_sold_out') {
      return HttpResponse.json(
        {
          code: 'EDITION_SOLD_OUT',
          message: 'Esta edição foi esgotada e não pode ser adicionada ao carrinho.',
          status: 409,
        },
        { status: 409 }
      );
    }

    const body = (await request.json()) as { nftId: string; editionId: string; quantity: number };
    const cartKey = resolveCartKey(request);

    try {
      const updatedCart = mockDb.addItemToCart(cartKey, body.nftId, body.editionId, body.quantity || 1);
      return HttpResponse.json(updatedCart);
    } catch (err: unknown) {
      return HttpResponse.json(
        {
          code: 'CONFLICT',
          message: err instanceof Error ? err.message : 'Falha ao adicionar item.',
          status: 400,
        },
        { status: 400 }
      );
    }
  }),

  // 3. PUT /api/cart/items
  http.put('/api/cart/items', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const body = (await request.json()) as { nftId: string; editionId: string; quantity: number };
    const cartKey = resolveCartKey(request);

    const updatedCart = mockDb.updateCartItem(cartKey, body.nftId, body.editionId, body.quantity);
    return HttpResponse.json(updatedCart);
  }),

  // 4. DELETE /api/cart/items/:nftId/:editionId
  http.delete('/api/cart/items/:nftId/:editionId', async ({ request, params }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const { nftId, editionId } = params as { nftId: string; editionId: string };
    const cartKey = resolveCartKey(request);

    const updatedCart = mockDb.removeCartItem(cartKey, nftId, editionId);
    return HttpResponse.json(updatedCart);
  }),

  // 5. POST /api/cart/coupon
  http.post('/api/cart/coupon', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const scenario = scenarioManager.getActiveScenario();
    if (scenario === 'coupon_invalid') {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Cupom de desconto inválido ou não encontrado.',
          status: 400,
        },
        { status: 400 }
      );
    }

    if (scenario === 'coupon_expired') {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Este cupom de desconto expirou.',
          status: 400,
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { code: string };
    const cartKey = resolveCartKey(request);

    try {
      const updatedCart = mockDb.applyCouponToCart(cartKey, body.code);
      return HttpResponse.json(updatedCart);
    } catch (err: unknown) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: err instanceof Error ? err.message : 'Cupom inválido.',
          status: 400,
        },
        { status: 400 }
      );
    }
  }),

  // 6. DELETE /api/cart/coupon
  http.delete('/api/cart/coupon', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const cartKey = resolveCartKey(request);
    const updatedCart = mockDb.removeCouponFromCart(cartKey);
    return HttpResponse.json(updatedCart);
  }),
];
