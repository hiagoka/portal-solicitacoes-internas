import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'Informe o usuário'),
  senha: z.string().min(1, 'Informe a senha'),
});

export type LoginInput = z.infer<typeof loginSchema>;
