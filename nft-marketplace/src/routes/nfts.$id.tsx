import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  RotateCw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNFTDetail } from '../features/catalog/hooks/use-nft-detail';
import { useNFTs } from '../features/catalog/hooks/use-nfts';
import { useFavoriteToggle } from '../features/catalog/hooks/use-favorites';
import { EditionSelector } from '../features/catalog/components/EditionSelector';
import { NftDetailSkeleton } from '../features/catalog/components/NftDetailSkeleton';
import { NftCard } from '../features/catalog/components/NftCard';
import { useAuth } from '../features/auth/context/use-auth';
import { cartKeys } from '../features/cart/hooks/query-keys';
import { cartApi } from '../shared/api/services';
import { formatEthDisplay, multiplyEth } from '../shared/utils/currency';
import { cn } from '../shared/ui/utils';
import type { NFTEdition } from '../shared/types/contracts';

export const Route = createFileRoute('/nfts/$id')({
  component: NftDetailPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  art: 'Arte',
  collectibles: 'Colecionáveis',
  photography: 'Fotografia',
  'virtual-worlds': 'Mundos Virtuais',
};

const REVIEWS = [
  {
    author: 'Marina C.',
    text: 'A textura e a paleta são ainda mais bonitas ao vivo. Embalagem digital impecável e transferência rápida.',
    date: '02 OUT 2026',
  },
  {
    author: 'Rafael T.',
    text: 'Segunda obra que adquiro deste estúdio. A curadoria acertou em cheio na seleção.',
    date: '27 SET 2026',
  },
  {
    author: 'Camila O.',
    text: 'Processo simples, autenticidade clara e um atendimento que realmente acompanha a compra.',
    date: '18 SET 2026',
  },
];

function NftDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: nft, isLoading, isError, error, refetch } = useNFTDetail(id);
  const favoriteToggle = useFavoriteToggle();
  const { data: relatedData } = useNFTs({
    category: nft?.category ?? 'all',
    sortBy: 'popular',
    page: 1,
    limit: 8,
  });

  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  useEffect(() => {
    if (nft?.title) {
      document.title = `${nft.title} | KURIO`;
    }
  }, [nft?.title]);

  useEffect(() => {
    setActiveImage(0);
    setActiveTab('details');
  }, [id]);

  const selectedEdition = useMemo(() => {
    if (!nft) return null;
    if (selectedEditionId) {
      const found = nft.editions.find((e) => e.id === selectedEditionId);
      if (found) return found;
    }
    return nft.editions.find((e) => e.available) ?? nft.editions[0] ?? null;
  }, [nft, selectedEditionId]);

  const unitPrice = selectedEdition?.priceEth ?? nft?.priceEth ?? '0.0000';
  const totalPrice = useMemo(() => multiplyEth(unitPrice, quantity), [unitPrice, quantity]);

  const galleryImages = useMemo(() => {
    if (!nft) return [];
    const extras = (relatedData?.items ?? [])
      .map((item) => item.imageUrl)
      .filter((url) => url && url !== nft.imageUrl);
    return [nft.imageUrl, ...extras].slice(0, 4);
  }, [nft, relatedData]);

  const relatedNfts = useMemo(
    () => (relatedData?.items ?? []).filter((item) => item.id !== nft?.id).slice(0, 5),
    [relatedData, nft?.id],
  );

  const addToCartMutation = useMutation({
    mutationFn: async ({ shouldRedirect }: { shouldRedirect?: boolean }) => {
      if (!nft || !selectedEdition) throw new Error('Edição indisponível');
      return {
        cart: await cartApi.addItem({
          nftId: nft.id,
          editionId: selectedEdition.id,
          quantity,
        }),
        shouldRedirect,
      };
    },
    onSuccess: (res) => {
      queryClient.setQueryData(cartKeys.detail(user?.id), res.cart);
      void queryClient.invalidateQueries({ queryKey: cartKeys.all(user?.id) });
      if (res.shouldRedirect) {
        void navigate({ to: '/cart' });
      } else {
        setAddedSuccess(true);
        setTimeout(() => setAddedSuccess(false), 3500);
      }
    },
  });

  const handleFavorite = () => {
    if (!nft) return;
    if (!user) {
      void navigate({ to: '/login', search: { redirect: `/nfts/${nft.id}` } });
      return;
    }
    favoriteToggle.mutate({ nftId: nft.id, isFavorite: nft.isFavorite ?? false });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: nft?.title,
          text: `Confira ${nft?.title} no KURIO`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Ignora cancelamentos de compartilhamento
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink py-8">
        <NftDetailSkeleton />
      </div>
    );
  }

  const errorStatus =
    (error as { status?: number; response?: { status?: number } })?.status ??
    (error as { response?: { status?: number } })?.response?.status;

  if (isError && errorStatus === 404) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-ink px-4">
        <div className="w-full max-w-md rounded-[8px] border border-brand-border bg-surface-card p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-brand-cream">NFT não encontrado</h1>
          <p className="mb-6 text-sm text-brand-gold">
            A obra que você procura pode ter sido removida, transferida ou não existe neste catálogo.
          </p>
          <Link to="/" className="btn-primary w-full">
            <ArrowLeft className="h-4 w-4" /> Voltar para o catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (isError || !nft) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-ink px-4">
        <div className="w-full max-w-md rounded-[8px] border border-error/30 bg-surface-card p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
            <RotateCw className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-brand-cream">Falha ao carregar NFT</h1>
          <p className="mb-6 text-sm text-brand-gold">
            Ocorreu uma instabilidade na conexão com a rede. Verifique seu status ou tente novamente.
          </p>
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => void refetch()} className="btn-primary w-full">
              <RotateCw className="h-4 w-4" /> Tentar novamente
            </button>
            <Link to="/" className="btn-outline w-full">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSoldOut = nft.totalAvailable === 0 || !nft.editions.some((e) => e.available);
  const isSelectedAvailable = selectedEdition?.available ?? false;
  const mainImage = galleryImages[activeImage] ?? nft.imageUrl;

  return (
    <div className="min-h-screen bg-ink text-brand-cream">
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-brand-muted">
          <Link to="/" className="transition-colors hover:text-accent">
            Início
          </Link>
          <span aria-hidden>/</span>
          <a href="/#catalog" className="transition-colors hover:text-accent">
            Mercado
          </a>
          <span aria-hidden>/</span>
          <span className="truncate text-brand-gold">{nft.title}</span>
        </nav>

        {/* Detalhe */}
        <div className="grid items-start gap-8 lg:grid-cols-[573px_minmax(0,1fr)]">
          {/* Galeria */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {galleryImages.length > 1 && (
              <div className="order-2 flex gap-4 overflow-x-auto sm:order-1 sm:flex-col">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Ver imagem ${index + 1} de ${galleryImages.length}`}
                    aria-pressed={activeImage === index}
                    className={cn(
                      'h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[6px] border bg-surface-card p-1 transition-colors sm:h-[100px] sm:w-[100px]',
                      activeImage === index
                        ? 'border-primary'
                        : 'border-brand-border hover:border-primary/60',
                    )}
                  >
                    <img src={image} alt="" className="h-full w-full rounded-[3px] object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative order-1 aspect-square w-full max-w-[444px] overflow-hidden rounded-[6px] bg-surface-card p-4 sm:order-2">
              <img
                src={mainImage}
                alt={nft.title}
                width={444}
                height={444}
                className="h-full w-full rounded-[3px] object-cover"
                fetchPriority="high"
                decoding="async"
              />
              <button
                type="button"
                onClick={handleFavorite}
                disabled={favoriteToggle.isPending}
                aria-label={nft.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                aria-pressed={nft.isFavorite ?? false}
                className={cn(
                  'absolute right-5 top-5 z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-brand-border bg-surface-raised text-brand-cream transition-colors',
                  'hover:bg-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  nft.isFavorite && 'bg-primary text-ink',
                )}
              >
                <Heart size={14} fill={nft.isFavorite ? 'currentColor' : 'none'} />
              </button>
              {isSoldOut && (
                <span className="absolute bottom-6 left-6 rounded-sm bg-error px-3 py-1 text-xs font-bold text-brand-cream">
                  Esgotado
                </span>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="min-w-0 lg:pl-8">
            <h1 className="text-[28px] font-bold leading-tight text-brand-cream">{nft.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-[22px] font-bold leading-4 text-accent">
                {formatEthDisplay(unitPrice, false)}{' '}
                <span className="text-sm font-medium text-brand-gold">ETH</span>
              </span>
              <span className="flex items-center gap-1 text-brand-gold" role="img" aria-label="Avaliação: 5 de 5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-primary text-primary" />
                ))}
              </span>
              <span className="text-xs text-brand-muted">19 avaliações de colecionadores</span>
            </div>

            <div className="hairline my-6" />

            <section aria-labelledby="about-nft">
              <h2 id="about-nft" className="text-[17px] font-bold text-brand-cream">
                Sobre este NFT:
              </h2>
              <p className="mt-3 max-w-[595px] whitespace-pre-line text-sm leading-6 text-brand-gold">
                {nft.description}
              </p>
            </section>

            {/* Criador */}
            <div className="mt-6 flex items-center gap-3">
              <img
                src={nft.creator.avatarUrl}
                alt={nft.creator.name}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-brand-border"
              />
              <div>
                <span className="block text-[11px] text-brand-muted">Criado por</span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-brand-cream">
                  {nft.creator.name}
                  {nft.creator.verified && (
                    <ShieldCheck className="h-4 w-4 text-primary" aria-label="Criador verificado" />
                  )}
                </span>
              </div>
            </div>

            {/* Edições */}
            <div className="mt-7">
              <EditionSelector
                editions={nft.editions}
                selectedId={selectedEdition?.id}
                onSelect={(ed: NFTEdition) => {
                  setSelectedEditionId(ed.id);
                  setQuantity(1);
                }}
              />
              {selectedEdition && !selectedEdition.available && (
                <p className="mt-2 text-xs text-error">
                  A edição #{selectedEdition.editionNumber} já foi adquirida por outro colecionador.
                </p>
              )}
            </div>

            {/* Compra */}
            {!isSoldOut && isSelectedAvailable ? (
              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2" aria-label="Selecionar quantidade">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Diminuir quantidade"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-primary text-ink transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(nft.totalAvailable || 1, q + 1))}
                      disabled={quantity >= (nft.totalAvailable || 1)}
                      aria-label="Aumentar quantidade"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-primary text-ink transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCartMutation.mutate({ shouldRedirect: true })}
                    disabled={addToCartMutation.isPending}
                    className="btn-primary min-w-[150px] uppercase tracking-[0.04em]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {addToCartMutation.isPending ? 'Processando...' : 'Comprar'}
                  </button>

                  <button type="button" onClick={handleFavorite} className="btn-outline min-w-[130px]">
                    <Heart className="h-4 w-4" />
                    Favoritar
                  </button>

                  <button
                    type="button"
                    onClick={() => addToCartMutation.mutate({ shouldRedirect: false })}
                    disabled={addToCartMutation.isPending}
                    aria-label="Adicionar ao carrinho sem finalizar"
                    title="Adicionar ao carrinho"
                    className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-brand-border text-brand-gold transition-colors hover:border-primary hover:text-accent disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-xs text-brand-muted">
                  Total selecionado:{' '}
                  <span className="font-bold text-accent">{formatEthDisplay(totalPrice)}</span>
                </p>

                {addedSuccess && (
                  <div
                    role="alert"
                    className="mt-4 flex items-center justify-between rounded-[6px] border border-success/30 bg-success/10 px-3 py-2.5 text-xs text-success"
                  >
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0" />
                      Item adicionado ao carrinho.
                    </span>
                    <Link to="/cart" className="font-bold underline hover:no-underline">
                      Ver carrinho
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-[6px] border border-brand-border bg-surface-card p-5 text-center">
                <p className="text-sm font-semibold text-brand-cream">
                  {isSoldOut
                    ? 'Todas as edições deste NFT foram vendidas'
                    : 'Edição selecionada indisponível'}
                </p>
                <p className="mt-1 text-xs text-brand-gold">
                  Acompanhe o artista para futuros lançamentos e novidades.
                </p>
                <Link to="/" className="btn-outline mt-4">
                  Explorar outras obras
                </Link>
              </div>
            )}

            {/* Metadados */}
            <dl className="mt-8 divide-y divide-brand-border border-y border-brand-border text-[13px]">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-brand-muted">ID do token</dt>
                <dd className="font-medium text-brand-cream">#{nft.id}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-brand-muted">Coleção</dt>
                <dd className="font-medium text-brand-cream">
                  {CATEGORY_LABELS[nft.category] ?? nft.category}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-brand-muted">Atributos</dt>
                <dd className="font-medium text-brand-cream">
                  {nft.editions.length} edições · {nft.totalAvailable} disponíveis
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-brand-muted">Rede</dt>
                <dd className="font-medium text-brand-cream">Ethereum</dd>
              </div>
            </dl>

            {/* Compartilhar */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-bold text-brand-cream">Compartilhar este NFT:</span>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Compartilhar NFT"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border text-brand-gold transition-colors hover:border-primary hover:text-accent"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={copyLink}
                aria-label="Copiar link"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border text-brand-gold transition-colors hover:border-primary hover:text-accent"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Compartilhar no X"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-border text-brand-gold transition-colors hover:border-primary hover:text-accent"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Abas */}
        <section className="mt-16" aria-label="Informações adicionais">
          <div className="flex gap-8 border-b border-brand-border" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
              className={cn(
                'relative pb-3 text-[15px] transition-colors',
                'after:absolute after:inset-x-0 after:-bottom-[1px] after:h-[3px] after:rounded-full',
                activeTab === 'details'
                  ? 'font-medium text-accent after:bg-primary'
                  : 'text-brand-gold hover:text-brand-cream after:bg-transparent',
              )}
            >
              Detalhes do NFT
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              className={cn(
                'relative pb-3 text-[15px] transition-colors',
                'after:absolute after:inset-x-0 after:-bottom-[1px] after:h-[3px] after:rounded-full',
                activeTab === 'reviews'
                  ? 'font-medium text-accent after:bg-primary'
                  : 'text-brand-gold hover:text-brand-cream after:bg-transparent',
              )}
            >
              Avaliações de colecionadores (19)
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="max-w-[900px] py-8">
              <p className="text-sm leading-7 text-brand-gold">
                {nft.description} Esta edição faz parte de uma série limitada emitida diretamente pelo
                estúdio, com metadados permanentes e proveniência registrada na Ethereum. A obra é
                entregue na carteira conectada após a confirmação da transação e pode ser exibida em
                qualquer galeria compatível com o padrão ERC-721.
              </p>
              <div className="mt-6 divide-y divide-brand-border border-y border-brand-border text-[13px]">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-brand-muted">Rede</span>
                  <span className="text-brand-cream">Ethereum Mainnet</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-brand-muted">Contrato</span>
                  <span className="font-mono text-brand-cream">0xKURIO...7f3a</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-brand-muted">Direitos autorais</span>
                  <span className="text-brand-cream">Uso pessoal e exibição</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[900px] space-y-6 py-8">
              {REVIEWS.map((review) => (
                <article key={review.author} className="border-b border-brand-border pb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-accent">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-cream">{review.author}</p>
                        <div className="mt-0.5 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} className="fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <time className="text-[11px] text-brand-muted">{review.date}</time>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-brand-gold">{review.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Mais desta coleção */}
        {relatedNfts.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="related-heading" className="text-[28px] font-bold leading-tight text-brand-cream">
                Mais desta coleção
              </h2>
              <a href="/#catalog" className="link-accent inline-flex items-center gap-1 text-[13px]">
                Ver tudo <ArrowRight size={13} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5 xl:gap-[26px]">
              {relatedNfts.map((related) => (
                <NftCard key={related.id} nft={related} />
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
