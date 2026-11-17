import React from 'react';
import { Link } from '@tanstack/react-router';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatEthDisplay, multiplyEth } from '../../../shared/utils/currency';
import { cn } from '../../../shared/ui/utils';
import type { CartItem } from '../../../shared/types/contracts';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (nftId: string, editionId: string, quantity: number) => void;
  onRemove: (nftId: string, editionId: string) => void;
  isUpdating?: boolean;
}

/**
 * Linha do carrinho no padrão do Figma — thumb 70, linha de 70 de altura,
 * stepper 75×30 e total em text-accent.
 */
export const CartItemRow = React.memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating = false,
}: CartItemRowProps) {
  const itemTotal = multiplyEth(item.priceEth, item.quantity);

  return (
    <article
      className={cn(
        'flex flex-wrap items-center gap-4 border-b border-border/60 py-3 transition-opacity lg:flex-nowrap lg:gap-5 lg:border-0 lg:py-0',
        isUpdating && 'pointer-events-none opacity-50',
      )}
      aria-label={`Item: ${item.title}`}
    >
      {/* Thumb */}
      <Link
        to="/nfts/$id"
        params={{ id: item.nftId }}
        className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[6px] bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
      </Link>

      {/* Nome + metadados */}
      <div className="min-w-0 flex-1">
        <Link
          to="/nfts/$id"
          params={{ id: item.nftId }}
          className="block truncate text-[16px] font-bold leading-tight text-foreground transition-colors hover:text-accent"
        >
          {item.title}
        </Link>
        <p className="mt-1 truncate text-[12px] text-secondary">
          #{item.nftId.slice(0, 10)} · Ed. #{item.editionNumber}
          {item.quantity === 1 ? '' : ` · ${item.quantity}x`}
        </p>
      </div>

      {/* Preço unitário (desktop) */}
      <div className="hidden w-[84px] shrink-0 text-[14px] text-secondary lg:block">
        {formatEthDisplay(item.priceEth)}
      </div>

      {/* Stepper 75×30 */}
      <div className="flex h-[30px] w-[75px] shrink-0 items-center justify-between rounded-full border border-ink bg-primary text-ink shadow-[0_4px_12px_-2px_rgba(20,13,10,0.15)]">
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.nftId, item.editionId, item.quantity - 1)}
          disabled={item.quantity <= 1 || isUpdating}
          aria-label={`Diminuir quantidade de ${item.title}`}
          className="flex h-full w-[24px] items-center justify-center rounded-full transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-[12px] font-bold tabular-nums" aria-live="polite">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.nftId, item.editionId, item.quantity + 1)}
          disabled={item.quantity >= item.maxAvailable || isUpdating}
          aria-label={`Aumentar quantidade de ${item.title}`}
          className="flex h-full w-[24px] items-center justify-center rounded-full transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Total do item */}
      <div className="w-[88px] shrink-0 text-right text-[15px] font-bold text-accent lg:text-left">
        {formatEthDisplay(itemTotal)}
      </div>

      {/* Remover */}
      <button
        type="button"
        onClick={() => onRemove(item.nftId, item.editionId)}
        disabled={isUpdating}
        aria-label={`Remover ${item.title} do carrinho`}
        className="ml-auto flex h-6 w-6 items-center justify-center rounded-sm text-muted transition-colors hover:text-error disabled:opacity-40 lg:ml-0"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
});
