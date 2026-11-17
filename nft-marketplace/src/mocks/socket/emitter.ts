import type {
  NFTUpdatedData,
  NFTUpdatedEvent,
  OrderUpdatedData,
  OrderUpdatedEvent,
} from '../../shared/types/contracts';

interface ActiveClient {
  emit: (event: string, ...data: unknown[]) => void;
  userId?: string;
  id: string;
}

class MockSocketEmitter {
  private activeClients = new Map<string, ActiveClient>();
  private eventVersionCounters: Record<string, number> = {};

  public registerClient(id: string, emitFn: (event: string, ...data: unknown[]) => void, userId?: string) {
    this.activeClients.set(id, {
      id,
      emit: emitFn,
      userId,
    });
  }

  public setClientUser(clientId: string, userId: string) {
    const client = this.activeClients.get(clientId);
    if (client) {
      client.userId = userId;
    }
  }

  public unregisterClient(clientId: string) {
    this.activeClients.delete(clientId);
  }

  public getConnectedClientsCount(): number {
    return this.activeClients.size;
  }

  /**
   * Emite evento 'nft.updated' para todos os clientes conectados.
   * Carrega identidade estável, recurso, versão e timestamp.
   */
  public emitNftUpdated(data: NFTUpdatedData) {
    const key = `nft_${data.nftId}`;
    this.eventVersionCounters[key] = (this.eventVersionCounters[key] || 0) + 1;
    const version = this.eventVersionCounters[key];

    const eventPayload: NFTUpdatedEvent = {
      id: `evt_nft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resource: 'nft',
      version,
      timestamp: new Date().toISOString(),
      data,
    };

    this.activeClients.forEach((client) => {
      try {
        client.emit('nft.updated', eventPayload);
      } catch (err) {
        console.warn('Falha ao emitir nft.updated para cliente:', client.id, err);
      }
    });

    return eventPayload;
  }

  /**
   * Emite evento 'order.updated' isolado por usuário quando aplicável.
   */
  public emitOrderUpdated(data: OrderUpdatedData, targetUserId?: string) {
    const key = `order_${data.orderId}`;
    this.eventVersionCounters[key] = (this.eventVersionCounters[key] || 0) + 1;
    const version = this.eventVersionCounters[key];

    const eventPayload: OrderUpdatedEvent = {
      id: `evt_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resource: 'order',
      version,
      userId: targetUserId,
      timestamp: new Date().toISOString(),
      data,
    };

    this.activeClients.forEach((client) => {
      // Se o evento for direcionado a um usuário específico, não entrega a outros
      if (targetUserId && client.userId && client.userId !== targetUserId) {
        return;
      }

      try {
        client.emit('order.updated', eventPayload);
      } catch (err) {
        console.warn('Falha ao emitir order.updated para cliente:', client.id, err);
      }
    });

    return eventPayload;
  }
}

export const mockSocketEmitter = new MockSocketEmitter();
