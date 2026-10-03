import type { Request, Response } from 'express';
import { solicitacaoService } from '../services/solicitacaoService';
import type { SolicitacaoInput } from '../schemas/solicitacao.schema';

// Depois do middleware `autenticar`, req.usuario sempre existe.
export const solicitacaoController = {
  async criar(req: Request, res: Response) {
    const dados = res.locals.body as SolicitacaoInput;
    const solicitacao = await solicitacaoService.criar(req.usuario!, dados);
    res.status(201).json({ solicitacao });
  },

  async obter(req: Request, res: Response) {
    const { id } = res.locals.params as { id: number };
    const solicitacao = await solicitacaoService.obter(req.usuario!, id);
    res.json({ solicitacao });
  },

  async listar(req: Request, res: Response) {
    const solicitacoes = await solicitacaoService.listar(req.usuario!);
    res.json({ solicitacoes });
  },
};
