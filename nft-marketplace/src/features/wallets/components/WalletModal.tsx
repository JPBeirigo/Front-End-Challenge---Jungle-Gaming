import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Wallet as WalletIcon, AlertCircle, Loader2 } from 'lucide-react';
import {
  walletFormSchema,
  editWalletFormSchema,
  type WalletFormData,
  type EditWalletFormData,
} from '../schemas/wallet.schema';
import { AppApiError } from '../../../shared/api/errors';
import { cn } from '../../../shared/ui/utils';
import type { Wallet, CreateWalletRequest, UpdateWalletRequest } from '../../../shared/types/contracts';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletToEdit?: Wallet | null;
  onCreate: (data: CreateWalletRequest) => Promise<Wallet>;
  onUpdate: (id: string, data: UpdateWalletRequest) => Promise<Wallet>;
}

const AVAILABLE_NETWORKS = [
  'Ethereum Mainnet',
  'Sepolia Testnet',
  'Polygon PoS',
  'Arbitrum One',
];

const inputClass =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary';

const labelClass = 'mb-1.5 block text-[15px] leading-[15px] text-foreground';

export function WalletModal({
  isOpen,
  onClose,
  walletToEdit,
  onCreate,
  onUpdate,
}: WalletModalProps) {
  const isEditing = !!walletToEdit;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useForm<WalletFormData>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: '',
      address: '',
      type: 'primary',
      network: 'Ethereum Mainnet',
    },
  });

  const editForm = useForm<EditWalletFormData>({
    resolver: zodResolver(editWalletFormSchema),
    defaultValues: {
      name: '',
      type: 'primary',
      isDefault: false,
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (walletToEdit) {
      editForm.reset({
        name: walletToEdit.name,
        type: walletToEdit.type,
        isDefault: walletToEdit.isDefault,
      });
    } else {
      createForm.reset({
        name: '',
        address: '',
        type: 'primary',
        network: 'Ethereum Mainnet',
      });
    }
    setServerError(null);
  }, [walletToEdit, isOpen, createForm, editForm]);

  if (!isOpen) return null;

  const handleCreateSubmit = async (data: WalletFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await onCreate({
        name: data.name,
        address: data.address,
        type: data.type,
        network: data.network,
      });
      onClose();
    } catch (err) {
      if (err instanceof AppApiError) {
        setServerError(err.message);
      } else {
        setServerError('Erro ao cadastrar carteira. Verifique os dados e tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: EditWalletFormData) => {
    if (!walletToEdit) return;
    try {
      setIsSubmitting(true);
      setServerError(null);
      await onUpdate(walletToEdit.id, {
        name: data.name,
        type: data.type,
        isDefault: data.isDefault,
      });
      onClose();
    } catch (err) {
      if (err instanceof AppApiError) {
        setServerError(err.message);
      } else {
        setServerError('Erro ao atualizar carteira. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-[500px] rounded-[6px] bg-surface-card p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-raised hover:text-foreground"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="wallet-modal-title" className="text-[16px] font-bold text-foreground">
              {isEditing ? 'Editar carteira' : 'Cadastrar nova carteira'}
            </h2>
            <p className="text-[12px] text-secondary">
              {isEditing
                ? 'Atualize a identificação ou torne esta carteira padrão.'
                : 'Adicione uma carteira para liquidação de pedidos de NFTs.'}
            </p>
          </div>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-[3px] border border-error/40 bg-error/10 p-3 text-[12px] text-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {!isEditing ? (
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-5">
            <div>
              <label htmlFor="create-wallet-name" className={labelClass}>
                Nome da carteira <span className="text-[18px] leading-none text-coral">*</span>
              </label>
              <input
                id="create-wallet-name"
                type="text"
                disabled={isSubmitting}
                {...createForm.register('name')}
                placeholder="Ex: MetaMask principal"
                className={cn(inputClass, createForm.formState.errors.name && 'border-error')}
              />
              {createForm.formState.errors.name && (
                <p className="mt-1 text-[11px] text-error">{createForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="create-wallet-address" className={labelClass}>
                Endereço público (0x...) <span className="text-[18px] leading-none text-coral">*</span>
              </label>
              <input
                id="create-wallet-address"
                type="text"
                disabled={isSubmitting}
                {...createForm.register('address')}
                placeholder="0x71C...a897"
                className={cn(inputClass, 'font-mono', createForm.formState.errors.address && 'border-error')}
              />
              {createForm.formState.errors.address && (
                <p className="mt-1 text-[11px] text-error">
                  {createForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="create-wallet-type" className={labelClass}>
                  Classificação
                </label>
                <select
                  id="create-wallet-type"
                  disabled={isSubmitting}
                  {...createForm.register('type')}
                  className={inputClass}
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
                <label htmlFor="create-wallet-network" className={labelClass}>
                  Rede blockchain
                </label>
                <select
                  id="create-wallet-network"
                  disabled={isSubmitting}
                  {...createForm.register('network')}
                  className={inputClass}
                >
                  {AVAILABLE_NETWORKS.map((net) => (
                    <option key={net} value={net} className="bg-surface-card">
                      {net}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-[3px] border border-border px-4 text-[13px] text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] bg-primary px-5 text-[13px] font-bold text-ink transition-colors hover:bg-primary-light disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Salvar carteira'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-5">
            <div>
              <span className="mb-1 block text-[12px] text-muted">Endereço público</span>
              <p className="rounded-[3px] border border-border p-3 font-mono text-[13px] text-secondary">
                {walletToEdit?.address}
              </p>
            </div>

            <div>
              <label htmlFor="edit-wallet-name" className={labelClass}>
                Nome da carteira <span className="text-[18px] leading-none text-coral">*</span>
              </label>
              <input
                id="edit-wallet-name"
                type="text"
                disabled={isSubmitting}
                {...editForm.register('name')}
                className={cn(inputClass, editForm.formState.errors.name && 'border-error')}
              />
              {editForm.formState.errors.name && (
                <p className="mt-1 text-[11px] text-error">{editForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-wallet-type" className={labelClass}>
                Classificação
              </label>
              <select
                id="edit-wallet-type"
                disabled={isSubmitting}
                {...editForm.register('type')}
                className={inputClass}
              >
                <option value="primary" className="bg-surface-card">
                  Principal
                </option>
                <option value="secondary" className="bg-surface-card">
                  Secundária
                </option>
              </select>
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-secondary">
              <input
                type="checkbox"
                disabled={isSubmitting}
                {...editForm.register('isDefault')}
                className="h-4 w-4 rounded-[3px] border border-border accent-primary"
              />
              <span>Definir como carteira padrão para compras</span>
            </label>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-[3px] border border-border px-4 text-[13px] text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[3px] bg-primary px-5 text-[13px] font-bold text-ink transition-colors hover:bg-primary-light disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Atualizar carteira'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
