import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '../features/auth/components/protected-route';
import { useWallets } from '../features/wallets/hooks/use-wallets';
import { WalletModal } from '../features/wallets/components/WalletModal';
import { AccountPageHeader, AccountSidebar } from '../features/profile/components/AccountSidebar';
import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Wallet as WalletIcon,
} from 'lucide-react';
import type { Wallet } from '../shared/types/contracts';
import { cn } from '../shared/ui/utils';

export const Route = createFileRoute('/wallets')({
  component: WalletsRouteComponent,
});

const NETWORKS = ['Ethereum Mainnet', 'Sepolia Testnet', 'Polygon PoS', 'Arbitrum One'];

const inputClass =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60';

const labelClass = 'mb-1.5 block text-[15px] leading-[15px] text-foreground';

function WalletsRouteComponent() {
  return (
    <ProtectedRoute>
      <WalletsView />
    </ProtectedRoute>
  );
}

function WalletsView() {
  const {
    wallets,
    isLoading,
    isError,
    createWallet,
    updateWallet,
    isUpdatingWallet,
    refetch,
  } = useWallets();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const primaryWallet =
    wallets.find((w) => w.isDefault) ?? wallets.find((w) => w.type === 'primary') ?? wallets[0];
  const secondaryWallets = wallets.filter((w) => w.type === 'secondary');

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [network, setNetwork] = useState('Ethereum Mainnet');
  const [profileName, setProfileName] = useState('');
  const [address, setAddress] = useState('');
  const [ens, setEns] = useState('');
  const [type, setType] = useState<'primary' | 'secondary'>('primary');
  const [referralCode, setReferralCode] = useState('');
  const [email, setEmail] = useState('');
  const [ensSecondary, setEnsSecondary] = useState('');
  const [sameAsPrimary, setSameAsPrimary] = useState(true);

  useEffect(() => {
    if (!primaryWallet) return;
    setName(primaryWallet.name);
    setAddress(primaryWallet.address);
    setNetwork(primaryWallet.network);
    setType(primaryWallet.type);
    setNickname(primaryWallet.name.split(' ')[0] ?? '');
    setProfileName(primaryWallet.name);
    setEns(primaryWallet.name.toLowerCase().replace(/\s+/g, ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryWallet?.id]);

  const handleOpenCreate = () => {
    setWalletToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setWalletToEdit(wallet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setWalletToEdit(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    try {
      if (primaryWallet) {
        await updateWallet({ id: primaryWallet.id, data: { name, type: type === 'primary' ? 'primary' : 'secondary' } });
      } else {
        if (!address.trim().startsWith('0x')) {
          setSaveError('Informe um endereço público iniciado com 0x para cadastrar a carteira.');
          return;
        }
        await createWallet({ name, address, type: type === 'primary' ? 'primary' : 'secondary', network });
      }
      setSaveSuccess('Carteira salva com sucesso.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch {
      setSaveError('Não foi possível salvar a carteira. Verifique os dados e tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink py-16">
        <div className="space-y-4 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-[12px] text-muted">Carregando carteiras conectadas...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-16">
        <div className="w-full max-w-lg rounded-[6px] bg-surface-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-[22px] font-bold text-foreground">Falha ao consultar carteiras</h1>
          <p className="mt-2 text-[13px] leading-6 text-secondary">
            Não foi possível carregar as carteiras conectadas à sua conta. Verifique sua conexão e
            tente novamente.
          </p>
          <button type="button" onClick={() => void refetch()} className="btn-primary mt-6">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="container py-8 sm:py-12">
        <AccountPageHeader
          title="Carteiras"
          description="Cadastre e gerencie suas carteiras principal e secundária para autorização e liquidação de compras."
        />

        <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
          <AccountSidebar />

          <div className="min-w-0 flex-1 space-y-7">
            <WalletModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              walletToEdit={walletToEdit}
              onCreate={createWallet}
              onUpdate={(id, data) => updateWallet({ id, data })}
            />

            {/* Carteira principal */}
            <section aria-labelledby="main-wallet-heading" className="rounded-[6px] bg-surface-card p-5 sm:p-6">
              <div className="mb-1 flex items-center justify-between gap-4">
                <h2 id="main-wallet-heading" className="text-[16px] font-bold text-foreground">
                  Carteira principal
                </h2>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-primary px-3 text-[13px] font-medium text-accent transition-colors hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>
              <p className="mb-6 text-[13px] leading-5 text-secondary">
                Dados usados para assinar transações e emitir o certificado de posse dos NFTs.
              </p>

              {saveError && (
                <div
                  role="alert"
                  className="mb-5 flex items-center gap-2 rounded-[3px] border border-error/40 bg-error/10 p-3 text-[12px] text-error"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div
                  role="status"
                  className="mb-5 rounded-[3px] border border-success/40 bg-success/10 p-3 text-[12px] text-success"
                >
                  {saveSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
                <div>
                  <label htmlFor="wallet-name" className={labelClass}>
                    Nome <span className="text-[18px] leading-none text-coral">*</span>
                  </label>
                  <input
                    id="wallet-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="MetaMask principal"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-nickname" className={labelClass}>
                    Apelido
                  </label>
                  <input
                    id="wallet-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Como você chama esta carteira"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-network" className={labelClass}>
                    Rede
                  </label>
                  <select
                    id="wallet-network"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className={cn(inputClass, 'appearance-none')}
                  >
                    {NETWORKS.map((net) => (
                      <option key={net} value={net} className="bg-surface-card">
                        {net}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wallet-profile-name" className={labelClass}>
                    Nome do perfil
                  </label>
                  <input
                    id="wallet-profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nome exibido no perfil"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-address" className={labelClass}>
                    Endereço <span className="text-[18px] leading-none text-coral">*</span>
                  </label>
                  <input
                    id="wallet-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x71C...a897"
                    className={cn(inputClass, 'font-mono')}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-ens" className={labelClass}>
                    ENS ou secundária
                  </label>
                  <input
                    id="wallet-ens"
                    type="text"
                    value={ens}
                    onChange={(e) => setEns(e.target.value)}
                    placeholder="seunome.eth"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-type" className={labelClass}>
                    Tipo
                  </label>
                  <select
                    id="wallet-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as 'primary' | 'secondary')}
                    className={cn(inputClass, 'appearance-none')}
                  >
                    <option value="primary" className="bg-surface-card">
                      Principal
                    </option>
                    <option value="secondary" className="bg-surface-card">
                      Secundária
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="wallet-referral" className={labelClass}>
                    Código de indicação
                  </label>
                  <input
                    id="wallet-referral"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Opcional"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-email" className={labelClass}>
                    E-mail
                  </label>
                  <input
                    id="wallet-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wallet-ens-secondary" className={labelClass}>
                    ENS
                  </label>
                  <input
                    id="wallet-ens-secondary"
                    type="text"
                    value={ensSecondary}
                    onChange={(e) => setEnsSecondary(e.target.value)}
                    placeholder="0x... ou nome.eth"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isUpdatingWallet}
                  className="inline-flex h-10 min-w-[131px] items-center justify-center rounded-[3px] bg-primary px-6 text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdatingWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar carteira'
                  )}
                </button>
                {primaryWallet && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(primaryWallet)}
                    className="text-[13px] text-accent transition-colors hover:text-primary-light"
                  >
                    Editar configurações
                  </button>
                )}
              </div>
            </section>

            {/* Carteira secundária */}
            <section
              aria-labelledby="secondary-wallet-heading"
              className="rounded-[6px] bg-surface-card p-5 sm:p-6"
            >
              <h2 id="secondary-wallet-heading" className="text-[16px] font-bold text-foreground">
                Carteira secundária
              </h2>

              <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-secondary">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(e) => setSameAsPrimary(e.target.checked)}
                  className="h-4 w-4 rounded-[3px] border border-border bg-transparent accent-primary"
                />
                Igual à carteira principal
              </label>

              {secondaryWallets.length === 0 ? (
                <div className="mt-5 flex flex-col items-center justify-center rounded-[3px] border border-dashed border-border px-6 py-10 text-center">
                  <WalletIcon className="h-7 w-7 text-muted" />
                  <p className="mt-3 text-[13px] text-secondary">
                    Nenhuma carteira secundária cadastrada.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-primary px-3 text-[13px] font-medium text-accent transition-colors hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar carteira
                  </button>
                </div>
              ) : (
                <ul className="mt-5 divide-y divide-border/60" role="list">
                  {secondaryWallets.map((wallet) => (
                    <li key={wallet.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-bold text-foreground">{wallet.name}</p>
                        <p className="truncate font-mono text-[12px] text-muted">{wallet.address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(wallet)}
                        className="shrink-0 text-[13px] text-accent transition-colors hover:text-primary-light"
                      >
                        Editar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
