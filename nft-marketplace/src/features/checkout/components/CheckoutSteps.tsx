import { Check } from 'lucide-react';
import { cn } from '../../../shared/ui/utils';
import type { CheckoutStep } from '../hooks/use-checkout';

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const isReview = currentStep === 'review';

  return (
    <nav aria-label="Progresso do checkout" className="mb-8">
      <ol className="flex max-w-xl items-center">
        <li className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-bold',
              isReview
                ? 'border-success/60 bg-success/15 text-success'
                : 'border-primary bg-primary text-ink',
            )}
            aria-current={!isReview ? 'step' : undefined}
          >
            {isReview ? <Check className="h-4 w-4" /> : '1'}
          </span>
          <span
            className={cn(
              'text-[13px]',
              !isReview ? 'font-bold text-foreground' : 'text-secondary',
            )}
          >
            Dados & carteira
          </span>
        </li>

        <span
          className={cn('mx-4 h-px flex-1', isReview ? 'bg-primary' : 'bg-border')}
          aria-hidden
        />

        <li className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-bold',
              isReview
                ? 'border-primary bg-primary text-ink'
                : 'border-border text-muted',
            )}
            aria-current={isReview ? 'step' : undefined}
          >
            2
          </span>
          <span
            className={cn(
              'text-[13px]',
              isReview ? 'font-bold text-foreground' : 'text-secondary',
            )}
          >
            Revisão & pagamento
          </span>
        </li>
      </ol>
    </nav>
  );
}
