import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AuthProvider } from '../features/auth/context';
import { RealtimeProvider } from '../shared/realtime/realtime-context';
import { RealtimeAlert } from '../shared/realtime/realtime-alert';
import { Navbar } from '../shared/ui/navbar';
import { Footer } from '../shared/ui/footer';
import { NotFoundComponent } from '../shared/ui/not-found';
import { ScenarioSelector } from '../shared/ui/scenario-selector';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundComponent,
});

function RootLayout() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
          {/* Link para pular direto para o conteúdo (Acessibilidade WCAG) */}
          <a
            href="#main-content"
            onClick={(e) => {
              e.preventDefault();
              const main = document.getElementById('main-content');
              if (main) {
                main.focus();
                main.scrollIntoView();
              }
            }}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-[6px] focus:font-bold focus:text-xs focus:shadow-2xl focus:ring-2 focus:ring-primary-foreground"
          >
            Pular para o conteúdo principal
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
            <Outlet />
          </main>
          <Footer />
          <ScenarioSelector />
          <RealtimeAlert />
        </div>
      </RealtimeProvider>
    </AuthProvider>
  );
}
