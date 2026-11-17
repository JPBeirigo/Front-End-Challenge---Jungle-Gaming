import { http, HttpResponse } from 'msw';
import { mockDb } from '../db';
import { scenarioManager } from '../scenarios';
import { applyScenarioInterceptors } from './middleware';
import type { QuoteRequest } from '../../shared/types/contracts';

export const quoteHandlers = [
  // 1. POST /api/quote
  http.post('/api/quote', async ({ request }) => {
    const errorResponse = await applyScenarioInterceptors();
    if (errorResponse) return errorResponse;

    const body = (await request.json()) as QuoteRequest;
    const scenario = scenarioManager.getActiveScenario();

    const quote = mockDb.calculateQuote(body.items || [], body.couponCode);

    // Simulação do cenário onde o preço mudou enquanto estava no carrinho/checkout
    if (scenario === 'price_changed_during_checkout') {
      const firstItem = quote.itemsVerified[0];
      if (firstItem) {
        firstItem.currentPriceEth = (parseFloat(firstItem.currentPriceEth) + 0.25).toFixed(4);
        firstItem.changed = true;
        quote.valid = false;
      }
    }

    // Simulação do cenário onde a edição esgotou antes da finalização
    if (scenario === 'edition_sold_out') {
      const firstItem = quote.itemsVerified[0];
      if (firstItem) {
        firstItem.available = false;
        firstItem.changed = true;
        quote.valid = false;
      }
    }

    return HttpResponse.json(quote);
  }),
];
