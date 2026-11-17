import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { profileFormSchema, type ProfileFormData } from '../schemas/profile.schema';
import { AvatarSection } from './AvatarSection';
import { AppApiError } from '../../../shared/api/errors';
import { cn } from '../../../shared/ui/utils';
import type { User as UserContract } from '../../../shared/types/contracts';

interface ProfileDataFormProps {
  user: UserContract;
  onSave: (data: ProfileFormData) => Promise<void>;
  isSaving: boolean;
}

const inputClass =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:text-muted';

const labelClass = 'mb-1.5 block text-[15px] leading-[15px] text-foreground';

export function ProfileDataForm({ user, onSave, isSaving }: ProfileDataFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [username, setUsername] = useState(user.email.split('@')[0] ?? '');
  const [nickname, setNickname] = useState(user.name.split(' ')[0] ?? '');
  const [ensName, setEnsName] = useState(user.name.toLowerCase().replace(/\s+/g, ''));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
    },
  });

  const currentAvatarUrl = watch('avatarUrl');

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setServerError(null);
      setSuccessMessage(null);
      await onSave(data);
      setSuccessMessage('Dados do perfil atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      if (err instanceof AppApiError) {
        setServerError(err.message);
      } else {
        setServerError('Erro ao atualizar o perfil. Tente novamente.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[3px] border border-success/40 bg-success/10 p-3 text-[12px] text-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-[3px] border border-error/40 bg-error/10 p-3 text-[12px] text-error"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Grade de campos */}
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        {/* Nome de exibição */}
        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Nome de exibição <span className="text-[18px] leading-none text-coral">*</span>
          </label>
          <input
            id="profile-name"
            type="text"
            disabled={isSaving}
            {...register('name')}
            aria-invalid={!!errors.name}
            className={cn(inputClass, errors.name && 'border-error focus:border-error')}
          />
          {errors.name && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Nome de usuário */}
        <div>
          <label htmlFor="profile-username" className={labelClass}>
            Nome de usuário
          </label>
          <input
            id="profile-username"
            type="text"
            disabled={isSaving}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="profile-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="profile-email"
            type="email"
            disabled
            value={user.email}
            className={inputClass}
          />
        </div>

        {/* Nome ENS */}
        <div>
          <label htmlFor="profile-ens" className={labelClass}>
            Nome ENS
          </label>
          <div className="flex">
            <select
              aria-label="Sufixo ENS"
              disabled={isSaving}
              className="h-10 w-[78px] shrink-0 rounded-l-[3px] border border-r-0 border-border bg-transparent px-2 text-[13px] text-secondary outline-none focus:border-primary"
            >
              <option className="bg-surface-card">.eth</option>
              <option className="bg-surface-card">.xyz</option>
            </select>
            <input
              id="profile-ens"
              type="text"
              disabled={isSaving}
              value={ensName}
              onChange={(e) => setEnsName(e.target.value)}
              className={cn(inputClass, 'rounded-l-none')}
            />
          </div>
        </div>

        {/* Apelido */}
        <div>
          <label htmlFor="profile-nickname" className={labelClass}>
            Apelido
          </label>
          <input
            id="profile-nickname"
            type="text"
            disabled={isSaving}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Avatar */}
        <div>
          <span className={labelClass}>Avatar</span>
          <AvatarSection
            currentAvatarUrl={currentAvatarUrl}
            onSelectAvatar={(url) =>
              setValue('avatarUrl', url, { shouldDirty: true, shouldValidate: true })
            }
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Biografia / interesses */}
      <div>
        <label htmlFor="profile-bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="profile-bio"
          rows={3}
          disabled={isSaving}
          {...register('bio')}
          placeholder="Conte um pouco sobre as obras que você coleciona..."
          className={cn(
            'w-full resize-none rounded-[3px] border border-border bg-transparent px-3 py-2.5 text-[14px] leading-6 text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary',
            errors.bio && 'border-error focus:border-error',
          )}
        />
        {errors.bio && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
            <AlertCircle className="h-3 w-3" />
            {errors.bio.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className="inline-flex h-10 min-w-[131px] items-center justify-center rounded-[3px] bg-primary px-6 text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </button>
      </div>
    </form>
  );
}
