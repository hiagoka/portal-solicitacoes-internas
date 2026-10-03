import { beforeEach, describe, expect, it } from 'vitest';
import { loginComo, resetarBanco } from './helpers';

const valida = { titulo: 'Monitor com defeito', descricao: 'A tela pisca sem parar.', categoria: 'TI' };

describe('POST /solicitacoes', () => {
  beforeEach(resetarBanco);

  it('cria a solicitação com status "aberto", data e solicitante definidos pelo servidor', async () => {
    const maria = await loginComo('maria');
    const res = await maria.post('/solicitacoes').send(valida);

    expect(res.status).toBe(201);
    expect(res.body.solicitacao).toMatchObject({
      titulo: valida.titulo,
      descricao: valida.descricao,
      categoria: 'TI',
      status: 'aberto',
      solicitante: { id: 2, nome: 'Maria Souza' },
    });
    expect(res.body.solicitacao.id).toBeGreaterThan(10);
    expect(new Date(res.body.solicitacao.criadoEm).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it('ignora status e usuário enviados pelo cliente', async () => {
    const maria = await loginComo('maria');
    const res = await maria.post('/solicitacoes').send({ ...valida, status: 'concluido', usuario_id: 3, solicitante: { id: 3 } });

    expect(res.status).toBe(201);
    expect(res.body.solicitacao.status).toBe('aberto');
    expect(res.body.solicitacao.solicitante.id).toBe(2);
  });

  it('remove espaços extras do título e da descrição', async () => {
    const maria = await loginComo('maria');
    const res = await maria.post('/solicitacoes').send({ ...valida, titulo: '   Teclado   ', descricao: '  texto  ' });
    expect(res.body.solicitacao.titulo).toBe('Teclado');
    expect(res.body.solicitacao.descricao).toBe('texto');
  });

  it.each(['TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura'])('aceita a categoria %s', async (categoria) => {
    const maria = await loginComo('maria');
    const res = await maria.post('/solicitacoes').send({ ...valida, categoria });
    expect(res.status).toBe(201);
  });

  describe('validações', () => {
    it.each([
      ['categoria fora da lista', { categoria: 'Marketing' }, 'categoria'],
      ['categoria ausente', { categoria: undefined }, 'categoria'],
      ['título muito curto', { titulo: 'ab' }, 'titulo'],
      ['título só com espaços', { titulo: '     ' }, 'titulo'],
      ['título acima de 150 caracteres', { titulo: 'x'.repeat(151) }, 'titulo'],
      ['descrição vazia', { descricao: '' }, 'descricao'],
      ['descrição acima de 5000 caracteres', { descricao: 'x'.repeat(5001) }, 'descricao'],
    ])('recusa %s com 400', async (_nome, alteracao, campoComErro) => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').send({ ...valida, ...alteracao });

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('Dados inválidos');
      expect(res.body.detalhes.map((d: { campo: string }) => d.campo)).toContain(campoComErro);
    });

    it('recusa JSON malformado com 400', async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').set('Content-Type', 'application/json').send('{ruim');
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('JSON inválido');
    });
  });
});
