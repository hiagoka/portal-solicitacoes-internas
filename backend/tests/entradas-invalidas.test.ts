import { beforeEach, describe, expect, it } from 'vitest';
import { app, loginComo, request, resetarBanco } from './helpers';

// Entradas que um cliente mal-intencionado (ou apenas com defeito) pode enviar. Em todos os casos a API deve
// responder com um erro de CLIENTE (4xx) e nunca com 500, que indicaria uma falha não prevista no servidor.
describe('entradas inválidas nunca causam erro 500', () => {
  beforeEach(resetarBanco);

  describe('código (id) fora do limite do INTEGER do PostgreSQL (2147483647)', () => {
    it.each(['3000000000', '2147483648', '99999999999999999999'])('GET /solicitacoes/%s responde 400', async (id) => {
      const maria = await loginComo('maria');
      const res = await maria.get(`/solicitacoes/${id}`);
      expect(res.status).toBe(400);
      expect(res.body.detalhes[0].campo).toBe('id');
    });

    it('PUT, DELETE e PATCH também recusam com 400', async () => {
      const maria = await loginComo('maria');
      const atendente = await loginComo('atendente');
      const dados = { titulo: 'Título válido', descricao: 'x', categoria: 'TI' };
      expect((await maria.put('/solicitacoes/3000000000').send(dados)).status).toBe(400);
      expect((await maria.delete('/solicitacoes/3000000000')).status).toBe(400);
      expect((await atendente.patch('/solicitacoes/99999999999/status').send({ status: 'concluido' })).status).toBe(400);
    });

    it('o maior valor possível ainda é um código válido (404: apenas não existe)', async () => {
      const maria = await loginComo('maria');
      expect((await maria.get('/solicitacoes/2147483647')).status).toBe(404);
    });
  });

  describe('datas que o PostgreSQL não aceita', () => {
    it.each([['de', '0000-01-01'], ['ate', '0000-12-31']])('?%s=%s responde 400 com "Data inválida"', async (campo, valor) => {
      const maria = await loginComo('maria');
      const res = await maria.get('/solicitacoes').query({ [campo]: valor });
      expect(res.status).toBe(400);
      expect(res.body.detalhes).toEqual([{ campo, mensagem: 'Data inválida' }]);
    });

    it('o primeiro ano real (0001-01-01) continua aceito', async () => {
      const maria = await loginComo('maria');
      expect((await maria.get('/solicitacoes').query({ de: '0001-01-01' })).status).toBe(200);
    });
  });

  describe('caractere nulo (\\u0000), que o PostgreSQL não aceita em textos', () => {
    it('busca na listagem', async () => {
      const maria = await loginComo('maria');
      const res = await maria.get('/solicitacoes').query({ busca: 'abc\u0000' });
      expect(res.status).toBe(400);
      expect(res.body.detalhes[0].campo).toBe('busca');
    });

    it('título e descrição ao criar', async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').send({ titulo: 'abc\u0000def', descricao: 'x\u0000', categoria: 'TI' });
      expect(res.status).toBe(400);
      expect(res.body.detalhes.map((d: { campo: string }) => d.campo).sort()).toEqual(['descricao', 'titulo']);
    });

    it.each([['usuario', { usuario: 'a\u0000b', senha: 'x' }], ['senha', { usuario: 'maria', senha: 'x\u0000y' }]])(
      'login com caractere nulo em %s',
      async (campo, corpo) => {
        const res = await request(app).post('/auth/login').send(corpo);
        expect(res.status).toBe(400);
        expect(res.body.detalhes[0].campo).toBe(campo);
      },
    );
  });

  describe('corpo da requisição', () => {
    it('maior que o limite (100 kb) responde 413 com mensagem em português', async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').send({ titulo: 'Título válido', descricao: 'x'.repeat(200_000), categoria: 'TI' });
      expect(res.status).toBe(413);
      expect(res.body.erro).toBe('O conteúdo enviado é grande demais');
    });

    it('com codificação de caracteres desconhecida responde 415', async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').set('Content-Type', 'application/json; charset=xyz').send('{}');
      expect(res.status).toBe(415);
      expect(res.body.erro).toBe('Tipo de conteúdo não suportado');
    });

    it('com Content-Encoding desconhecido responde 415', async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').set('Content-Type', 'application/json').set('Content-Encoding', 'foo').send('{}');
      expect(res.status).toBe(415);
    });

    it('JSON malformado continua respondendo 400 "JSON inválido"', async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').set('Content-Type', 'application/json').send('{ruim');
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('JSON inválido');
    });
  });
});
