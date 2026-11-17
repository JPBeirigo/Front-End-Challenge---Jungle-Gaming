import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { LogOut, ShoppingBag, User, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../auth/context/use-auth';
import { cn } from '../../../shared/ui/utils';

interface AccountNavItem {
  label: string;
  to: '/profile' | '/wallets' | '/cart';
  icon: LucideIcon;
}

const ITEMS: AccountNavItem[] = [
  { label: 'Perfil do colecionador', to: '/profile', icon: User },
  { label: 'Minhas carteiras', to: '/wallets', icon: Wallet },
  { label: 'Carrinho', to: '/cart', icon: ShoppingBag },
];

/**
 * Sidebar de conta no padrão do Figma: 310 de largura, itens de 45 de altura,
 * item ativo com borda primary e "Sair" abaixo de um hairline.
 */
export function AccountSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    void navigate({ to: '/' });
  };

  return (
    <aside className="w-full rounded-[6px] bg-surface-card p-2 lg:min-h-[407px] lg:w-[310px] lg:shrink-0">
      <nav aria-label="Navegação da conta" className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-[45px] items-center gap-3 rounded-[3px] border px-4 text-[15px] transition-colors',
                isActive
                  ? 'border-primary bg-primary/5 text-accent'
                  : 'border-transparent text-secondary hover:border-border hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-2 h-px w-full bg-border" aria-hidden />

      <button
        type="button"
        onClick={() => void handleLogout()}
        className="flex h-[45px] w-full items-center gap-3 rounded-[3px] border border-transparent px-4 text-[15px] text-secondary transition-colors hover:border-border hover:text-error"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>Sair</span>
      </button>
    </aside>
  );
}

interface AccountPageHeaderProps {
  title: string;
  description?: string;
}

export function AccountPageHeader({ title, description }: AccountPageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-[28px] font-bold leading-tight text-foreground">{title}</h1>
      {description && <p className="mt-1.5 text-[14px] leading-6 text-secondary">{description}</p>}
    </header>
  );
}
