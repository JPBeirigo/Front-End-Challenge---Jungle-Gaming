import { cn } from '../../../shared/ui/utils';
import type { NFTEdition } from '../../../shared/types/contracts';

interface EditionSelectorProps {
  editions: NFTEdition[];
  selectedId?: string;
  onSelect: (edition: NFTEdition) => void;
}

/**
 * Chips de edição no padrão do Figma — pill de 28px de altura.
 */
export function EditionSelector({ editions, selectedId, onSelect }: EditionSelectorProps) {
  const availableCount = editions.filter((e) => e.available).length;

  return (
    <div role="group" aria-label="Selecionar edição">
      <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-brand-muted">
        Edição — {availableCount} disponíve{availableCount === 1 ? 'l' : 'is'} de {editions.length}
      </p>

      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const isSelected = edition.id === selectedId;
          const isAvailable = edition.available;

          return (
            <button
              key={edition.id}
              type="button"
              onClick={() => isAvailable && onSelect(edition)}
              disabled={!isAvailable}
              aria-label={`Edição ${edition.editionNumber} de ${edition.totalEditions}${!isAvailable ? ' — indisponível' : ''}`}
              aria-pressed={isSelected}
              className={cn(
                'inline-flex h-7 min-w-10 items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isAvailable &&
                  !isSelected &&
                  'border-brand-border bg-transparent text-brand-cream hover:border-primary hover:text-accent',
                isAvailable && isSelected && 'border-primary bg-primary/10 text-accent',
                !isAvailable &&
                  'cursor-not-allowed border-brand-border/40 text-brand-sand/40 line-through',
              )}
            >
              #{edition.editionNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
