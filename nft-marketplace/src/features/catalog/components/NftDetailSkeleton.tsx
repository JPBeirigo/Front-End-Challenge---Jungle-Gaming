import { cn } from '../../../shared/ui/utils';

interface NftDetailSkeletonProps {
  className?: string;
}

/**
 * Skeleton com efeito shimmer para a página de detalhes do NFT.
 * Mantém as dimensões da grade para evitar Cumulative Layout Shift (CLS).
 */
export function NftDetailSkeleton({ className }: NftDetailSkeletonProps) {
  return (
    <div className={cn('container py-8', className)} aria-hidden="true">
      {/* Breadcrumb */}
      <div className="mb-8 h-3 w-40 rounded-sm skeleton-shimmer" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,644px)_595px] lg:justify-between">
        {/* Galeria */}
        <div className="space-y-3">
          <div className="aspect-square w-full max-w-[444px] rounded-[6px] skeleton-shimmer" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[100px] w-[100px] rounded-[6px] skeleton-shimmer" />
            ))}
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded-sm skeleton-shimmer" />
            <div className="h-4 w-1/3 rounded-sm skeleton-shimmer" />
          </div>

          <div className="h-6 w-40 rounded-sm skeleton-shimmer" />

          <div className="flex items-center gap-3">
            <div className="h-[50px] w-[50px] shrink-0 rounded-full skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded-sm skeleton-shimmer" />
              <div className="h-4 w-36 rounded-sm skeleton-shimmer" />
            </div>
          </div>

          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full skeleton-shimmer" />
            ))}
          </div>

          <div className="rounded-[6px] bg-surface-card p-5">
            <div className="h-3 w-24 rounded-sm skeleton-shimmer" />
            <div className="mt-2 h-8 w-40 rounded-sm skeleton-shimmer" />
            <div className="mt-4 h-10 w-full rounded-[6px] skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
