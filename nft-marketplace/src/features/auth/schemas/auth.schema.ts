import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('Formato de e-mail inválido.'),
  password: z
    .string()
    .min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, 'O nome deve ter no mínimo 3 caracteres.')
      .max(60, 'O nome não pode exceder 60 caracteres.'),
    email: z
      .string()
      .min(1, 'O e-mail é obrigatório.')
      .email('Formato de e-mail inválido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
      .regex(/[0-9]/, 'A senha deve conter ao menos um número.'),
    confirmPassword: z.string().min(1, 'Confirmação de senha obrigatória.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
