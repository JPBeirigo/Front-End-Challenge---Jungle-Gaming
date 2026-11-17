import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { scenarioManager } from '../scenarios';
import { applyScenarioInterceptors } from './middleware';
import type { NFTItem } from '../../shared/types/contracts';

export const nftHandlers = [
  // 1. GET /api/nfts
  http.get('/api/nfts', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const scenario = scenarioManager.getActiveScenario();
    if (scenario === 'empty_catalog') {
      return HttpResponse.json({
        items: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const category = url.searchParams.get('category') || 'all';
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const sortBy = url.searchParams.get('sortBy') || 'popular';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10));

    let nfts = [...mockDb.getNFTs()];

    // Filtro por busca (título ou criador)
    if (search) {
      nfts = nfts.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.creator.name.toLowerCase().includes(search) ||
          n.description.toLowerCase().includes(search)
      );
    }

    // Filtro por categoria
    if (category && category !== 'all') {
      nfts = nfts.filter((n) => n.category.toLowerCase() === category.toLowerCase());
    }

    // Filtro por faixa de preço
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        nfts = nfts.filter((n) => parseFloat(n.priceEth) >= min);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        nfts = nfts.filter((n) => parseFloat(n.priceEth) <= max);
      }
    }

    // Ordenação
    switch (sortBy) {
      case 'price_asc':
        nfts.sort((a, b) => parseFloat(a.priceEth) - parseFloat(b.priceEth));
        break;
      case 'price_desc':
        nfts.sort((a, b) => parseFloat(b.priceEth) - parseFloat(a.priceEth));
        break;
      case 'newest':
        nfts.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'popular':
      default:
        nfts.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
        break;
    }

    const total = nfts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = nfts.slice(offset, offset + limit);

    // Enriquece com status de favorito se autenticado
    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);
    const enrichedItems: NFTItem[] = paginatedItems.map((item) => ({
      ...item,
      isFavorite: user ? mockDb.isFavorite(user.id, item.id) : false,
    }));

    return HttpResponse.json({
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages,
    });
  }),

  // 2. GET /api/nfts/:id
  http.get('/api/nfts/:id', async ({ request, params }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const { id } = params as { id: string };
    const nft = mockDb.getNFTById(id);

    if (!nft) {
      return HttpResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'NFT não encontrado ou indisponível.',
          status: 404,
        },
        { status: 404 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const user = mockDb.getUserByToken(authHeader || undefined);

    const enrichedNft: NFTItem = {
      ...nft,
      isFavorite: user ? mockDb.isFavorite(user.id, nft.id) : false,
    };

    return HttpResponse.json(enrichedNft);
  }),
];
