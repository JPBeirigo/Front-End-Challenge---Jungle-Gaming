import { cn } from '../../../shared/ui/utils';

interface NftCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton com shimmer para o card de NFT — mesmas proporções do NftCard.
 */
export function NftCardSkeleton({ className }: NftCardSkeletonProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)} aria-hidden="true">
      <div className="aspect-[258/300] w-full rounded-[6px] skeleton-shimmer" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded-sm skeleton-shimmer" />
        <div className="h-4 w-24 rounded-sm skeleton-shimmer" />
      </div>
    </div>
  );
}
