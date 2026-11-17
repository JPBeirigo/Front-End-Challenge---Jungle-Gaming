import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { socketIoHandler } from './socket';

export const worker = setupWorker(...handlers, socketIoHandler);

export async function enableMocking() {
  // Ativa mocks por padrão no desenvolvimento, preview e demo público, a não ser que explicitamente desativado via VITE_ENABLE_MOCKS=false
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') {
    return;
  }

  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}
