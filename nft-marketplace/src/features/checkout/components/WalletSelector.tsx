import {
  CheckCircle2,
  AlertTriangle,
  Check,
  Unplug,
  Zap,
  Loader2,
} from 'lucide-react';
import { formatEthDisplay } from '../../../shared/utils/currency';
import { cn } from '../../../shared/ui/utils';
import type { Wallet } from '../../../shared/types/contracts';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWalletId: string;
  onSelectWallet: (walletId: string) => void;
  selectedNetwork: string;
  onSelectNetwork: (network: string) => void;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  simulateRefusal: boolean;
  onToggleSimulateRefusal: (val: boolean) => void;
  walletError: string | null;
  hasInsufficientBalance: boolean;
  totalEth: string;
  disabled?: boolean;
}

const AVAILABLE_NETWORKS = [
  'Ethereum Mainnet',
  'Sepolia Testnet',
  'Polygon PoS',
  'Arbitrum One',
];

const inputClass =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60';

const labelClass = 'mb-1.5 block text-[15px] leading-[15px] text-foreground';

/**
 * Seleção de carteira e rede no padrão do Figma: cards surface-card,
 * seleção com borda primary e alertas em success/error/primary.
 */
export function WalletSelector({
  wallets,
  selectedWalletId,
  onSelectWallet,
  selectedNetwork,
  onSelectNetwork,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  simulateRefusal,
  onToggleSimulateRefusal,
  walletError,
  hasInsufficientBalance,
  totalEth,
  disabled,
}: WalletSelectorProps) {
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  return (
    <section aria-labelledby="wallet-selector-heading" className="rounded-[6px] bg-surface-card p-5 sm:p-6">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <h2 id="wallet-selector-heading" className="text-[18px] font-bold leading-4 text-foreground">
          Carteira e rede
        </h2>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 text-[11px] font-bold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                Conectada
              </span>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={disabled}
                className="flex h-7 w-7 items-center justify-center rounded-[3px] text-muted transition-colors hover:bg-surface-raised hover:text-error disabled:opacity-40"
                title="Desconectar carteira"
                aria-label="Desconectar carteira"
              >
                <Unplug className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={disabled || isConnecting}
              className="inline-flex h-8 items-center gap-1.5 rounded-[3px] bg-primary px-3 text-[12px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Conectar carteira
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <p className="mb-6 text-[13px] leading-5 text-secondary">
        Selecione a carteira conectada para autorizar o débito em ETH.
      </p>

      {walletError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-[3px] border border-error/40 bg-error/10 p-3 text-[12px] leading-5 text-error"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{walletError}</span>
        </div>
      )}

      <div className="mb-6">
        <span className={labelClass}>Carteiras cadastradas na sua conta</span>

        {wallets.length === 0 ? (
          <div className="rounded-[3px] border border-dashed border-border px-4 py-6 text-center">
            <p className="text-[13px] text-secondary">
              Nenhuma carteira encontrada. Cadastre uma em "Minhas carteiras".
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Carteiras disponíveis"
          >
            {wallets.map((wallet) => {
              const isSelected = wallet.id === selectedWalletId;
              return (
                <div
                  key={wallet.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={disabled ? -1 : 0}
                  onClick={() => !disabled && onSelectWallet(wallet.id)}
                  onKeyDown={(e) => {
                    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
                      e.preventDefault();
                      onSelectWallet(wallet.id);
                    }
                  }}
                  className={cn(
                    'cursor-pointer select-none rounded-[3px] border p-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                    disabled && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-foreground">
                      <span className="truncate">{wallet.name}</span>
                      {wallet.isDefault && (
                        <span className="shrink-0 rounded-full border border-primary/40 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-accent">
                          Padrão
                        </span>
                      )}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-border"
                        aria-hidden
                      />
                    )}
                  </div>

                  <p className="mt-1.5 truncate font-mono text-[11px] text-muted">{wallet.address}</p>

                  <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                    <span className="text-secondary">Saldo</span>
                    <strong className="font-mono font-bold text-accent">
                      {formatEthDisplay(wallet.balanceEth)}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasInsufficientBalance && isConnected && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-[3px] border border-primary/40 bg-primary/10 p-3 text-[12px] leading-5 text-accent"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong className="mb-0.5 block font-bold">Saldo insuficiente</strong>
            <p>
              A carteira selecionada possui{' '}
              {selectedWallet ? formatEthDisplay(selectedWallet.balanceEth) : '0 ETH'}, abaixo do
              total da transação ({formatEthDisplay(totalEth)}). Selecione outra carteira ou
              adicione fundos.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-7 gap-y-5 border-t border-border pt-5 sm:grid-cols-2">
        <div>
          <label htmlFor="select-network" className={labelClass}>
            Rede de liquidação
          </label>
          <select
            id="select-network"
            disabled={disabled}
            value={selectedNetwork}
            onChange={(e) => onSelectNetwork(e.target.value)}
            className={cn(inputClass, 'appearance-none')}
          >
            {AVAILABLE_NETWORKS.map((net) => (
              <option key={net} value={net} className="bg-surface-card text-foreground">
                {net}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-[3px] border border-border px-3 py-2.5 text-[12px] leading-4 text-secondary transition-colors hover:border-primary/40">
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border',
                simulateRefusal ? 'border-primary bg-primary text-ink' : 'border-border',
              )}
              aria-hidden
            >
              {simulateRefusal && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <input
              type="checkbox"
              checked={simulateRefusal}
              onChange={(e) => onToggleSimulateRefusal(e.target.checked)}
              className="sr-only"
            />
            <span>Simular recusa na carteira</span>
          </label>
        </div>
      </div>
    </section>
  );
}
