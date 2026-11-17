import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordFormData } from '../schemas/profile.schema';
import { AppApiError } from '../../../shared/api/errors';
import { cn } from '../../../shared/ui/utils';
import type { ChangePasswordRequest } from '../../../shared/types/contracts';

interface ChangePasswordFormProps {
  onChangePassword: (data: ChangePasswordRequest) => Promise<{ success: boolean }>;
  isSubmitting: boolean;
}

const inputClass =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 pr-10 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60';

const labelClass = 'mb-1.5 block text-[15px] leading-[15px] text-foreground';

export function ChangePasswordForm({ onChangePassword, isSubmitting }: ChangePasswordFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setServerError(null);
      setSuccessMessage(null);

      await onChangePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setSuccessMessage('Senha alterada com sucesso!');
      reset();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      if (err instanceof AppApiError) {
        setServerError(err.message);
        if (err.details?.currentPassword) {
          setError('currentPassword', { message: err.details.currentPassword[0] });
        }
      } else {
        setServerError('Erro ao alterar senha. Verifique os dados e tente novamente.');
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

      <div className="flex max-w-[417px] flex-col gap-6">
        {/* Senha atual */}
        <div>
          <label htmlFor="current-password" className={labelClass}>
            Senha atual <span className="text-[18px] leading-none text-coral">*</span>
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              disabled={isSubmitting}
              {...register('currentPassword')}
              placeholder="••••••••"
              className={cn(inputClass, errors.currentPassword && 'border-error focus:border-error')}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              tabIndex={-1}
              aria-label={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
              <AlertCircle className="h-3 w-3" />
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* Nova senha */}
        <div>
          <label htmlFor="new-password" className={labelClass}>
            Nova senha <span className="text-[18px] leading-none text-coral">*</span>
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              disabled={isSubmitting}
              {...register('newPassword')}
              placeholder="Mínimo de 8 caracteres"
              className={cn(inputClass, errors.newPassword && 'border-error focus:border-error')}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              tabIndex={-1}
              aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
              <AlertCircle className="h-3 w-3" />
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirmar nova senha */}
        <div>
          <label htmlFor="confirm-password" className={labelClass}>
            Confirmar nova senha <span className="text-[18px] leading-none text-coral">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showNewPassword ? 'text' : 'password'}
              disabled={isSubmitting}
              {...register('confirmPassword')}
              placeholder="Repita a nova senha"
              className={cn(inputClass, errors.confirmPassword && 'border-error focus:border-error')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
              <AlertCircle className="h-3 w-3" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 min-w-[131px] items-center justify-center rounded-[3px] bg-primary px-6 text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
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
