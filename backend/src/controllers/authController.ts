import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';
import { authService } from '../services/authService';
import type { LoginInput } from '../schemas/auth.schema';

export const NOME_COOKIE = 'token';

// httpOnly: o JavaScript da página não consegue ler o cookie (protege contra roubo via XSS).
// sameSite lax: o navegador não envia o cookie em requisições vindas de outros sites (protege contra CSRF).
const opcoesCookie: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.COOKIE_SECURE,
};

export const authController = {
  async login(_req: Request, res: Response) {
    const { usuario, senha } = res.locals.body as LoginInput;
    const resultado = await authService.login(usuario, senha);
    res.cookie(NOME_COOKIE, resultado.token, opcoesCookie);
    res.json({ usuario: resultado.usuario });
  },

  me(req: Request, res: Response) {
    res.json({ usuario: req.usuario });
  },

  logout(_req: Request, res: Response) {
    res.clearCookie(NOME_COOKIE, opcoesCookie);
    res.status(204).end();
  },
};
