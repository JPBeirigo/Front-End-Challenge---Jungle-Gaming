import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { enableMocking } from './mocks/browser';
import './index.css';

// Criação do TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Criação do TanStack Router
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Registra tipos do router para type safety global
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function startApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Elemento root não encontrado no documento.');
  }

  const root = ReactDOM.createRoot(rootElement);

  // Pinta um shell imediato antes de aguardar a ativação dos mocks.
  root.render(
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Roboto Mono', monospace",
        color: '#F5F1EB',
      }}
    >
      <span style={{ opacity: 0.6, fontSize: 14, letterSpacing: '0.1em' }}>KURIO.</span>
    </div>,
  );

  await enableMocking();

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

startApp().catch((err) => {
  console.error('Falha ao inicializar a aplicação:', err);
});