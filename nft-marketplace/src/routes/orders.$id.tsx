import type { ReactNode } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Wallet as WalletIcon,
  ArrowRight,
  X,
} from 'lucide-react';
import { ProtectedRoute } from '../features/auth/components/protected-route';
import { useOrder } from '../features/checkout/hooks/use-order';
import { formatEthDisplay } from '../shared/utils/currency';
import { AppApiError } from '../shared/api/errors';
import { cn } from '../shared/ui/utils';

export const Route = createFileRoute('/orders/$id')({
  component: OrderReceiptRouteComponent,
});

function OrderReceiptRouteComponent() {
  return (
    <ProtectedRoute>
      <OrderReceiptView />
    </ProtectedRoute>
  );
}

/** Backdrop escuro com o marketplace desfocado atrás do modal. */
function OrdersShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 isolate overflow-y-auto bg-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="container py-10">
          <div className="flex items-center justify-between border-b border-primary/20 pb-4">
            <span className="text-lg font-bold tracking-[0.1em] text-foreground/60">KURIO.</span>
            <div className="hidden items-center gap-10 text-[15px] text-secondary/40 md:flex">
              <span>Início</span>
              <span>Mercado</span>
              <span>Criadores</span>
              <span>Aprenda</span>
            </div>
            <span className="h-[35px] w-[100px] rounded-[6px] bg-primary/30" />
          </div>
          <div className="mt-12 space-y-3">
            <div className="h-10 w-2/3 rounded-sm bg-surface-raised/50" />
            <div className="h-10 w-1/2 rounded-sm bg-surface-raised/40" />
          </div>
          <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[258/300] rounded-[6px] bg-surface-card/70" />
                <div className="h-4 w-3/4 rounded-sm bg-surface-raised/40" />
                <div className="h-4 w-1/3 rounded-sm bg-primary/20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-ink/90 backdrop-blur-[2px]" aria-hidden />

      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-12">
        <div className={cn('w-full', wide ? 'max-w-[578px]' : 'max-w-[500px]')}>{children}</div>
      </div>
    </div>
  );
}

/** Moldura do modal: surface-card, X de fechar e faixa primary de 10px. */
function OrderModal({
  children,
  labelledBy,
}: {
  children: ReactNode;
  labelledBy: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="relative flex flex-col overflow-hidden rounded-[6px] bg-surface-card shadow-[0_24px_60px_-20px_rgba(14,9,7,0.6)]"
    >
      <Link
        to="/"
        aria-label="Fechar"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-4 w-4" />
      </Link>

      <div className="px-6 py-8 sm:px-10">{children}</div>

      <div className="h-[10px] w-full shrink-0 bg-primary" aria-hidden />
    </div>
  );
}

function OrderReceiptView() {
  const { id } = useParams({ from: '/orders/$id' });
  const { order, isLoading, isError, error, refetch, isFetching } = useOrder(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-ink py-16">
        <div className="space-y-4 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-[12px] text-muted">Carregando recibo da transação...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    let errorMessage = 'Não foi possível carregar o recibo deste pedido.';
    if (error instanceof AppApiError) {
      if (error.status === 404) errorMessage = 'Pedido não encontrado no acervo.';
      if (error.status === 403)
        errorMessage = 'Você não tem permissão para visualizar este pedido.';
    }

    return (
      <OrdersShell>
        <OrderModal labelledBy="order-error-title">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-error/10 text-error">
              <XCircle className="h-10 w-10" />
            </div>
            <h1 id="order-error-title" className="text-[22px] font-bold text-foreground">
              Erro ao consultar pedido
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-secondary">{errorMessage}</p>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void refetch()}
                className="flex h-10 w-full items-center justify-center rounded-[5px] bg-primary text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark"
              >
                Tentar novamente
              </button>
              <Link
                to="/"
                className="flex h-10 w-full items-center justify-center rounded-[5px] border border-border text-[13px] font-medium text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
              >
                Ir para o catálogo
              </Link>
            </div>
          </div>
        </OrderModal>
      </OrdersShell>
    );
  }

  // ── Pedido pendente ────────────────────────────────────────────────────────
  if (order.status === 'pending') {
    return (
      <OrdersShell>
        <OrderModal labelledBy="order-pending-title">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-10 w-10" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              Transação em andamento
            </span>
            <h1
              id="order-pending-title"
              className="mt-1.5 text-[22px] font-bold leading-tight text-foreground"
            >
              Aguardando confirmação na blockchain
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-secondary">
              O pedido #{order.id} foi transmitido aos nós da rede {order.network}. O status será
              atualizado em tempo real assim que o bloco for validado.
            </p>
          </div>

          <dl className="mt-6 divide-y divide-border/60 rounded-[3px] border border-border px-4 py-3 text-[12px]">
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-secondary">Identificador</dt>
              <dd className="truncate font-mono text-foreground">{order.id}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-secondary">Carteira</dt>
              <dd className="truncate font-mono text-foreground">{order.walletAddress}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-secondary">Total</dt>
              <dd className="font-bold text-accent">{formatEthDisplay(order.totalEth)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-muted">
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            <span>Sincronizando com a rede...</span>
          </div>
        </OrderModal>
      </OrdersShell>
    );
  }

  // ── Pedido recusado ────────────────────────────────────────────────────────
  if (order.status === 'failed') {
    return (
      <OrdersShell>
        <OrderModal labelledBy="order-failed-title">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-error/10 text-error">
              <XCircle className="h-10 w-10" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-error">
              Status terminal
            </span>
            <h1
              id="order-failed-title"
              className="mt-1.5 text-[22px] font-bold leading-tight text-foreground"
            >
              Transação não autorizada
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-secondary">
              O pagamento do pedido #{order.id} foi recusado na rede.
            </p>
          </div>

          <div className="mt-6 rounded-[3px] border border-error/40 bg-error/10 p-3.5 text-[12px] leading-5 text-error">
            <strong className="mb-1 block font-bold text-foreground">Motivo da recusa</strong>
            <p>
              {order.failureReason ||
                'A transação não pôde ser completada devido a saldo insuficiente ou rejeição da carteira.'}
            </p>
          </div>

          <div className="mt-4 rounded-[3px] border border-border p-3.5 text-[12px] leading-5 text-secondary">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Seu carrinho foi preservado
            </div>
            Nenhum item foi removido. Você pode voltar, selecionar outra carteira ou rede e tentar
            novamente com segurança.
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/cart"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[5px] bg-primary text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark"
            >
              <ShoppingBag className="h-4 w-4" />
              Voltar ao carrinho
            </Link>
            <Link
              to="/"
              className="flex h-10 w-full items-center justify-center rounded-[5px] border border-border text-[13px] font-medium text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
            >
              Ir para o início
            </Link>
          </div>
        </OrderModal>
      </OrdersShell>
    );
  }

  // ── Pedido confirmado ──────────────────────────────────────────────────────
  const date = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <OrdersShell wide>
      <OrderModal labelledBy="order-confirmed-title">
        {/* Ícone de sucesso 80 */}
        <div className="text-center">
          <div className="mx-auto flex h-[80px] w-[80px] items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1
            id="order-confirmed-title"
            className="mt-4 text-[24px] font-bold leading-tight text-foreground"
          >
            Compra confirmada
          </h1>
          <p className="mt-1.5 text-[13px] leading-5 text-secondary">
            As edições foram emitidas e atribuídas à sua custódia.
          </p>
        </div>

        {/* Faixa de metadados em 4 colunas */}
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[3px] border border-border px-4 py-3 sm:grid-cols-4">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">Pedido</dt>
            <dd className="mt-0.5 truncate font-mono text-[12px] text-foreground">{order.id}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">Data</dt>
            <dd className="mt-0.5 text-[12px] text-foreground">{date}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">Rede</dt>
            <dd className="mt-0.5 truncate text-[12px] text-foreground">{order.network}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted">Itens</dt>
            <dd className="mt-0.5 text-[12px] text-foreground">{order.items.length}</dd>
          </div>
        </dl>

        {/* Itens */}
        <ul className="mt-6 divide-y divide-border/60" role="list">
          {order.items.map((item) => (
            <li key={`${item.nftId}-${item.editionId}`} className="flex items-center gap-4 py-3">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-[70px] w-[70px] shrink-0 rounded-[6px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[14px] font-bold text-foreground">{item.title}</h2>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {item.creatorName} · Ed. #{item.editionNumber}
                  {item.quantity > 1 ? ` · ${item.quantity}x` : ''}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-secondary">
                  {formatEthDisplay(item.unitPriceEth)} / un.
                </p>
              </div>
              <span className="shrink-0 text-[14px] font-bold text-accent">
                {formatEthDisplay(item.subtotalEth)}
              </span>
            </li>
          ))}
        </ul>

        {/* Valores */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-secondary">Subtotal</span>
            <span className="font-medium text-foreground">
              {formatEthDisplay(order.subtotalEth)}
            </span>
          </div>
          {order.discountEth !== '0.0000' && (
            <div className="flex items-center justify-between text-success">
              <span>Desconto</span>
              <span className="font-medium">-{formatEthDisplay(order.discountEth)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-secondary">Taxa de rede</span>
            <span className="font-medium text-foreground">
              {formatEthDisplay(order.networkFeeEth)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-[16px] font-bold text-foreground">Total</span>
            <span className="text-[22px] font-bold leading-4 text-accent">
              {formatEthDisplay(order.totalEth, false)}{' '}
              <span className="text-[12px] font-medium text-secondary">ETH</span>
            </span>
          </div>
        </div>

        {/* Comprovante */}
        <div className="mt-4 rounded-[3px] border border-border px-3.5 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">Hash da transação</p>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[11px] text-foreground">
              {order.transactionHash || '0xSimulatedHash'}
            </span>
            <span className="shrink-0 text-[10px] text-secondary">
              <WalletIcon className="mr-1 inline h-3 w-3" />
              {order.walletAddress}
            </span>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-secondary">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          Transação confirmada na {order.network}
        </p>

        <div className="mt-5 flex flex-col items-center gap-3">
          <a
            href={`https://etherscan.io/tx/${order.transactionHash || 'simulated'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-[186px] items-center justify-center gap-2 rounded-[5px] bg-primary text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark"
          >
            Ver no Etherscan
            <ExternalLink className="h-4 w-4" />
          </a>

          <div className="flex items-center gap-3 text-[13px]">
            <Link to="/" className="link-accent inline-flex items-center gap-1">
              Continuar explorando <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-border" aria-hidden>
              |
            </span>
            <Link to="/wallets" className="text-secondary transition-colors hover:text-accent">
              Minhas carteiras
            </Link>
          </div>
        </div>
      </OrderModal>
    </OrdersShell>
  );
}
