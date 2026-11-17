import { z } from 'zod';

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome deve conter pelo menos 3 caracteres.')
    .max(60, 'O nome não pode exceder 60 caracteres.'),
  bio: z
    .string()
    .max(300, 'A biografia não pode exceder 300 caracteres.')
    .optional(),
  // Avatares podem ser URLs absolutas, caminhos locais de assets (/assets/...) ou vazios.
  avatarUrl: z
    .string()
    .refine(
      (value) => value === '' || value.startsWith('/') || z.string().url().safeParse(value).success,
      'URL de avatar inválida.',
    )
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter no mínimo 8 caracteres.')
      .max(50, 'A nova senha não pode exceder 50 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme sua nova senha.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A confirmação de senha não confere com a nova senha.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da senha atual.',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
