import { useState } from 'react';
import {
  Wallet as WalletIcon,
  Check,
  Copy,
  Edit2,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import { formatEthDisplay } from '../../../shared/utils/currency';
import type { Wallet } from '../../../shared/types/contracts';

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
}

export function WalletCard({ wallet, onEdit }: WalletCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPrimary = wallet.type === 'primary';

  return (
    <div className="flex flex-col justify-between rounded-[6px] bg-surface-card p-5 transition-colors hover:bg-surface-raised/60">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isPrimary
                  ? 'border-primary/40 bg-primary/10 text-accent'
                  : 'border-border text-muted'
              }`}
            >
              {isPrimary ? 'Principal' : 'Secundária'}
            </span>

            {wallet.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                <Star className="h-3 w-3 fill-primary text-primary" />
                Padrão
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onEdit(wallet)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
            title="Editar configurações da carteira"
            aria-label="Editar carteira"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <h3 className="mb-1 flex items-center gap-2 text-[16px] font-bold text-foreground">
          <WalletIcon className="h-4 w-4 text-primary" />
          <span className="truncate">{wallet.name}</span>
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <p className="truncate font-mono text-[12px] text-secondary select-all">{wallet.address}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-sm p-1 text-muted transition-colors hover:text-foreground"
            title="Copiar endereço completo"
            aria-label="Copiar endereço completo"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-muted">
            Saldo disponível
          </span>
          <strong className="font-mono text-[16px] font-bold text-accent">
            {formatEthDisplay(wallet.balanceEth)}
          </strong>
        </div>

        <div className="text-right">
          <span className="block text-[10px] uppercase tracking-wider text-muted">Rede</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground">
            {wallet.network} <ArrowUpRight className="h-3 w-3 text-primary" />
          </span>
        </div>
      </div>
    </div>
  );
}
