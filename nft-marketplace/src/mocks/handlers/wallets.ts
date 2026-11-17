import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { applyScenarioInterceptors } from './middleware';
import type { CreateWalletRequest, UpdateWalletRequest } from '../../shared/types/contracts';

export const walletHandlers = [
  // 1. GET /api/wallets
  http.get('/api/wallets', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Você precisa estar autenticado para acessar suas carteiras.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const wallets = mockDb.getWallets(user.id);
    return HttpResponse.json(wallets);
  }),

  // 2. POST /api/wallets
  http.post('/api/wallets', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Faça login para cadastrar uma carteira.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateWalletRequest;
    if (!body.address || !body.name || !body.type) {
      return HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Endereço, nome e tipo de carteira são obrigatórios.',
          status: 400,
        },
        { status: 400 }
      );
    }

    const newWallet = mockDb.createWallet(user.id, {
      address: body.address,
      name: body.name,
      type: body.type,
      network: body.network || 'Ethereum Mainnet',
      balanceEth: '0.0000',
      isDefault: false,
    });

    return HttpResponse.json(newWallet, { status: 201 });
  }),

  // 3. PUT /api/wallets/:id
  http.put('/api/wallets/:id', async ({ request, params }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Faça login para gerenciar carteiras.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const { id } = params as { id: string };
    const body = (await request.json()) as UpdateWalletRequest;

    const updated = mockDb.updateWallet(user.id, id, body);
    if (!updated) {
      return HttpResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'Carteira não encontrada.',
          status: 404,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(updated);
  }),
];
