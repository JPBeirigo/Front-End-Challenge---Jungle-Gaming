import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '../../features/auth/context/use-auth';
import { useCart } from '../../features/cart/hooks/use-cart';
import { Menu, X, ShoppingBag, LogOut, Wallet, User as UserIcon, ShieldAlert, Search } from 'lucide-react';
import { cn } from './utils';

const NAV_LINKS = [
  { label: 'Início', href: '/', match: (path: string) => path === '/' },
  { label: 'Mercado', href: '/#catalog', match: (path: string) => path.startsWith('/nfts') },
  { label: 'Criadores', href: '/#criadores', match: () => false },
  { label: 'Aprenda', href: '/#blog', match: () => false },
];

export function Navbar() {
  const { user, isAuthenticated, logout, sessionExpired, dismissSessionExpiredNotice } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: '/',
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          search: searchQuery.trim(),
          page: 1,
        }),
      });
      setMobileMenuOpen(false);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
  };

  return (
    <>
      {/* Alerta acessível de Sessão Expirada */}
      {sessionExpired && (
        <aside
          role="alert"
          aria-live="assertive"
          className="bg-destructive/15 border-b border-destructive/40 text-destructive-foreground px-4 py-2.5 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2 container mx-auto">
            <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
            <span>
              Sua sessão expirou por segurança. Faça login novamente para continuar suas compras e gerenciar sua conta.
            </span>
          </div>
          <button
            onClick={dismissSessionExpiredNotice}
            className="text-xs underline hover:no-underline ml-4"
          >
            Fechar
          </button>
        </aside>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-primary/40 bg-ink/95 backdrop-blur-md">
        <div className="container flex h-[64px] items-center justify-between gap-6">
          {/* Logo e Marca */}
          <Link
            to="/"
            aria-label="KURIO — página inicial"
            className="shrink-0 text-lg font-bold tracking-[0.1em] text-foreground transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            KURIO<span className="text-primary">.</span>
          </Link>

          {/* Navegação principal (Desktop) */}
          <nav aria-label="Navegação principal" className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => {
              const isActive = link.match(location.pathname);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative py-5 text-[15px] leading-none transition-colors hover:text-accent',
                    'after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[3px] after:rounded-full after:transition-colors',
                    isActive
                      ? 'font-bold text-accent after:bg-primary'
                      : 'font-normal text-foreground/85 after:bg-transparent',
                  )}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Ações */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar NFTs"
              aria-expanded={searchOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-foreground/85 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Carrinho */}
            <Link
              to="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm text-foreground/85 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Ver carrinho de NFTs"
              aria-label={`Carrinho de NFTs (${itemCount} itens)`}
            >
              <ShoppingBag className="h-6 w-6" />
              {itemCount > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-ink bg-primary px-0.5 text-[10px] font-medium leading-none text-ink"
                  aria-hidden="true"
                >
                  {itemCount}
                </span>
              )}
              <span className="sr-only">Carrinho com {itemCount} itens</span>
            </Link>

            {/* Autenticação & Usuário */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-sm border border-border bg-surface-card/60 p-1 pl-1.5 pr-2.5 text-foreground transition-colors hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  id="user-menu-button"
                >
                  <img
                    src={user.avatarUrl || '/assets/icons/User.svg'}
                    alt={`Avatar de ${user.name}`}
                    className="h-6 w-6 rounded-full object-cover border border-primary/30"
                  />
                  <span className="hidden max-w-[100px] truncate text-xs font-medium sm:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    className="absolute right-0 z-50 mt-2 w-48 rounded-sm border border-border bg-surface-card py-1 text-xs text-foreground shadow-xl animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="border-b border-border/60 px-3 py-2">
                      <p className="truncate font-semibold">{user.name}</p>
                      <p className="truncate text-[10px] text-muted">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>Meu Perfil</span>
                    </Link>

                    <Link
                      to="/wallets"
                      onClick={() => setUserDropdownOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Minhas Carteiras</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="mt-1 flex w-full items-center gap-2 border-t border-border/60 px-3 py-2 text-left text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  search={{ redirect: location.pathname }}
                  className="btn-primary h-[35px] w-[100px] rounded-[6px] px-5 text-[13px]"
                >
                  Entrar
                </Link>
              </div>
            )}

            {/* Botão de Menu Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex rounded-sm border border-border p-2 text-foreground transition-colors hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary lg:hidden"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Campo de busca expandido */}
        {searchOpen && (
          <div className="border-t border-border/60 bg-ink">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="container flex items-center gap-3 py-3"
            >
              <label htmlFor="header-search" className="sr-only">
                Buscar NFTs, artistas ou coleções
              </label>
              <Search className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden />
              <input
                ref={searchInputRef}
                id="header-search"
                type="search"
                placeholder="Buscar NFTs, artistas ou coleções..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-brand-muted"
              />
              <button type="submit" className="btn-primary h-9 px-4 text-xs">
                Buscar
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Fechar busca"
                className="p-1.5 text-brand-muted transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-surface-card/95 px-4 py-4 backdrop-blur-md lg:hidden">
            <nav className="flex flex-col gap-1 text-sm" aria-label="Navegação mobile">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-sm px-2 py-2 text-foreground transition-colors hover:bg-surface-raised"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-sm px-2 py-2 text-foreground transition-colors hover:bg-surface-raised"
              >
                <span>Carrinho</span>
                <span className="flex items-center gap-1.5">
                  {itemCount > 0 && (
                    <span className="rounded-full bg-brand-terracotta px-2 py-0.5 text-xs font-bold text-ink">
                      {itemCount}
                    </span>
                  )}
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-sm px-2 py-2 text-foreground transition-colors hover:bg-surface-raised"
                  >
                    Meu Perfil
                  </Link>
                  <Link
                    to="/wallets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-sm px-2 py-2 text-foreground transition-colors hover:bg-surface-raised"
                  >
                    Minhas Carteiras
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
