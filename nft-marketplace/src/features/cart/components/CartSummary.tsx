import { useState, type FormEvent } from 'react';
import { AlertCircle, Check, Loader2, Tag, X } from 'lucide-react';
import { formatEthDisplay } from '../../../shared/utils/currency';
import { cn } from '../../../shared/ui/utils';
import type { CouponInfo, ItemVerification } from '../../../shared/types/contracts';

interface CartSummaryProps {
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  couponApplied?: CouponInfo | null;
  itemsVerified?: ItemVerification[];
  isValid?: boolean;
  onApplyCoupon: (code: string) => Promise<unknown>;
  onRemoveCoupon: () => Promise<unknown>;
  onProceedToCheckout?: () => void;
  isUpdating?: boolean;
  isQuoteLoading?: boolean;
  couponError?: unknown;
  onResetCouponError?: () => void;
  className?: string;
}

/**
 * Resumo da carteira no padrão do Figma — 332 de largura,
 * linhas de valores, cupom com borda primary e CTA de finalização.
 */
export function CartSummary({
  subtotalEth,
  discountEth,
  networkFeeEth,
  totalEth,
  couponApplied,
  itemsVerified = [],
  isValid = true,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToCheckout,
  isUpdating = false,
  isQuoteLoading = false,
  couponError,
  onResetCouponError,
  className,
}: CartSummaryProps) {
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;

    onResetCouponError?.();
    setIsApplyingCoupon(true);
    try {
      await onApplyCoupon(code);
      setCouponInput('');
    } catch {
      // Erro gerenciado por couponError
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const hasItemChanged = itemsVerified.some((i) => i.changed || !i.available);
  const errorMessage = (couponError as { message?: string })?.message;
  const isDisabled = !isValid || isUpdating || isQuoteLoading;

  return (
    <aside
      className={cn(
        'flex w-full flex-col gap-6 rounded-[6px] bg-surface-card p-5',
        className,
      )}
      aria-label="Resumo da carteira"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold leading-4 text-foreground">Resumo da carteira</h2>
        {isQuoteLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Atualizando cotação" />
        )}
      </div>

      {(!isValid || hasItemChanged) && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[3px] border border-primary/40 bg-primary/10 p-3 text-[12px] leading-5 text-accent"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Um ou mais itens mudaram de preço ou estoque. Revise o carrinho antes de prosseguir.
          </p>
        </div>
      )}

      {/* Cupom */}
      <div>
        <label htmlFor="coupon-code-input" className="mb-2 block text-[13px] text-secondary">
          Cupom de desconto
        </label>

        {couponApplied ? (
          <div className="flex items-center justify-between gap-2 rounded-[3px] border border-success/40 bg-success/10 px-3 py-2 text-[12px] text-success">
            <span className="flex items-center gap-2 font-bold">
              <Check className="h-3.5 w-3.5" />
              {couponApplied.code} ({couponApplied.discountPercentage}% OFF)
            </span>
            <button
              type="button"
              onClick={() => void onRemoveCoupon()}
              disabled={isUpdating}
              aria-label="Remover cupom"
              className="text-success transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApply}>
            <div
              className={cn(
                'flex h-10 overflow-hidden rounded-[3px] border bg-transparent',
                errorMessage ? 'border-error' : 'border-primary',
              )}
            >
              <input
                id="coupon-code-input"
                type="text"
                placeholder="Código do cupom"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (errorMessage) onResetCouponError?.();
                }}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? 'coupon-error-msg' : undefined}
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13px] uppercase text-foreground outline-none placeholder:normal-case placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={!couponInput.trim() || isApplyingCoupon || isUpdating}
                className="h-full w-[102px] shrink-0 bg-primary text-[12px] font-bold text-ink transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApplyingCoupon ? '...' : 'Aplicar'}
              </button>
            </div>

            {errorMessage && (
              <p id="coupon-error-msg" role="alert" className="mt-2 text-[12px] text-error">
                {errorMessage}
              </p>
            )}
          </form>
        )}
      </div>

      <div className="hairline" />

      {/* Valores */}
      <div className="flex flex-col gap-3 text-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-secondary">Subtotal</span>
          <span className="font-medium text-foreground">{formatEthDisplay(subtotalEth)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-secondary">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Desconto do lançamento
          </span>
          <span className={cn('font-medium', discountEth !== '0' ? 'text-success' : 'text-foreground')}>
            {discountEth === '0' ? '0,0000 ETH' : `-${formatEthDisplay(discountEth)}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex flex-col text-secondary">
            <span>Taxa de rede</span>
            <span className="text-[11px] text-muted">Taxa estimada</span>
          </span>
          <span className="font-medium text-foreground">{formatEthDisplay(networkFeeEth)}</span>
        </div>

        <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-[17px] font-bold text-foreground">Total</span>
          <span className="text-[22px] font-bold leading-4 text-accent">
            {formatEthDisplay(totalEth, false)}{' '}
            <span className="text-[13px] text-secondary">ETH</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={isDisabled}
          className={cn(
            'flex h-10 w-full items-center justify-center rounded-[6px] text-[14px] font-bold transition-colors',
            isDisabled
              ? 'cursor-not-allowed bg-surface-raised text-muted'
              : 'bg-primary text-ink hover:bg-primary-light active:bg-primary-dark',
          )}
        >
          {isQuoteLoading ? 'Calculando...' : 'Conectar e finalizar'}
        </button>

        <a
          href="/#catalog"
          className="text-center text-[13px] text-accent transition-colors hover:text-primary-light"
        >
          Continuar explorando
        </a>
      </div>
    </aside>
  );
}
