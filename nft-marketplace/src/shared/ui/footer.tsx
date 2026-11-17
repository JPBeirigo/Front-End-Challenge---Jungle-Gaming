import { Link } from '@tanstack/react-router';
import { ArrowRight, Mail, Phone } from 'lucide-react';

const FEATURES = [
  {
    letter: 'K',
    title: 'Curadoria de autor',
    text: 'Cada obra passa por uma curadoria independente antes de entrar no mercado.',
  },
  {
    letter: 'U',
    title: 'Edições verificadas',
    text: 'Autenticidade e proveniência registradas on-chain, edição por edição.',
  },
  {
    letter: 'R',
    title: 'Compra segura',
    text: 'Liquidação protegida por contrato inteligente e carteiras validadas.',
  },
];

export function Footer() {
  return (
    <footer className="mt-auto text-xs text-brand-muted">
      {/* Faixa superior de destaques */}
      <div className="bg-brand-card">
        <div className="container py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.15fr]">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={
                  index > 0
                    ? 'flex items-start gap-4 xl:border-l xl:border-brand-border xl:pl-8'
                    : 'flex items-start gap-4'
                }
              >
                <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-ink">
                  {feature.letter}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold leading-tight text-brand-cream">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-[22px] text-brand-gold">{feature.text}</p>
                </div>
              </div>
            ))}

            {/* Newsletter */}
            <div className="xl:border-l xl:border-brand-border xl:pl-8">
              <h3 className="text-[17px] font-bold leading-tight text-brand-cream">
                Diário da Cunhagem
              </h3>
              <p className="mt-1.5 text-sm leading-[22px] text-brand-gold">
                Receba lançamentos, curadorias e bastidores antes de todo mundo.
              </p>
              <form
                className="mt-4 flex max-w-[325px] items-center gap-2 rounded-[6px] bg-surface-dark px-3"
                onSubmit={(e) => e.preventDefault()}
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Seu e-mail
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-10 flex-1 bg-transparent text-sm text-brand-cream outline-none placeholder:text-brand-sand"
                />
                <button
                  type="submit"
                  aria-label="Assinar newsletter"
                  className="p-1 text-primary transition-colors hover:text-primary-light"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa da marca */}
      <div className="bg-surface-dark">
        <div className="container flex min-h-[88px] flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-lg font-bold tracking-[0.1em] text-brand-cream transition-colors hover:text-accent"
            >
              KURIO<span className="text-primary">.</span>
            </Link>
            <p className="max-w-[280px] text-sm leading-[22px] text-brand-gold">
              Arte digital para quem coleciona histórias, não apenas imagens.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-brand-gold sm:items-end">
            <a
              href="mailto:contato@kurio.market"
              className="inline-flex items-center gap-2 transition-colors hover:text-accent"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              contato@kurio.market
            </a>
            <a
              href="tel:+551140028922"
              className="inline-flex items-center gap-2 transition-colors hover:text-accent"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              +55 11 4002-8922
            </a>
          </div>
        </div>
      </div>

      {/* Links e copyright */}
      <div className="bg-ink">
        <div className="container py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-[179px_179px_179px_1fr] md:gap-[124px]">
            <div>
              <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-brand-cream">
                Mercado
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a href="/#catalog" className="transition-colors hover:text-accent">
                    Todos os NFTs
                  </a>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ category: 'art' }}
                    className="transition-colors hover:text-accent"
                  >
                    Arte digital
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ category: 'collectibles' }}
                    className="transition-colors hover:text-accent"
                  >
                    Colecionáveis
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    search={{ category: 'photography' }}
                    className="transition-colors hover:text-accent"
                  >
                    Fotografia
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-brand-cream">
                Minha conta
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/profile" className="transition-colors hover:text-accent">
                    Perfil do colecionador
                  </Link>
                </li>
                <li>
                  <Link to="/wallets" className="transition-colors hover:text-accent">
                    Gerenciar carteiras
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="transition-colors hover:text-accent">
                    Carrinho
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition-colors hover:text-accent">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-brand-cream">
                Comunidade
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a href="/#blog" className="transition-colors hover:text-accent">
                    Diário da Cunhagem
                  </a>
                </li>
                <li>
                  <a href="/#criadores" className="transition-colors hover:text-accent">
                    Criadores
                  </a>
                </li>
                <li>
                  <a href="/#promos" className="transition-colors hover:text-accent">
                    Curadorias
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1 md:text-right">
              <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.08em] text-brand-cream">
                Contato
              </h3>
              <p className="max-w-[280px] text-sm leading-[22px] text-brand-gold md:ml-auto">
                Ambiente de desafio frontend com mocks realistas via MSW e tempo real via Socket.IO.
              </p>
              <span className="mt-4 inline-flex items-center rounded-sm border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-medium text-accent">
                Rede Ethereum · Sepolia / Mainnet (simulada)
              </span>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-brand-border/60 pt-6 text-[11px] text-brand-sand sm:flex-row">
            <p>© {new Date().getFullYear()} KURIO — Desafio Frontend. Todos os direitos reservados.</p>
            <p className="text-brand-sand">React · TypeScript · TanStack · Tailwind CSS</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
