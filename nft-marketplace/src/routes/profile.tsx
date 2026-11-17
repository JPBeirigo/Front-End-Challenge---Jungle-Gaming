import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { ProtectedRoute } from '../features/auth/components/protected-route';
import { useProfile } from '../features/profile/hooks/use-profile';
import { ProfileDataForm } from '../features/profile/components/ProfileDataForm';
import { ChangePasswordForm } from '../features/profile/components/ChangePasswordForm';
import { AccountPageHeader, AccountSidebar } from '../features/profile/components/AccountSidebar';
import { LayoutDashboard, Lock } from 'lucide-react';

export const Route = createFileRoute('/profile')({
  component: ProfileRouteComponent,
});

function ProfileRouteComponent() {
  return (
    <ProtectedRoute>
      <ProfileView />
    </ProtectedRoute>
  );
}

function ProfileView() {
  const {
    profile,
    isLoading,
    updateProfile,
    isUpdatingProfile,
    changePassword,
    isChangingPassword,
  } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink py-16">
        <div className="space-y-4 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-[12px] text-muted">Carregando perfil do colecionador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-foreground">
      <div className="container py-8 sm:py-12">
        <AccountPageHeader
          title="Perfil do colecionador"
          description="Gerencie sua identidade pública, avatar e credenciais de segurança."
        />

        <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
          <AccountSidebar />

          <div className="min-w-0 flex-1 space-y-7">
            <section
              aria-labelledby="profile-details-heading"
              className="rounded-[6px] bg-surface-card p-5 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <h2 id="profile-details-heading" className="text-[16px] font-bold text-foreground">
                  Dados do perfil
                </h2>
              </div>

              <ProfileDataForm
                user={profile}
                onSave={async (data) => {
                  await updateProfile(data);
                }}
                isSaving={isUpdatingProfile}
              />
            </section>

            <section
              aria-labelledby="profile-password-heading"
              className="rounded-[6px] bg-surface-card p-5 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                <Lock className="h-4 w-4 text-primary" />
                <h2 id="profile-password-heading" className="text-[16px] font-bold text-foreground">
                  Alterar senha
                </h2>
              </div>

              <ChangePasswordForm
                onChangePassword={changePassword}
                isSubmitting={isChangingPassword}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
