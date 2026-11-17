import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import { mockSocketEmitter } from './emitter';

/**
 * WebSocket Link do MSW para interceptar conexões do socket.io-client.
 * Intercepta qualquer rota correspondente a /socket.io/
 */
export const socketIoLink = ws.link(/.*\/socket\.io\/.*/);

export const socketIoHandler = socketIoLink.addEventListener('connection', (connection) => {
  const duplex = toSocketIo(connection);
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Registra o cliente ativo no emissor do mock
  mockSocketEmitter.registerClient(
    clientId,
    (event: string, ...data: unknown[]) => {
      duplex.client.emit(event, ...data);
    }
  );

  // Escuta autenticação do cliente para associar ao userId
  duplex.client.on('authenticate', (_event, token: string) => {
    if (token) {
      // Se o token for por exemplo "token_user_1", extrai "user_1"
      const userId = token.replace('token_', '');
      mockSocketEmitter.setClientUser(clientId, userId);
    }
  });

  // Escuta ping para manter a conexão saudável se necessário
  duplex.client.on('ping', () => {
    duplex.client.emit('pong', { timestamp: Date.now() });
  });

  // Limpa o cliente quando a conexão for encerrada
  connection.client.addEventListener('close', () => {
    mockSocketEmitter.unregisterClient(clientId);
  });
});

export { mockSocketEmitter } from './emitter';
