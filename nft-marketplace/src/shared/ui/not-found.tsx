import { Link } from '@tanstack/react-router';
import { ArrowLeft, Compass } from 'lucide-react';

/**
 * Página 404 no padrão dark quente do Figma.
 */
export function NotFoundComponent() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink text-foreground">
      <div className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-9 w-9" />
        </div>

        <span className="eyebrow">Erro 404</span>
        <h1 className="mt-3 text-[43px] font-bold uppercase leading-none tracking-tight text-foreground">
          Página não encontrada
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-6 text-secondary">
          O recurso ou rota que você tentou acessar não existe, foi movido ou está temporariamente
          indisponível.
        </p>

        <Link to="/" className="btn-primary mt-8 uppercase tracking-[0.04em]">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
