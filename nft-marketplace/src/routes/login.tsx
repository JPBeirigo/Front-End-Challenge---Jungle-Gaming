import { useState } from 'react';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../features/auth/schemas/auth.schema';
import { useAuth } from '../features/auth/context';
import { AppApiError } from '../shared/api/errors';
import { AuthDivider, AuthModal, AuthPageShell, AuthTabs } from '../features/auth/components/AuthPanel';
import { cn } from '../shared/ui/utils';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginComponent,
});

const inputClass =
  'h-10 w-full rounded-[5px] border border-border bg-transparent px-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary';

function LoginComponent() {
  const search = useSearch({ from: '/login' });
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetHint, setShowResetHint] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await login(data, search.redirect);
    } catch (err) {
      if (err instanceof AppApiError) {
        setServerError(err.message);
      } else {
        setServerError('Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell>
      <AuthModal minHeight={600}>
        <AuthTabs active="login" redirect={search.redirect} />
        <p className="mt-3 text-center text-[13px] leading-5 text-secondary">
          Acesse sua conta para comprar, favoritar e gerenciar suas edições.
        </p>

        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 flex items-center gap-2 rounded-[3px] border border-error/40 bg-error/10 p-2.5 text-[12px] text-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[15px] leading-[15px] text-foreground">
              E-mail <span className="text-[18px] leading-none text-coral">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              className={cn(inputClass, errors.email && 'border-error focus:border-error')}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-[11px] text-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="password"
                className="block text-[15px] leading-[15px] text-foreground"
              >
                Senha <span className="text-[18px] leading-none text-coral">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetHint((v) => !v)}
                className="text-[12px] text-accent transition-colors hover:text-primary-light"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Sua senha"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
                className={cn(
                  inputClass,
                  'pr-10',
                  errors.password && 'border-error focus:border-error',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1 text-[11px] text-error">
                {errors.password.message}
              </p>
            )}
            {showResetHint && (
              <p className="mt-2 text-[11px] leading-4 text-muted">
                A recuperação de senha é simulada neste ambiente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex h-[45px] w-full items-center justify-center rounded-[5px] bg-primary text-[14px] font-bold text-ink transition-colors hover:bg-primary-light active:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6">
          <AuthDivider label="Ou continue com" />
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center gap-2.5 rounded-[5px] border border-border text-[13px] font-medium text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-ink">
                G
              </span>
              Continuar com Google
            </button>
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center gap-2.5 rounded-[5px] border border-border text-[13px] font-medium text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-[11px] font-bold text-white">
                f
              </span>
              Continuar com Facebook
            </button>
          </div>
        </div>

      </AuthModal>
    </AuthPageShell>
  );
}
