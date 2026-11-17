import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { cn } from '../../../shared/ui/utils';
import type { NFTItem } from '../../../shared/types/contracts';
import { useAuth } from '../../auth/context/use-auth';
import { useFavoriteToggle } from '../hooks/use-favorites';

interface NftCardProps {
  nft: NFTItem;
  onAddToCart?: (nft: NFTItem) => void;
  className?: string;
}

/**
 * Card de NFT no padrão do Figma: tile 258×300 em surface-card,
 * nome regular 16 e preço bold 18 em text-accent.
 */
export const NftCard = React.memo(function NftCard({ nft, onAddToCart, className }: NftCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const favoriteToggle = useFavoriteToggle();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      void navigate({ to: '/login', search: { redirect: `/nfts/${nft.id}` } });
      return;
    }

    favoriteToggle.mutate({ nftId: nft.id, isFavorite: nft.isFavorite ?? false });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(nft);
  };

  const availableEdition = nft.editions.find((ed) => ed.available);

  return (
    <article
      className={cn('group flex min-w-0 flex-col gap-3', className)}
      aria-label={`NFT: ${nft.title}`}
    >
      <div className="relative aspect-[258/300] w-full overflow-hidden rounded-[6px] bg-surface-card">
        <Link
          to="/nfts/$id"
          params={{ id: nft.id }}
          className="absolute inset-0 block p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          tabIndex={-1}
          aria-hidden
        >
          <img
            src={nft.imageUrl}
            alt={nft.title}
            width={250}
            height={250}
            loading="lazy"
            decoding="async"
            className="h-full w-full rounded-[4px] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Favorito */}
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={nft.isFavorite ? `Remover ${nft.title} dos favoritos` : `Favoritar ${nft.title}`}
          aria-pressed={nft.isFavorite ?? false}
          disabled={favoriteToggle.isPending}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-brand-border/70 backdrop-blur-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            nft.isFavorite
              ? 'bg-primary text-ink'
              : 'bg-surface-raised/90 text-brand-cream hover:bg-primary hover:text-ink',
          )}
        >
          <Heart
            size={14}
            className={cn(favoriteToggle.isPending && 'animate-pulse')}
            fill={nft.isFavorite ? 'currentColor' : 'none'}
          />
        </button>

        {/* Disponibilidade */}
        {nft.totalAvailable > 0 && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-brand-cream backdrop-blur-sm">
            {nft.totalAvailable} disponíve{nft.totalAvailable === 1 ? 'l' : 'is'}
          </span>
        )}

        {/* Adicionar ao carrinho */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!availableEdition}
          aria-label={`Adicionar ${nft.title} ao carrinho`}
          className={cn(
            'absolute bottom-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            availableEdition
              ? 'border-primary/60 bg-primary text-ink hover:bg-primary-light'
              : 'cursor-not-allowed border-brand-border bg-surface-raised text-brand-sand',
          )}
        >
          <ShoppingCart size={14} />
        </button>
      </div>

      <div className="min-w-0">
        <Link to="/nfts/$id" params={{ id: nft.id }} className="block">
          <h3 className="truncate text-[16px] font-normal leading-4 text-brand-cream transition-colors hover:text-accent">
            {nft.title}
          </h3>
        </Link>
        <p className="mt-1.5 text-[18px] font-bold leading-4 text-accent">
          {nft.priceEth} <span className="text-[13px] font-medium text-brand-gold">ETH</span>
        </p>
      </div>
    </article>
  );
});
