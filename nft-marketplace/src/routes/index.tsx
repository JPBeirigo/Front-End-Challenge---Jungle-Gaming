import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { NftCard } from '../features/catalog/components/NftCard';
import { NftCardSkeleton } from '../features/catalog/components/NftCardSkeleton';
import { useNFTs } from '../features/catalog/hooks/use-nfts';
import { cartKeys } from '../features/cart/hooks/query-keys';
import { cartApi } from '../shared/api/services';
import type { NFTItem, NFTCategory, NFTSortBy } from '../shared/types/contracts';
import { useAuth } from '../features/auth/context/use-auth';
import { cn } from '../shared/ui/utils';

// ── Esquema de parâmetros de busca na URL ──────────────────────────────────────
const catalogSearchSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['all', 'art', 'collectibles', 'photography', 'virtual-worlds']).optional(),
  sortBy: z.enum(['popular', 'price_asc', 'price_desc', 'newest']).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: CatalogPage,
});

const CATEGORIES: { value: NFTCategory; label: string }[] = [
  { value: 'all', label: 'Todas as coleções' },
  { value: 'art', label: 'Arte' },
  { value: 'collectibles', label: 'Colecionáveis' },
  { value: 'photography', label: 'Fotografia' },
  { value: 'virtual-worlds', label: 'Mundos Virtuais' },
];

const SORT_OPTIONS: { value: NFTSortBy; label: string }[] = [
  { value: 'newest', label: 'Listados recentemente' },
  { value: 'popular', label: 'Populares' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
];

const PRICE_MAX = 15;

function CatalogPage() {
  const navigate = useNavigate({ from: '/' });
  const search = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const filters = {
    search: search.search,
    category: search.category ?? 'all',
    sortBy: search.sortBy ?? 'popular',
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    page: search.page ?? 1,
    limit: search.limit ?? 12,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useNFTs(filters);

  // Consulta auxiliar para contagens de coleção (catálogo completo)
  const { data: allCatalog } = useNFTs({
    category: 'all',
    sortBy: 'popular',
    page: 1,
    limit: 50,
  });

  const [priceMin, setPriceMin] = useState(Number(search.minPrice) || 0.02);
  const [priceMax, setPriceMax] = useState(Number(search.maxPrice) || 12.3);

  useEffect(() => {
    setPriceMin(Number(search.minPrice) || 0.02);
    setPriceMax(Number(search.maxPrice) || 12.3);
  }, [search.minPrice, search.maxPrice]);

  const setCategory = (category: NFTCategory) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        category: category === 'all' ? undefined : category,
        page: 1,
      }),
    });
  };

  const setSort = (sortBy: NFTSortBy | undefined) => {
    void navigate({ search: (prev) => ({ ...prev, sortBy, page: 1 }) });
  };

  const applyPriceFilter = (e?: FormEvent) => {
    e?.preventDefault();
    void navigate({
      search: (prev) => ({
        ...prev,
        minPrice: priceMin > 0.02 ? priceMin.toFixed(2) : undefined,
        maxPrice: priceMax < 12.3 ? priceMax.toFixed(2) : undefined,
        page: 1,
      }),
    });
  };

  const clearAllFilters = () => {
    setPriceMin(0.02);
    setPriceMax(12.3);
    void navigate({ search: () => ({ page: 1 }) });
  };

  const hasActiveFilters = Boolean(
    search.search ||
      (search.category && search.category !== 'all') ||
      search.minPrice ||
      search.maxPrice ||
      (search.sortBy && search.sortBy !== 'popular'),
  );

  const setPage = (page: number) => {
    void navigate({ search: (prev) => ({ ...prev, page }) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adicionar ao carrinho
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

  const nfts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = filters.page;
  const featured = nfts.filter((n) => n.featured);
  const heroNft = featured[0] ?? nfts[0];
  const sidebarFeatured = featured[1] ?? featured[0] ?? nfts[1] ?? nfts[0];
  const blogPosts = nfts.slice(0, 4);
  const skeletonCount = filters.limit;

  const catalogItems = allCatalog?.items ?? nfts;
  const countFor = (category: NFTCategory) => {
    if (category === 'all') return allCatalog?.total ?? data?.total ?? 0;
    return catalogItems.filter((nft) => nft.category === category).length;
  };

  const activeTab: 'all' | 'new' | 'popular' =
    search.sortBy === 'newest' ? 'new' : search.sortBy === 'popular' ? 'popular' : 'all';

  const priceLeft = (priceMin / PRICE_MAX) * 100;
  const priceRight = 100 - (priceMax / PRICE_MAX) * 100;

  return (
    <div className="min-h-screen bg-ink text-foreground">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary/[0.06] blur-3xl"
        />
        <div className="container grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,600px)_450px] lg:justify-between lg:gap-[110px]">
          <div className="max-w-[600px]">
            <span className="eyebrow inline-flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Marketplace de arte digital
            </span>

            <h1 className="mt-4 text-[32px] font-bold uppercase leading-[1.25] tracking-tight text-brand-cream sm:text-[38px] lg:text-[43px] lg:leading-[70px]">
              Arte que existe
              <br />
              para <span className="text-accent">ser colecionada</span>
            </h1>

            <p className="mt-5 max-w-[557px] text-sm leading-6 text-brand-gold">
              Edições verificadas, criadores independentes e uma curadoria que respeita o seu
              olhar. Descubra obras digitais únicas e construa um acervo com história.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary min-w-[140px] uppercase tracking-[0.04em]"
              >
                Explorar
              </button>
              <a href="#blog" className="btn-outline">
                Ler o diário
              </a>
            </div>

            <div className="mt-10 flex items-center gap-2" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-brand-border" />
              <span className="h-2 w-2 rounded-full bg-brand-border" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[450px]">
            <div className="absolute -inset-3 rounded-[30px] border border-primary/15" aria-hidden />
            {heroNft ? (
              <div className="relative aspect-[366/190] overflow-hidden rounded-[24px] bg-surface-card sm:aspect-square">
                <img
                  src={heroNft.imageUrl}
                  alt={heroNft.title}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-5 pt-16">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-brand-gold">
                    Em destaque
                  </p>
                  <p className="mt-1 truncate text-base font-bold text-brand-cream">
                    {heroNft.title}
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-[366/190] w-full rounded-[24px] bg-gradient-to-br from-primary/20 to-surface-card skeleton-shimmer sm:aspect-square" />
            )}
          </div>
        </div>
      </section>

      {/* ── Catálogo ──────────────────────────────────────────────────────────── */}
      <section id="catalog" className="container py-16 lg:py-24" aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
          {/* ── Sidebar de filtros ───────────────────────────────────────────── */}
          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[6px] bg-surface-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-brand-cream">Filtros</h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-muted transition-colors hover:text-accent"
                  >
                    <X size={12} /> Limpar
                  </button>
                )}
              </div>
              <div className="mt-4 h-px w-full bg-brand-border" />

              {/* Coleções */}
              <div className="mt-8">
                <h3 className="text-[15px] font-bold text-brand-cream">Coleções</h3>
                <ul className="mt-4 space-y-1">
                  {CATEGORIES.map(({ value, label }) => {
                    const isActive = (filters.category ?? 'all') === value;
                    return (
                      <li key={value}>
                        <button
                          type="button"
                          onClick={() => setCategory(value)}
                          aria-pressed={isActive}
                          className={cn(
                            'flex w-full items-center justify-between rounded-sm py-2 text-left text-[15px] leading-6 transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            isActive
                              ? 'font-medium text-accent'
                              : 'text-brand-gold hover:text-brand-cream',
                          )}
                        >
                          <span>{label}</span>
                          <span className={cn('text-xs', isActive ? 'font-bold text-accent' : 'text-brand-sand')}>
                            {countFor(value)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="my-8 h-px w-full bg-brand-border" />

              {/* Faixa de preço */}
              <form onSubmit={applyPriceFilter}>
                <h3 className="text-[15px] font-bold text-brand-cream">Faixa de preço</h3>

                <div className="relative mt-6 h-4">
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-border" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
                    style={{ left: `${priceLeft}%`, right: `${priceRight}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={PRICE_MAX}
                    step={0.01}
                    value={priceMin}
                    onChange={(e) =>
                      setPriceMin(Math.min(Number(e.target.value), Math.max(0.02, priceMax - 0.1)))
                    }
                    aria-label="Preço mínimo em ETH"
                    className="range-thumb absolute inset-0 z-20 h-4 w-full cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={PRICE_MAX}
                    step={0.01}
                    value={priceMax}
                    onChange={(e) =>
                      setPriceMax(Math.max(Number(e.target.value), Math.min(priceMin + 0.1, PRICE_MAX)))
                    }
                    aria-label="Preço máximo em ETH"
                    className="range-thumb absolute inset-0 z-10 h-4 w-full cursor-pointer"
                  />
                </div>

                <p className="mt-4 text-[13px] text-brand-gold">
                  Preço:{' '}
                  <span className="text-brand-cream">
                    {priceMin.toFixed(2).replace('.', ',')} –{' '}
                    {priceMax.toFixed(2).replace('.', ',')} ETH
                  </span>
                </p>

                <button
                  type="submit"
                  className="mt-4 h-9 w-[92px] rounded-[6px] bg-primary text-[13px] font-bold text-ink transition-colors hover:bg-primary-light"
                >
                  Aplicar
                </button>
              </form>

              <div className="my-8 h-px w-full bg-brand-border" />

              {/* Rede */}
              <div>
                <h3 className="text-[15px] font-bold text-brand-cream">Rede</h3>
                <ul className="mt-4 space-y-2 text-[15px]">
                  <li className="flex items-center justify-between text-accent">
                    <span className="inline-flex items-center gap-2">
                      <Check size={13} /> Ethereum
                    </span>
                    <span className="text-xs font-bold">{allCatalog?.total ?? data?.total ?? 0}</span>
                  </li>
                  <li className="flex items-center justify-between text-brand-sand">
                    <span>Polygon</span>
                    <span className="text-[10px] uppercase tracking-wide">em breve</span>
                  </li>
                  <li className="flex items-center justify-between text-brand-sand">
                    <span>Solana</span>
                    <span className="text-[10px] uppercase tracking-wide">em breve</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Banner em destaque */}
            {sidebarFeatured && (
              <div className="relative flex h-[470px] flex-col overflow-hidden rounded-[6px] bg-gradient-to-b from-primary/10 to-primary/[0.03] p-5">
                <span className="eyebrow text-[11px]">NFT em destaque</span>
                <div className="mt-4 aspect-square w-full overflow-hidden rounded-[11px] bg-surface-card">
                  <img
                    src={sidebarFeatured.imageUrl}
                    alt={sidebarFeatured.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-5 truncate text-[17px] font-bold text-brand-cream">
                  {sidebarFeatured.title}
                </h3>
                <p className="mt-1 text-[15px] font-bold text-accent">
                  {sidebarFeatured.priceEth}{' '}
                  <span className="text-xs font-medium text-brand-gold">ETH</span>
                </p>
                <Link
                  to="/nfts/$id"
                  params={{ id: sidebarFeatured.id }}
                  className="btn-primary mt-auto h-10 w-[140px] text-[13px]"
                >
                  Explorar <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </aside>

          {/* ── Grade de NFTs ────────────────────────────────────────────────── */}
          <div>
            <div className="flex flex-col gap-4 border-b border-brand-border pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex gap-6 overflow-x-auto" role="tablist" aria-label="Ordenação do catálogo">
                {[
                  { id: 'all' as const, label: 'Todos os NFTs', sort: undefined },
                  { id: 'new' as const, label: 'Novos lançamentos', sort: 'newest' as const },
                  { id: 'popular' as const, label: 'Em alta', sort: 'popular' as const },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setSort(tab.sort)}
                    className={cn(
                      'relative shrink-0 pb-3 text-[15px] leading-none transition-colors',
                      'after:absolute after:inset-x-0 after:-bottom-[2px] after:h-[3px] after:rounded-full',
                      activeTab === tab.id
                        ? 'font-medium text-accent after:bg-primary'
                        : 'text-brand-gold after:bg-transparent hover:text-brand-cream',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-brand-muted sm:inline">Ordenar por:</span>
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setSort(e.target.value as NFTSortBy)}
                    aria-label="Ordenar por"
                    className="h-9 appearance-none rounded-sm border border-brand-border bg-transparent py-1 pl-3 pr-8 text-[13px] text-brand-cream outline-none transition-colors focus:border-primary"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-card text-brand-cream">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted"
                  />
                </div>
                {isFetching && !isLoading && (
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-primary"
                    aria-label="Atualizando catálogo"
                  />
                )}
              </div>
            </div>

            {search.search && (
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-gold">
                <span>
                  Resultados para <span className="text-accent">“{search.search}”</span>
                </span>
                <button
                  type="button"
                  onClick={() => void navigate({ search: (prev) => ({ ...prev, search: undefined }) })}
                  className="inline-flex items-center gap-1 text-brand-muted hover:text-foreground"
                >
                  <X size={12} /> limpar
                </button>
              </div>
            )}

            {/* Estado de erro */}
            {isError ? (
              <div className="mt-10 flex flex-col items-center justify-center rounded-[6px] border border-error/30 bg-surface-card px-6 py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
                  <RotateCw className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-brand-cream">Falha ao carregar o catálogo</h3>
                <p className="mb-6 max-w-md text-sm text-brand-gold">
                  {(error as { message?: string })?.message ||
                    'Ocorreu uma falha de conexão com os servidores. Tente novamente.'}
                </p>
                <button type="button" onClick={() => void refetch()} className="btn-primary">
                  <RotateCw size={14} /> Tentar novamente
                </button>
              </div>
            ) : data && data.total === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 text-5xl" aria-hidden>
                  🔍
                </div>
                <h3 className="mb-2 text-lg font-semibold text-brand-cream">Nenhum NFT encontrado</h3>
                <p className="mb-4 text-sm text-brand-gold">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearAllFilters} className="btn-outline">
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[72px]"
                  aria-label="Lista de NFTs"
                  aria-busy={isLoading}
                >
                  {isLoading
                    ? Array.from({ length: skeletonCount }).map((_, i) => (
                        <NftCardSkeleton key={i} />
                      ))
                    : nfts.map((nft) => (
                        <NftCard
                          key={nft.id}
                          nft={nft}
                          onAddToCart={(n) => addToCartMutation.mutate(n)}
                        />
                      ))}
                </div>

                {/* Paginação */}
                {!isLoading && totalPages > 1 && (
                  <nav
                    aria-label="Paginação do catálogo"
                    className="mt-12 flex items-center justify-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Página anterior"
                      className={cn(
                        'flex h-[35px] w-[35px] items-center justify-center rounded-[4px] border border-brand-border text-brand-gold transition-colors',
                        currentPage <= 1
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:border-primary hover:text-accent',
                      )}
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      const isActive = page === currentPage;
                      const show =
                        page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      if (!show) {
                        if (page === 2 || page === totalPages - 1) {
                          return (
                            <span key={page} className="px-1 text-sm text-brand-muted">
                              …
                            </span>
                          );
                        }
                        return null;
                      }
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setPage(page)}
                          aria-label={`Ir para página ${page}`}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'h-[35px] w-[35px] rounded-[4px] border text-sm font-medium transition-colors',
                            isActive
                              ? 'border-primary bg-primary text-ink'
                              : 'border-brand-border text-brand-gold hover:border-primary hover:text-accent',
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      aria-label="Próxima página"
                      className={cn(
                        'flex h-[35px] w-[35px] items-center justify-center rounded-[4px] border border-brand-border text-brand-gold transition-colors',
                        currentPage >= totalPages
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:border-primary hover:text-accent',
                      )}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </nav>
                )}

                {!isLoading && data && (
                  <p className="mt-4 text-center text-xs text-brand-muted" aria-live="polite">
                    {data.total} NFT{data.total !== 1 ? 's' : ''} encontrado
                    {data.total !== 1 ? 's' : ''}
                    {currentPage > 1 && ` · Página ${currentPage} de ${totalPages}`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Promos ─────────────────────────────────────────────────────────────── */}
      <section id="promos" className="container pb-16 lg:pb-24" aria-labelledby="promos-heading">
        <h2 id="promos-heading" className="sr-only">
          Curadorias em destaque
        </h2>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {[
            {
              image: featured[2]?.imageUrl ?? nfts[2]?.imageUrl,
              title: 'Primeiras edições',
              text: 'Obras que abriram caminho para a nova cena digital, com proveniência verificada.',
            },
            {
              image: featured[3]?.imageUrl ?? nfts[3]?.imageUrl,
              title: 'Novos nomes',
              text: 'Criadores independentes selecionados pela curadoria KURIO nesta temporada.',
            },
          ].map((promo, index) => (
            <article
              key={promo.title}
              className="relative flex min-h-[250px] items-center gap-6 overflow-hidden rounded-[8px] bg-surface-card p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full border border-primary/25"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-20 h-40 w-40 rounded-full border border-primary/15"
              />
              {promo.image ? (
                <div className="hidden h-[180px] w-[45%] shrink-0 overflow-hidden rounded-[6px] bg-surface-raised sm:block">
                  <img src={promo.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="hidden h-[180px] w-[45%] shrink-0 rounded-[6px] bg-surface-raised skeleton-shimmer sm:block" />
              )}
              <div className="relative z-10 flex-1">
                <span className="eyebrow text-[11px]">Curadoria {index + 1}</span>
                <h3 className="mt-2 text-[17px] font-bold leading-tight text-brand-cream">
                  {promo.title}
                </h3>
                <p className="mt-2 text-sm leading-[22px] text-brand-gold">{promo.text}</p>
                <a
                  href="/#catalog"
                  className="mt-5 inline-flex h-10 w-[140px] items-center justify-center gap-2 rounded-[6px] border border-primary text-[13px] font-medium text-accent transition-colors hover:bg-primary/10"
                >
                  Explorar <ArrowRight size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Blog ───────────────────────────────────────────────────────────────── */}
      <section id="blog" className="border-t border-border/50" aria-labelledby="blog-heading">
        <div className="container py-16 lg:py-24">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="blog-heading" className="text-[28px] font-bold leading-tight text-brand-cream">
                Diário da Cunhagem
              </h2>
              <p className="mt-1 text-sm text-brand-gold">
                Histórias, processos e bastidores dos artistas do mercado.
              </p>
            </div>
            <a href="/#catalog" className="link-accent inline-flex items-center gap-1 text-[13px]">
              Ver tudo <ArrowRight size={13} />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-[8px] bg-surface-card">
                    <div className="h-[195px] skeleton-shimmer" />
                    <div className="space-y-3 p-4">
                      <div className="h-3 w-20 rounded-sm skeleton-shimmer" />
                      <div className="h-4 w-4/5 rounded-sm skeleton-shimmer" />
                      <div className="h-3 w-full rounded-sm skeleton-shimmer" />
                    </div>
                  </div>
                ))
              : blogPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="group flex flex-col overflow-hidden rounded-[8px] bg-surface-card"
                  >
                    <Link
                      to="/nfts/$id"
                      params={{ id: post.id }}
                      className="block h-[195px] overflow-hidden"
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <time className="text-xs text-brand-muted">
                        {['12 OUT 2026', '04 OUT 2026', '28 SET 2026', '19 SET 2026'][index] ?? '2026'}
                      </time>
                      <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-5 text-brand-cream">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-[13px] leading-[22px] text-brand-gold">
                        {post.description}
                      </p>
                      <Link
                        to="/nfts/$id"
                        params={{ id: post.id }}
                        className="link-accent mt-4 inline-flex items-center gap-1 text-[13px]"
                      >
                        Ler mais <ArrowRight size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}
