import { useEffect } from 'react';
import { AlertCircle, Bell, X } from 'lucide-react';
import { useRealtime } from './use-realtime';
import { cn } from '../ui/utils';

/**
 * Banner acessível e flutuante para notificações e atualizações em tempo real.
 * Renderiza com `role="status"` e `aria-live="polite"` para leitores de tela.
 */
export function RealtimeAlert() {
  const { activeNotice, dismissNotice } = useRealtime();

  useEffect(() => {
    if (!activeNotice) return;
    const timer = setTimeout(() => {
      dismissNotice();
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeNotice, dismissNotice]);

  if (!activeNotice) return null;

  const isWarning = activeNotice.type === 'warning';
  const isError = activeNotice.type === 'error';

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 right-6 z-50 w-full max-w-sm px-4 animate-in slide-in-from-bottom-3 fade-in duration-200 sm:max-w-md"
    >
      <div
        className={cn(
          'pointer-events-auto flex items-start gap-3 rounded-[6px] border p-4 shadow-2xl backdrop-blur-md',
          isWarning && 'border-primary/40 bg-surface-card/95 text-accent',
          isError && 'border-error/40 bg-surface-card/95 text-error',
          !isWarning && !isError && 'border-border bg-surface-card/95 text-foreground',
        )}
      >
        <div className="mt-0.5 shrink-0">
          {isWarning && <AlertCircle className="h-5 w-5 text-primary" />}
          {isError && <AlertCircle className="h-5 w-5 text-error" />}
          {!isWarning && !isError && <Bell className="h-5 w-5 text-accent" />}
        </div>

        <div className="flex-1 space-y-1 text-[12px] leading-5">
          <p className="font-bold tracking-tight">Atualização em tempo real</p>
          <p className="opacity-90">{activeNotice.message}</p>
        </div>

        <button
          type="button"
          onClick={dismissNotice}
          aria-label="Dispensar aviso em tempo real"
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
