import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env';

// ID enviado pelo cliente só é aproveitado se for curto e feito de caracteres seguros: um valor livre poderia injetar quebras
// de linha ou texto forjado nos logs (log injection).
const ID_SEGURO = /^[A-Za-z0-9._-]{1,64}$/;

const escreverNoConsole = (linha: string) => {
  if (env.NODE_ENV !== 'test') console.log(linha);
};

// Dá a cada requisição um ID único (devolvido no cabeçalho X-Request-Id e disponível em res.locals.idRequisicao) e escreve
// UMA linha JSON no log quando a resposta termina. O ID liga o erro que o usuário viu à linha do log que o explica.
//
// O log NÃO inclui query string (pode ter dados pessoais, como o texto de uma busca), corpo, cookies nem cabeçalhos:
// só o que é preciso para diagnosticar e que não é sensível.
export function registrarRequisicao(escrever: (linha: string) => void = escreverNoConsole): RequestHandler {
  return (req, res, next) => {
    const recebido = req.get('X-Request-Id');
    const id = recebido && ID_SEGURO.test(recebido) ? recebido : randomUUID();
    const inicio = process.hrtime.bigint();

    res.locals.idRequisicao = id;
    res.setHeader('X-Request-Id', id);

    res.on('finish', () => {
      escrever(
        JSON.stringify({
          nivel: 'info',
          id,
          metodo: req.method,
          rota: req.baseUrl + req.path, // sem a query string
          status: res.statusCode,
          duracaoMs: Math.round(Number(process.hrtime.bigint() - inicio) / 1e5) / 10,
        }),
      );
    });
    next();
  };
}
