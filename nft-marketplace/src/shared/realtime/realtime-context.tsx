import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from './socket-client';
import { handleNftUpdatedEvent, handleOrderUpdatedEvent } from './realtime-reconciler';
import { useAuth } from '../../features/auth/context/use-auth';
import { catalogKeys } from '../../features/catalog/hooks/query-keys';
import { cartKeys } from '../../features/cart/hooks/query-keys';
import { formatEthDisplay } from '../utils/currency';
import type { NFTUpdatedEvent, OrderUpdatedEvent } from '../types/contracts';
import { RealtimeContext, type RealtimeNotice } from './realtime-context-def';

const MAX_SEEN_EVENTS = 500;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [activeNotice, setActiveNotice] = useState<RealtimeNotice | null>(null);

  // Armazena IDs e versões para deduplicação idempotente
  const seenEventIds = useRef(new Set<string>());
  const resourceVersions = useRef(new Map<string, number>());
  const hasConnectedOnce = useRef(false);

  const dismissNotice = () => {
    setActiveNotice(null);
  };

  const triggerManualSync = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: catalogKeys.all(user?.id) }),
      queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) }),
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] }),
    ]);
  }, [queryClient, user?.id]);

  useEffect(() => {
    const socket = getSocket(token);

    const onConnect = () => {
      setIsConnected(true);
      // Se foi uma reconexão (já havia conectado antes), reconcilia dados com REST
      if (hasConnectedOnce.current) {
        void triggerManualSync();
      }
      hasConnectedOnce.current = true;
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onNftUpdated = (event: NFTUpdatedEvent) => {
      if (!event || !event.id || !event.version || !event.data?.nftId) return;

      // 1. Deduplicação por Event ID
      if (seenEventIds.current.has(event.id)) {
        return;
      }
      seenEventIds.current.add(event.id);
      if (seenEventIds.current.size > MAX_SEEN_EVENTS) {
        const firstKey = seenEventIds.current.keys().next().value;
        if (firstKey) seenEventIds.current.delete(firstKey);
      }

      // 2. Validação de Versão Monotônica Crescente
      const resourceKey = `nft_${event.data.nftId}`;
      const lastVersion = resourceVersions.current.get(resourceKey) ?? 0;
      if (event.version <= lastVersion) {
        return; // Evento obsoleto recebido fora de ordem, descarta para não regredir
      }
      resourceVersions.current.set(resourceKey, event.version);

      // 3. Reconciliação no TanStack Query
      const updateResult = handleNftUpdatedEvent(event, queryClient, user?.id);

      // 4. Se alterou preço ou disponibilidade, emite aviso acessível (aria-live)
      if (updateResult.priceChanged || updateResult.soldOut) {
        const title = updateResult.title || 'Uma obra monitorada';
        let message = `O preço de "${title}" foi atualizado para ${formatEthDisplay(event.data.priceEth)}.`;
        if (updateResult.soldOut) {
          message = `Aviso: As edições de "${title}" acabaram de esgotar.`;
        }

        setActiveNotice({
          id: event.id,
          message,
          type: updateResult.soldOut ? 'warning' : 'info',
          timestamp: Date.now(),
        });
      }
    };

    const onOrderUpdated = (event: OrderUpdatedEvent) => {
      if (!event || !event.id || !event.version || !event.data?.orderId) return;

      // Se o evento é de outro usuário específico, ignora
      if (event.userId && user?.id && event.userId !== user.id) {
        return;
      }

      if (seenEventIds.current.has(event.id)) {
        return;
      }
      seenEventIds.current.add(event.id);

      const resourceKey = `order_${event.data.orderId}`;
      const lastVersion = resourceVersions.current.get(resourceKey) ?? 0;
      if (event.version <= lastVersion) {
        return;
      }
      resourceVersions.current.set(resourceKey, event.version);

      // Reconciliação
      handleOrderUpdatedEvent(event, queryClient, user?.id);

      const statusMap: Record<string, string> = {
        confirmed: 'confirmado com sucesso na rede',
        failed: 'recusado ou cancelado',
        pending: 'está sendo processado na rede',
      };
      const statusText = statusMap[event.data.status] || event.data.status;

      setActiveNotice({
        id: event.id,
        message: `Seu pedido #${event.data.orderId.substring(0, 8)} foi ${statusText}.`,
        type: event.data.status === 'confirmed' ? 'info' : event.data.status === 'failed' ? 'error' : 'warning',
        timestamp: Date.now(),
      });
    };

    // Subscrição dos listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('nft.updated', onNftUpdated);
    socket.on('order.updated', onOrderUpdated);

    if (socket.connected) {
      setIsConnected(true);
    }

    // Liberação de listeners ao desmontar ou trocar usuário
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('nft.updated', onNftUpdated);
      socket.off('order.updated', onOrderUpdated);
    };
  }, [user?.id, token, queryClient, triggerManualSync]);

  // Desconexão total no logout
  useEffect(() => {
    if (!user) {
      // Limpa dados de versão e eventos da sessão anterior
      seenEventIds.current.clear();
      resourceVersions.current.clear();
      disconnectSocket();
    }
  }, [user]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        activeNotice,
        dismissNotice,
        triggerManualSync,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
