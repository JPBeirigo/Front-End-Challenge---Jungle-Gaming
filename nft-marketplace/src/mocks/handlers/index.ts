import { http, HttpResponse } from 'msw';
import { authHandlers } from './auth';
import { nftHandlers } from './nfts';
import { favoriteHandlers } from './favorites';
import { cartHandlers } from './cart';
import { quoteHandlers } from './quote';
import { orderHandlers } from './orders';
import { profileHandlers } from './profile';
import { walletHandlers } from './wallets';
import { mockDb } from '../db';
import { scenarioManager, type MockScenarioType } from '../scenarios';
import { mockSocketEmitter } from '../socket/emitter';
import type { NFTUpdatedData, OrderUpdatedData } from '../../shared/types/contracts';

// Handlers de controle, debug e disparo determinístico de eventos
const debugHandlers = [
  // POST /api/mocks/reset
  http.post('/api/mocks/reset', async () => {
    mockDb.reset();
    scenarioManager.resetToDefault();
    return HttpResponse.json({ success: true, message: 'Mock database resetado com sucesso.' });
  }),

  // POST /api/mocks/scenario
  http.post('/api/mocks/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario: MockScenarioType };
    scenarioManager.setScenario(body.scenario);
    return HttpResponse.json({
      success: true,
      activeScenario: scenarioManager.getActiveScenario(),
    });
  }),

  // POST /api/mocks/emit-event (disparo determinístico para testes e debug)
  http.post('/api/mocks/emit-event', async ({ request }) => {
    const body = (await request.json()) as
      | { event: 'nft.updated'; data: NFTUpdatedData }
      | { event: 'order.updated'; targetUserId?: string; data: OrderUpdatedData };

    if (body.event === 'nft.updated') {
      // 1. Atualiza no banco mock para manter consistência com REST
      mockDb.updateNFTPriceOrAvailability(
        body.data.nftId,
        body.data.priceEth,
        body.data.totalAvailable
      );
      // 2. Emite o evento Socket.IO para os clientes
      const eventPayload = mockSocketEmitter.emitNftUpdated(body.data);
      return HttpResponse.json({ success: true, emitted: eventPayload });
    }

    if (body.event === 'order.updated') {
      // 1. Atualiza no banco mock para manter consistência com REST
      mockDb.updateOrderStatus(
        body.data.orderId,
        body.data.status,
        body.data.transactionHash,
        body.data.failureReason
      );
      // 2. Emite o evento Socket.IO isolado por usuário quando aplicável
      const eventPayload = mockSocketEmitter.emitOrderUpdated(body.data, body.targetUserId);
      return HttpResponse.json({ success: true, emitted: eventPayload });
    }

    return HttpResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Tipo de evento não suportado.' },
      { status: 400 }
    );
  }),
];

export const handlers = [
  ...debugHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
];
