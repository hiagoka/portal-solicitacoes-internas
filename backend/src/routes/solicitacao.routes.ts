import { Router } from 'express';
import { solicitacaoController } from '../controllers/solicitacaoController';
import { autenticar } from '../middlewares/autenticar';
import { validar } from '../middlewares/validar';
import { filtrosSchema, idParamSchema, solicitacaoSchema } from '../schemas/solicitacao.schema';

export const solicitacaoRoutes = Router();

solicitacaoRoutes.use('/solicitacoes', autenticar); // todas as rotas abaixo exigem login

solicitacaoRoutes.get('/solicitacoes', validar(filtrosSchema, 'query'), solicitacaoController.listar);
solicitacaoRoutes.post('/solicitacoes', validar(solicitacaoSchema), solicitacaoController.criar);
solicitacaoRoutes.get('/solicitacoes/:id', validar(idParamSchema, 'params'), solicitacaoController.obter);
solicitacaoRoutes.put('/solicitacoes/:id', validar(idParamSchema, 'params'), validar(solicitacaoSchema), solicitacaoController.editar);
solicitacaoRoutes.delete('/solicitacoes/:id', validar(idParamSchema, 'params'), solicitacaoController.excluir);
