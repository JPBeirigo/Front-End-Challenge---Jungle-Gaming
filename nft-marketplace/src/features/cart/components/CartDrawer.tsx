import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, ShoppingBag, X } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCart } from '../hooks/use-cart';
import { useQuote } from '../hooks/use-quote';
import { CartItemRow } from './CartItemRow';
import { CartSummarySkeleton } from './CartSummarySkeleton';
import { formatEthDisplay } from '../../../shared/utils/currency';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Drawer do carrinho no padrão dark quente do Figma.
 */
export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    cart,
    isLoading: isCartLoading,
    updateQuantity,
    removeItem,
    isUpdating,
  } = useCart();

  const {
    totalEth,
    isValid,
    isLoading: isQuoteLoading,
  } = useQuote({ items, couponCode: cart?.couponCode });

  const handleProceed = () => {
    onOpenChange(false);
    void navigate({ to: '/cart' });
  };

  const isDisabled = !isValid || isUpdating || isQuoteLoading;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-deep/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface-card p-5 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300 sm:max-w-md sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <Dialog.Title className="text-[18px] font-bold leading-4 text-foreground">
                Seu carrinho ({itemCount})
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar carrinho"
                className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {isCartLoading ? (
              <CartSummarySkeleton />
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised text-muted">
                  <ShoppingBag className="h-8 w-8 opacity-60" />
                </div>
                <h3 className="mb-1 text-[16px] font-bold text-foreground">Carrinho vazio</h3>
                <p className="mx-auto mb-6 max-w-xs text-[12px] leading-5 text-secondary">
                  Selecione obras exclusivas no catálogo para adicionar ao seu acervo.
                </p>
                <Dialog.Close asChild>
                  <Link
                    to="/"
                    className="btn-primary uppercase tracking-[0.04em]"
                  >
                    Explorar catálogo
                  </Link>
                </Dialog.Close>
              </div>
            ) : (
              items.map((item) => (
                <CartItemRow
                  key={`${item.nftId}-${item.editionId}`}
                  item={item}
                  onUpdateQuantity={(nftId, editionId, q) =>
                    void updateQuantity({ nftId, editionId, quantity: q })
                  }
                  onRemove={(nftId, editionId) => void removeItem({ nftId, editionId })}
                  isUpdating={isUpdating}
                />
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-secondary">Total estimado</span>
                <span className="text-[22px] font-bold leading-4 text-accent">
                  {formatEthDisplay(totalEth, false)}{' '}
                  <span className="text-[12px] font-medium text-secondary">ETH</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Dialog.Close asChild>
                  <Link
                    to="/cart"
                    className="flex h-10 items-center justify-center gap-1.5 rounded-[6px] border border-border text-[13px] font-bold text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    <span>Ver carrinho</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Dialog.Close>

                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={isDisabled}
                  className="flex h-10 items-center justify-center rounded-[6px] bg-primary text-[13px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
