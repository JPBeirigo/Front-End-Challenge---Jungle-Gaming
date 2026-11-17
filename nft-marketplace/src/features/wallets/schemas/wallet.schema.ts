import { z } from 'zod';

export const walletFormSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome da carteira deve ter pelo menos 2 caracteres.')
    .max(50, 'O nome da carteira não pode exceder 50 caracteres.'),
  address: z
    .string()
    .min(1, 'O endereço da carteira é obrigatório.')
    .regex(/^0x[a-fA-F0-9]{3,42}(\.\.\.[a-fA-F0-9]{3,42})?$/, 'Formato de endereço Ethereum inválido (deve iniciar com 0x).'),
  type: z.enum(['primary', 'secondary'], {
    errorMap: () => ({ message: 'Selecione se a carteira é Principal ou Secundária.' }),
  }),
  network: z.string().min(1, 'Selecione a rede blockchain.'),
});

export type WalletFormData = z.infer<typeof walletFormSchema>;

export const editWalletFormSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome da carteira deve ter pelo menos 2 caracteres.')
    .max(50, 'O nome da carteira não pode exceder 50 caracteres.'),
  type: z.enum(['primary', 'secondary']),
  isDefault: z.boolean().optional(),
});

export type EditWalletFormData = z.infer<typeof editWalletFormSchema>;
