import { useEffect } from 'react';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { formatEthDisplay } from '../../../shared/utils/currency';
import type { QuoteChangeDetails } from '../hooks/use-checkout';

interface PriceChangeModalProps {
  quoteChange: QuoteChangeDetails;
  onAccept: () => void;
  onReject: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal de cotação atualizada, no padrão dark quente do Figma.
 */
export function PriceChangeModal({
  quoteChange,
  onAccept,
  onReject,
  isSubmitting,
}: PriceChangeModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onReject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onReject]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-change-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-[6px] bg-surface-card p-6 shadow-[0_24px_60px_-20px_rgba(14,9,7,0.6)] sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 id="price-change-title" className="text-[18px] font-bold leading-5 text-foreground">
              Cotação atualizada durante a compra
            </h3>
            <p className="mt-1.5 text-[12px] leading-5 text-secondary">
              Os preços de mercado ou a disponibilidade das edições mudaram enquanto você preparava
              o pedido.
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2.5 rounded-[3px] border border-border p-4 text-[12px] leading-5">
          {quoteChange.hasUnavailableItems && (
            <div className="flex items-start gap-2 text-error">
              <span className="font-bold">Edições esgotadas:</span>
              <span>{quoteChange.unavailableItemTitles.join(', ')}</span>
            </div>
          )}

          {quoteChange.changedPriceTitles.length > 0 && (
            <div className="flex items-start gap-2 text-accent">
              <span className="font-bold">Preço atualizado:</span>
              <span>{quoteChange.changedPriceTitles.join(', ')}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <div>
              <span className="block text-[11px] text-muted">Total anterior</span>
              <span className="line-through text-muted">
                {formatEthDisplay(quoteChange.previousTotalEth)}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
            <div className="text-right">
              <span className="block text-[11px] font-bold text-secondary">Novo total</span>
              <strong className="text-[18px] font-bold text-accent">
                {formatEthDisplay(quoteChange.newTotalEth)}
              </strong>
            </div>
          </div>
        </div>

        <p className="mb-6 text-[12px] leading-5 text-secondary">
          Para prosseguir, autorize explicitamente os novos valores apurados pela rede.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onReject}
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-[3px] border border-border px-4 text-[13px] text-secondary transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50 sm:w-auto"
          >
            Voltar ao carrinho
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[3px] bg-primary px-5 text-[13px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Processando...
              </>
            ) : (
              'Aceitar nova cotação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
