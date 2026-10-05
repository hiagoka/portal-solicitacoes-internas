import { z } from 'zod';
import { semNulo } from './comum';

export const loginSchema = z.object({
  usuario: semNulo(z.string().trim().min(1, 'Informe o usuário')),
  senha: semNulo(z.string().min(1, 'Informe a senha')),
});

export type LoginInput = z.infer<typeof loginSchema>;
