import {
  ArrowLeft,
  User,
  Wallet as WalletIcon,
  Tag,
  Lock,
  Loader2,
  AlertCircle,
  Key,
} from 'lucide-react';
import { formatEthDisplay, multiplyEth } from '../../../shared/utils/currency';
import { TimeoutAlert } from './TimeoutAlert';
import { cn } from '../../../shared/ui/utils';
import type {
  CartItem,
  CollectorInfo,
  CouponInfo,
  Wallet,
} from '../../../shared/types/contracts';

interface OrderReviewStepProps {
  items: CartItem[];
  collectorInfo: CollectorInfo;
  selectedWallet: Wallet | null;
  selectedNetwork: string;
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  couponApplied?: CouponInfo | null;
  idempotencyKey: string;
  isSubmitting: boolean;
  submissionError: string | null;
  isTimeoutError: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onRetrySameKey: () => void;
  hasInsufficientBalance: boolean;
}

/**
 * Revisão do pedido: coluna de 763 com itens e dados, coluna de 405 com o
 * resumo financeiro e a ação de compra.
 */
export function OrderReviewStep({
  items,
  collectorInfo,
  selectedWallet,
  selectedNetwork,
  subtotalEth,
  discountEth,
  networkFeeEth,
  totalEth,
  couponApplied,
  idempotencyKey,
  isSubmitting,
  submissionError,
  isTimeoutError,
  onBack,
  onSubmit,
  onRetrySameKey,
  hasInsufficientBalance,
}: OrderReviewStepProps) {
  const isDisabled = isSubmitting || hasInsufficientBalance;

  return (
    <div className="space-y-6">
      {isTimeoutError && (
        <TimeoutAlert
          idempotencyKey={idempotencyKey}
          onRetry={onRetrySameKey}
          isSubmitting={isSubmitting}
        />
      )}

      {submissionError && !isTimeoutError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[3px] border border-error/40 bg-error/10 p-3 text-[12px] leading-5 text-error"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submissionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,763px)_405px] lg:justify-between">
        {/* Coluna esquerda */}
        <div className="space-y-6">
          <section aria-labelledby="review-items-heading" className="rounded-[6px] bg-surface-card p-5 sm:p-6">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h2 id="review-items-heading" className="text-[18px] font-bold leading-4 text-foreground">
                Seus NFTs
              </h2>
              <span className="text-[12px] text-muted">Snapshot congelado da transação</span>
            </div>
            <p className="mb-5 text-[13px] leading-5 text-secondary">
              {items.length} {items.length === 1 ? 'item revisado' : 'itens revisados'} antes da
              assinatura.
            </p>

            <ul className="divide-y divide-border/60" role="list">
              {items.map((item) => (
                <li
                  key={`${item.nftId}-${item.editionId}`}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-[58px] w-[58px] shrink-0 rounded-[6px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-bold text-foreground">{item.title}</h3>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {item.creatorName} · Ed. #{item.editionNumber}
                      {item.quantity > 1 ? ` · ${item.quantity}x` : ''}
                    </p>
                    <p className="mt-0.5 text-[11px] text-secondary">
                      {formatEthDisplay(item.priceEth)} / un.
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-muted">
                      Subtotal
                    </span>
                    <strong className="text-[14px] font-bold text-accent">
                      {formatEthDisplay(multiplyEth(item.priceEth, item.quantity))}
                    </strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="review-details-heading" className="rounded-[6px] bg-surface-card p-5 sm:p-6">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h2 id="review-details-heading" className="text-[18px] font-bold leading-4 text-foreground">
                Autorização e titularidade
              </h2>
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-[13px] text-accent transition-colors hover:text-primary-light disabled:opacity-50"
              >
                Editar dados
              </button>
            </div>
            <p className="mb-5 text-[13px] leading-5 text-secondary">
              Confira os dados do colecionador e a carteira que assinará a compra.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[3px] border border-border p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Colecionador
                </div>
                <p className="truncate text-[14px] font-bold text-foreground">
                  {collectorInfo.fullName}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-secondary">{collectorInfo.email}</p>
                {collectorInfo.phone && (
                  <p className="mt-0.5 text-[12px] text-secondary">{collectorInfo.phone}</p>
                )}
              </div>

              <div className="rounded-[3px] border border-border p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
                  <WalletIcon className="h-3.5 w-3.5 text-primary" />
                  Carteira debitada
                </div>
                <p className="truncate text-[14px] font-bold text-foreground">
                  {selectedWallet?.name ?? 'Nenhuma carteira'}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-secondary">
                  {selectedWallet?.address ?? '—'}
                </p>
                <p className="mt-1 text-[11px] font-medium text-accent">{selectedNetwork}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Coluna direita */}
        <aside className="space-y-6 lg:sticky lg:top-24" aria-label="Resumo da transação">
          <div className="rounded-[6px] bg-surface-card p-5">
            <h2 className="text-[18px] font-bold leading-4 text-foreground">Resumo da transação</h2>

            <div className="mt-5 flex flex-col gap-3 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Subtotal dos itens</span>
                <span className="font-medium text-foreground">
                  {formatEthDisplay(subtotalEth)}
                </span>
              </div>

              {couponApplied && (
                <div className="flex items-center justify-between text-success">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Cupom ({couponApplied.code} · -{couponApplied.discountPercentage}%)
                  </span>
                  <span className="font-medium">-{formatEthDisplay(discountEth)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex flex-col text-secondary">
                  <span>Taxa de rede</span>
                  <span className="text-[11px] text-muted">Taxa estimada (gas)</span>
                </span>
                <span className="font-medium text-foreground">
                  {formatEthDisplay(networkFeeEth)}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-[16px] font-bold text-foreground">Total do pedido</span>
                <span className="text-[22px] font-bold leading-4 text-accent">
                  {formatEthDisplay(totalEth, false)}{' '}
                  <span className="text-[12px] font-medium text-secondary">ETH</span>
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 rounded-[3px] border border-border px-3 py-2 font-mono text-[10px] text-muted">
              <span className="flex items-center gap-1.5">
                <Key className="h-3 w-3 text-primary" />
                Idempotency-Key
              </span>
              <span className="max-w-[150px] truncate">{idempotencyKey}</span>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isDisabled}
                className={cn(
                  'flex h-10 w-full items-center justify-center gap-2 rounded-[6px] text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isDisabled
                    ? 'cursor-not-allowed bg-surface-raised text-muted'
                    : 'bg-primary text-ink hover:bg-primary-light active:bg-primary-dark',
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assinando transação...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Confirmar compra
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border border-border text-[13px] font-medium text-secondary transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar e editar
              </button>
            </div>

            {hasInsufficientBalance && (
              <p className="mt-3 text-[11px] leading-4 text-error">
                Saldo insuficiente na carteira selecionada para concluir a compra.
              </p>
            )}
          </div>

          <p className="text-center text-[11px] leading-4 text-muted">
            Ao confirmar, você autoriza o débito em ETH e a emissão do certificado de posse.
          </p>
        </aside>
      </div>
    </div>
  );
}
