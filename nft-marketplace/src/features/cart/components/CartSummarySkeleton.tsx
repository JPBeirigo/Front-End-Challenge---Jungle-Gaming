import { cn } from '../../../shared/ui/utils';

interface CartSummarySkeletonProps {
  className?: string;
}

/**
 * Skeleton com shimmer para o resumo do carrinho, mantendo as dimensões do conteúdo.
 */
export function CartSummarySkeleton({ className }: CartSummarySkeletonProps) {
  return (
    <div
      className={cn('flex w-full flex-col gap-6 rounded-[6px] bg-surface-card p-5', className)}
      aria-hidden="true"
    >
      <div className="h-5 w-40 rounded-sm skeleton-shimmer" />

      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded-sm skeleton-shimmer" />
          <div className="h-4 w-24 rounded-sm skeleton-shimmer" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-28 rounded-sm skeleton-shimmer" />
          <div className="h-4 w-20 rounded-sm skeleton-shimmer" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-32 rounded-sm skeleton-shimmer" />
          <div className="h-4 w-24 rounded-sm skeleton-shimmer" />
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <div className="h-5 w-16 rounded-sm skeleton-shimmer" />
        <div className="h-6 w-28 rounded-sm skeleton-shimmer" />
      </div>

      <div className="h-10 w-full rounded-[3px] skeleton-shimmer" />
      <div className="h-10 w-full rounded-[6px] skeleton-shimmer" />
    </div>
  );
}
