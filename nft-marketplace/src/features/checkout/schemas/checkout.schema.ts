import { z } from 'zod';

export const collectorInfoSchema = z.object({
  fullName: z
    .string()
    .min(3, 'O nome completo deve conter pelo menos 3 caracteres.')
    .max(100, 'O nome não pode exceder 100 caracteres.'),
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('Insira um formato de e-mail válido.'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[(]?[0-9]{2,4}[)]?[-\s./0-9]*$/.test(val),
      'Formato de telefone inválido (ex: +55 11 99999-9999).'
    ),
});

export type CollectorInfoFormData = z.infer<typeof collectorInfoSchema>;

export const checkoutFormSchema = collectorInfoSchema.extend({
  walletAddress: z
    .string()
    .min(1, 'Selecione uma carteira conectada para a transação.')
    .regex(/^0x[a-fA-F0-9]{3,42}(\.\.\.[a-fA-F0-9]{3,42})?$/, 'Endereço de carteira inválido.'),
  network: z.string().min(1, 'Selecione a rede blockchain.'),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
