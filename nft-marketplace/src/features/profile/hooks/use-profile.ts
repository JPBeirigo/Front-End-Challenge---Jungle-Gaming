import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../../shared/api/services';
import { useAuth } from '../../auth/context/use-auth';
import { AppApiError } from '../../../shared/api/errors';
import type { UpdateProfileRequest, ChangePasswordRequest, User } from '../../../shared/types/contracts';

export const AVATAR_PRESETS = [
  {
    id: 'preset_1',
    label: 'Cyber Punk',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'preset_2',
    label: 'Cosmic Curator',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'preset_3',
    label: 'Nebula Artist',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'preset_4',
    label: 'Digital Voyager',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'preset_5',
    label: 'Neo Classic',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
];

export const profileKeys = {
  detail: (userId?: string) => ['profile', userId ?? 'anonymous'] as const,
};

export function useProfile() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const profileKey = profileKeys.detail(user?.id);

  const query = useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.update(data),
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(profileKey, updatedUser);
      updateUser(updatedUser);
    },
    onError: (err) => {
      throw AppApiError.fromUnknown(err);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileApi.changePassword(data),
    onError: (err) => {
      throw AppApiError.fromUnknown(err);
    },
  });

  return {
    profile: query.data ?? user,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    refetch: query.refetch,
  };
}
