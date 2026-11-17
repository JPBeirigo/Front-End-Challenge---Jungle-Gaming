import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletsApi } from '../../../shared/api/services';
import { useAuth } from '../../auth/context/use-auth';
import { AppApiError } from '../../../shared/api/errors';
import type { Wallet, CreateWalletRequest, UpdateWalletRequest } from '../../../shared/types/contracts';

export const walletKeys = {
  all: (userId?: string) => ['wallets', userId ?? 'anonymous'] as const,
};

export function useWallets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = walletKeys.all(user?.id);

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => walletsApi.list(signal),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createWalletMutation = useMutation({
    mutationFn: (data: CreateWalletRequest) => walletsApi.create(data),
    onSuccess: (newWallet: Wallet) => {
      queryClient.setQueryData<Wallet[]>(queryKey, (old = []) => [...old, newWallet]);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      throw AppApiError.fromUnknown(err);
    },
  });

  const updateWalletMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWalletRequest }) =>
      walletsApi.update(id, data),
    onSuccess: (updated: Wallet) => {
      queryClient.setQueryData<Wallet[]>(queryKey, (old = []) =>
        old.map((w) => (w.id === updated.id ? updated : updated.isDefault ? { ...w, isDefault: false } : w))
      );
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      throw AppApiError.fromUnknown(err);
    },
  });

  const wallets = query.data ?? [];
  const defaultWallet = wallets.find((w: Wallet) => w.isDefault) ?? wallets[0] ?? null;

  return {
    wallets,
    defaultWallet,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createWallet: createWalletMutation.mutateAsync,
    isCreatingWallet: createWalletMutation.isPending,
    updateWallet: updateWalletMutation.mutateAsync,
    isUpdatingWallet: updateWalletMutation.isPending,
    refetch: query.refetch,
  };
}
