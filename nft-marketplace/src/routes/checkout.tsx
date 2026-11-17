import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { ProtectedRoute } from '../features/auth/components/protected-route';
import { useCheckout } from '../features/checkout/hooks/use-checkout';
import { CheckoutSteps } from '../features/checkout/components/CheckoutSteps';
import { CollectorForm } from '../features/checkout/components/CollectorForm';
import { WalletSelector } from '../features/checkout/components/WalletSelector';
import { OrderReviewStep } from '../features/checkout/components/OrderReviewStep';
import { PriceChangeModal } from '../features/checkout/components/PriceChangeModal';
import { formatEthDisplay } from '../shared/utils/currency';

export const Route = createFileRoute('/checkout')({
  component: CheckoutRouteComponent,
});

function CheckoutRouteComponent() {
  return (
    <ProtectedRoute>
      <CheckoutView />
    </ProtectedRoute>
  );
}

function CheckoutView() {
  const {
    step,
    collectorInfo,
    setCollectorInfo,
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    selectedNetwork,
    setSelectedNetwork,
    isWalletConnected,
    isConnectingWallet,
    simulateWalletRefusal,
    setSimulateWalletRefusal,
    walletError,
    hasInsufficientBalance,
    handleConnectWallet,
    handleDisconnectWallet,
    items,
    itemCount,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    couponApplied,
    isCartLoading,
    isWalletsLoading,
    isSubmitting,
    submissionError,
    isTimeoutError,
    idempotencyKey,
    quoteChange,
    handleProceedToReview,
    handleBackToDetails,
    submitOrder,
    handleAcceptNewQuote,
    handleRejectNewQuote,
    handleRetrySameKey,
    selectedWallet,
  } = useCheckout();

  if (isCartLoading || isWalletsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink py-12">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-[12px] text-muted">Carregando dados da transação...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ink py-16 text-foreground">
        <div className="container max-w-lg text-center">
          <div className="rounded-[6px] bg-surface-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised text-primary">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="text-[22px] font-bold text-foreground">Seu carrinho está vazio</h1>
            <p className="mt-2 text-[13px] leading-6 text-secondary">
              Adicione itens ao carrinho antes de prosseguir com o pagamento.
            </p>
            <Link to="/" className="btn-primary mt-6 uppercase tracking-[0.04em]">
              Explorar catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="container py-8">
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
          <span className="text-secondary">Pagamento</span>
        </nav>

        <h1 className="mb-6 text-[28px] font-bold leading-tight text-foreground">Pagamento</h1>

        <CheckoutSteps currentStep={step} />

        {quoteChange && (
          <PriceChangeModal
            quoteChange={quoteChange}
            onAccept={handleAcceptNewQuote}
            onReject={handleRejectNewQuote}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 'details' ? (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,763px)_405px] lg:justify-between">
            <div className="space-y-6">
              {submissionError && (
                <div
                  role="alert"
                  className="rounded-[3px] border border-error/40 bg-error/10 p-4 text-[13px] text-error"
                >
                  {submissionError}
                </div>
              )}

              <CollectorForm collectorInfo={collectorInfo} onChange={setCollectorInfo} />

              <WalletSelector
                wallets={wallets}
                selectedWalletId={selectedWalletId}
                onSelectWallet={setSelectedWalletId}
                selectedNetwork={selectedNetwork}
                onSelectNetwork={setSelectedNetwork}
                isConnected={isWalletConnected}
                isConnecting={isConnectingWallet}
                onConnect={handleConnectWallet}
                onDisconnect={handleDisconnectWallet}
                simulateRefusal={simulateWalletRefusal}
                onToggleSimulateRefusal={setSimulateWalletRefusal}
                walletError={walletError}
                hasInsufficientBalance={hasInsufficientBalance}
                totalEth={totalEth}
              />
            </div>

            {/* Seus NFTs */}
            <aside className="space-y-6 lg:sticky lg:top-24" aria-label="Seus NFTs">
              <div className="rounded-[6px] bg-surface-card p-5">
                <h2 className="text-[18px] font-bold leading-4 text-foreground">Seus NFTs</h2>

                <ul className="mt-5 space-y-3" role="list">
                  {items.map((item) => (
                    <li
                      key={`${item.nftId}-${item.editionId}`}
                      className="flex items-center gap-3"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-[58px] w-[58px] shrink-0 rounded-[6px] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-foreground">
                          {item.title}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          Ed. #{item.editionNumber}
                          {item.quantity > 1 ? ` (x ${item.quantity})` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] font-bold text-accent">
                        {formatEthDisplay(item.priceEth)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-secondary">Subtotal</span>
                    <span className="text-foreground">{formatEthDisplay(subtotalEth)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-success">
                      <span>Cupom ({couponApplied.code})</span>
                      <span>-{formatEthDisplay(discountEth)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-secondary">Taxa de rede</span>
                    <span className="text-foreground">{formatEthDisplay(networkFeeEth)}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
                    <span className="text-[16px] font-bold text-foreground">Total</span>
                    <span className="text-[20px] font-bold text-accent">
                      {formatEthDisplay(totalEth, false)}{' '}
                      <span className="text-[12px] text-secondary">ETH</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="mt-5 flex h-10 w-full items-center justify-center rounded-[6px] bg-primary text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark"
                >
                  Revisar pedido
                </button>

                <p className="mt-3 text-center text-[11px] text-muted">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'} · valores em ETH
                </p>
              </div>

              <Link
                to="/cart"
                className="block text-center text-[13px] text-accent transition-colors hover:text-primary-light"
              >
                Voltar ao carrinho
              </Link>
            </aside>
          </div>
        ) : (
          <OrderReviewStep
            items={items}
            collectorInfo={collectorInfo}
            selectedWallet={selectedWallet}
            selectedNetwork={selectedNetwork}
            subtotalEth={subtotalEth}
            discountEth={discountEth}
            networkFeeEth={networkFeeEth}
            totalEth={totalEth}
            couponApplied={couponApplied}
            idempotencyKey={idempotencyKey}
            isSubmitting={isSubmitting}
            submissionError={submissionError}
            isTimeoutError={isTimeoutError}
            onBack={handleBackToDetails}
            onSubmit={() => void submitOrder()}
            onRetrySameKey={handleRetrySameKey}
            hasInsufficientBalance={hasInsufficientBalance}
          />
        )}
      </div>
    </div>
  );
}
