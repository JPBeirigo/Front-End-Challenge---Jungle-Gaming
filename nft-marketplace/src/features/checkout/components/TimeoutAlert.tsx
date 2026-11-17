import { Clock, RefreshCw, Key } from 'lucide-react';

interface TimeoutAlertProps {
  idempotencyKey: string;
  onRetry: () => void;
  isSubmitting?: boolean;
}

/**
 * Alerta de timeout com reenvio seguro via chave de idempotência.
 */
export function TimeoutAlert({ idempotencyKey, onRetry, isSubmitting }: TimeoutAlertProps) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-[6px] border border-primary/40 bg-primary/10 p-4 text-[12px] leading-5 text-accent"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <strong className="block text-[14px] font-bold text-foreground">
            Tempo limite excedido (HTTP 408)
          </strong>
          <p className="mt-1 text-secondary">
            A confirmação do pedido demorou mais que o habitual. Graças à política de idempotência,
            você pode reenviar a requisição sem risco de criar uma compra duplicada.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-primary/20 pt-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
          <Key className="h-3.5 w-3.5 text-primary" />
          <span>Chave: {idempotencyKey.slice(0, 18)}...</span>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isSubmitting}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[3px] bg-primary px-4 text-[12px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Reenviando...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </>
          )}
        </button>
      </div>
    </div>
  );
}
