import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { applyScenarioInterceptors } from './middleware';

export const favoriteHandlers = [
  // 1. GET /api/favorites
  http.get('/api/favorites', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Você precisa estar autenticado para acessar seus favoritos.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const items = mockDb.getFavorites(user.id);
    return HttpResponse.json({
      items,
      total: items.length,
    });
  }),

  // 2. POST /api/favorites/:nftId
  http.post('/api/favorites/:nftId', async ({ request, params }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Faça login para favoritar este NFT.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const { nftId } = params as { nftId: string };
    const nft = mockDb.getNFTById(nftId);
    if (!nft) {
      return HttpResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'NFT não encontrado.',
          status: 404,
        },
        { status: 404 }
      );
    }

    mockDb.addFavorite(user.id, nftId);
    return HttpResponse.json({ success: true, isFavorite: true });
  }),

  // 3. DELETE /api/favorites/:nftId
  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    if (!user) {
      return HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: 'Faça login para gerenciar favoritos.',
          status: 401,
        },
        { status: 401 }
      );
    }

    const { nftId } = params as { nftId: string };
    mockDb.removeFavorite(user.id, nftId);
    return HttpResponse.json({ success: true, isFavorite: false });
  }),
];
