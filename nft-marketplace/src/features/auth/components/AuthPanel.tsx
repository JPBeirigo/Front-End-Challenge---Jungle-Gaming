import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { cn } from '../../../shared/ui/utils';

/**
 * Fundo decorativo que simula o marketplace atrás do modal de autenticação.
 * É puramente visual (aria-hidden) e não intercepta eventos.
 */
export function AuthMarketplacePreview() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      <div className="container py-10">
        <div className="flex items-center justify-between border-b border-primary/30 pb-4">
          <span className="text-lg font-bold tracking-[0.1em] text-foreground">KURIO.</span>
          <div className="hidden items-center gap-10 text-[15px] text-secondary md:flex">
            <span>Início</span>
            <span className="font-bold text-accent">Mercado</span>
            <span>Criadores</span>
            <span>Aprenda</span>
          </div>
          <span className="h-[35px] w-[100px] rounded-[6px] bg-primary/80" />
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,600px)_450px] lg:gap-[110px]">
          <div>
            <span className="eyebrow">Marketplace de arte digital</span>
            <div className="mt-4 space-y-3">
              <div className="h-10 w-full rounded-sm bg-surface-raised/80" />
              <div className="h-10 w-4/5 rounded-sm bg-surface-raised/60" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-3 w-full rounded-sm bg-surface-raised/40" />
              <div className="h-3 w-3/4 rounded-sm bg-surface-raised/40" />
            </div>
            <div className="mt-8 h-10 w-[140px] rounded-[6px] bg-primary/70" />
          </div>
          <div className="hidden aspect-square rounded-[24px] bg-surface-card lg:block" />
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[258/300] rounded-[6px] bg-surface-card" />
              <div className="h-4 w-3/4 rounded-sm bg-surface-raised/60" />
              <div className="h-4 w-1/3 rounded-sm bg-primary/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AuthModalProps {
  children: ReactNode;
  /** Altura mínima aproximada do frame do Figma (600 login / 656 cadastro). */
  minHeight?: number;
  className?: string;
}

/**
 * Moldura do modal de autenticação: surface-card, faixa primary de 10px na
 * base e X de fechar no canto superior direito.
 */
export function AuthModal({ children, minHeight = 600, className }: AuthModalProps) {
  return (
    <div className={cn('relative z-10 w-full max-w-[500px]', className)}>
      <div
        className="relative flex flex-col overflow-hidden rounded-[6px] bg-surface-card shadow-[0_24px_60px_-20px_rgba(14,9,7,0.6)]"
        style={{ minHeight }}
      >
        <Link
          to="/"
          aria-label="Fechar autenticação"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-20">{children}</div>

        <div className="h-[10px] w-full shrink-0 bg-primary" aria-hidden />
      </div>
    </div>
  );
}

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 isolate overflow-y-auto bg-ink">
      <AuthMarketplacePreview />
      <div className="absolute inset-0 bg-ink/90 backdrop-blur-[2px]" aria-hidden />
      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}

interface AuthTabsProps {
  active: 'login' | 'register';
  redirect?: string;
}

/** Cabeçalho "Entrar | Criar conta" com divisor coral. */
export function AuthTabs({ active, redirect }: AuthTabsProps) {
  return (
    <div className="flex items-center justify-center gap-4 text-[20px] font-medium leading-none">
      <Link
        to="/login"
        search={{ redirect }}
        aria-current={active === 'login' ? 'page' : undefined}
        className={cn(
          'transition-colors hover:text-accent',
          active === 'login' ? 'text-accent' : 'text-secondary',
        )}
      >
        Entrar
      </Link>
      <span className="h-5 w-px bg-coral" aria-hidden />
      <Link
        to="/register"
        search={{ redirect }}
        aria-current={active === 'register' ? 'page' : undefined}
        className={cn(
          'transition-colors hover:text-accent',
          active === 'register' ? 'text-accent' : 'text-secondary',
        )}
      >
        Criar conta
      </Link>
    </div>
  );
}

/** Divisor "Ou continue com". */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-[12px] text-muted">{label}</span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
