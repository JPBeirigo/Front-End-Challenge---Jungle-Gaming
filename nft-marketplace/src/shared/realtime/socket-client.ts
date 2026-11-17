import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

/**
 * Obtém ou inicializa a conexão com o Socket.IO client.
 * Força transporte via WebSocket conforme exigido pelos requisitos de arquitetura.
 */
export function getSocket(token?: string | null): Socket {
  if (!socketInstance) {
    socketInstance = io('/', {
      transports: ['websocket'],
      autoConnect: true,
      auth: token ? { token } : undefined,
    });

    if (token) {
      socketInstance.emit('authenticate', token);
    }
  } else if (token && socketInstance.connected) {
    socketInstance.emit('authenticate', token);
  } else if (token && !socketInstance.connected) {
    socketInstance.auth = { token };
    socketInstance.connect();
    socketInstance.emit('authenticate', token);
  }

  return socketInstance;
}

/**
 * Autentica o socket com o token da sessão ativa.
 */
export function authenticateSocket(token: string): void {
  if (socketInstance && token) {
    socketInstance.emit('authenticate', token);
  }
}

/**
 * Desconecta a instância do socket e limpa todos os listeners para evitar vazamentos de memória.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}
