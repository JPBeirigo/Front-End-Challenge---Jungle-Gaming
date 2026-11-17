import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, ShoppingBag } from 'lucide-react';
import { useMemo } from 'react';
import { useCart } from '../features/cart/hooks/use-cart';
import { useQuote } from '../features/cart/hooks/use-quote';
import { CartItemRow } from '../features/cart/components/CartItemRow';
import { CartSummary } from '../features/cart/components/CartSummary';
import { CartSummarySkeleton } from '../features/cart/components/CartSummarySkeleton';
import { NftCard } from '../features/catalog/components/NftCard';
import { useNFTs } from '../features/catalog/hooks/use-nfts';
import { useAuth } from '../features/auth/context/use-auth';
import { cartKeys } from '../features/cart/hooks/query-keys';
import { cartApi } from '../shared/api/services';
import type { NFTItem } from '../shared/types/contracts';

export const Route = createFileRoute('/cart')({
  component: CartPageComponent,
});

function CartPageComponent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    items,
    itemCount,
    cart,
    isLoading: isCartLoading,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    isUpdating,
    couponError,
    resetCouponError,
  } = useCart();

  const {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponApplied,
    itemsVerified,
    isValid,
    isLoading: isQuoteLoading,
  } = useQuote({ items, couponCode: cart?.couponCode });

  const { data: suggestionsData } = useNFTs({ sortBy: 'popular', page: 1, limit: 8 });

  const suggestions = useMemo(() => {
    const cartNftIds = new Set(items.map((item) => item.nftId));
    return (suggestionsData?.items ?? []).filter((nft) => !cartNftIds.has(nft.id)).slice(0, 5);
  }, [suggestionsData, items]);

  const addToCartMutation = useMutation({
    mutationFn: (nft: NFTItem) => {
      const edition = nft.editions.find((e) => e.available);
      if (!edition) throw new Error('Sem edição disponível');
      return cartApi.addItem({ nftId: nft.id, editionId: edition.id, quantity: 1 });
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.detail(user?.id), updatedCart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
    },
  });

  const handleProceedToCheckout = () => {
    if (!user) {
      void navigate({ to: '/login', search: { redirect: '/checkout' } });
      return;
    }
    void navigate({ to: '/checkout' });
  };

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Navegação estrutural"
          className="mb-8 flex items-center gap-2 text-[12px] text-muted"
        >
          <Link to="/" className="transition-colors hover:text-accent">
            Início
          </Link>
          <ChevronRight size={12} aria-hidden />
          <a href="/#catalog" className="transition-colors hover:text-accent">
            Mercado
          </a>
          <ChevronRight size={12} aria-hidden />
          <span className="text-secondary">Carrinho</span>
        </nav>

        <h1 className="mb-8 text-[28px] font-bold leading-tight text-foreground">Carrinho</h1>

        {isCartLoading ? (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,782px)_332px] lg:justify-between">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[70px] rounded-[6px] bg-surface-card skeleton-shimmer" />
              ))}
            </div>
            <CartSummarySkeleton />
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-[6px] bg-surface-card px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-raised text-primary">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h2 className="text-[22px] font-bold text-foreground">Seu carrinho está vazio</h2>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-secondary">
              Explore o catálogo para encontrar e colecionar obras de arte digital exclusivas de
              artistas verificados.
            </p>
            <Link to="/" className="btn-primary mt-8 uppercase tracking-[0.04em]">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,782px)_332px] lg:justify-between">
            {/* Tabela */}
            <div>
              <div className="hidden pb-3 text-[13px] text-secondary lg:grid lg:grid-cols-[70px_minmax(0,1fr)_84px_75px_88px_24px] lg:items-center lg:gap-5">
                <span className="col-span-2 font-bold text-foreground">NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span className="sr-only">Remover</span>
              </div>
              <div className="hairline" />

              <div className="divide-y divide-border/40 lg:divide-y-0" role="list" aria-label="Itens no carrinho">
                {items.map((item) => (
                  <div
                    key={`${item.nftId}-${item.editionId}`}
                    role="listitem"
                    className="lg:flex lg:h-[82px] lg:items-center"
                  >
                    <div className="w-full">
                      <CartItemRow
                        item={item}
                        onUpdateQuantity={(nftId, editionId, q) =>
                          void updateQuantity({ nftId, editionId, quantity: q })
                        }
                        onRemove={(nftId, editionId) => void removeItem({ nftId, editionId })}
                        isUpdating={isUpdating}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[12px] text-muted">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'} na carteira · valores fixados em ETH
              </p>
            </div>

            {/* Resumo */}
            <div className="lg:sticky lg:top-24">
              <CartSummary
                subtotalEth={subtotalEth}
                discountEth={discountEth}
                networkFeeEth={networkFeeEth}
                totalEth={totalEth}
                couponApplied={couponApplied}
                itemsVerified={itemsVerified}
                isValid={isValid}
                onApplyCoupon={(code) => applyCoupon(code)}
                onRemoveCoupon={() => removeCoupon()}
                onProceedToCheckout={handleProceedToCheckout}
                isUpdating={isUpdating}
                isQuoteLoading={isQuoteLoading}
                couponError={couponError}
                onResetCouponError={resetCouponError}
              />
            </div>
          </div>
        )}

        {/* Sugestões */}
        {!isCartLoading && suggestions.length > 0 && (
          <section className="mt-16" aria-labelledby="also-seen-heading">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="also-seen-heading" className="text-[22px] font-bold text-foreground">
                Colecionadores também viram
              </h2>
              <a href="/#catalog" className="link-accent inline-flex items-center gap-1 text-[13px]">
                Ver tudo <ArrowRight size={13} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5 xl:gap-[26px]">
              {suggestions.map((nft) => (
                <NftCard
                  key={nft.id}
                  nft={nft}
                  onAddToCart={(n) => addToCartMutation.mutate(n)}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-3" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="h-3 w-3 rounded-full border border-primary/50" />
              <span className="h-3 w-3 rounded-full border border-primary/50" />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
