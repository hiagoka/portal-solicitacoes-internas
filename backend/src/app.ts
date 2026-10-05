import './config/zod';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, naoEncontrado } from './middlewares/errorHandler';
import { registrarRequisicao } from './middlewares/registrarRequisicao';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { solicitacaoRoutes } from './routes/solicitacao.routes';
import { dashboardRoutes } from './routes/dashboard.routes';

// Separado do server.ts para que os testes possam importar o app sem abrir uma porta.
export const app = express();

// Atrás do nginx todas as requisições chegam do IP do proxy; confiar no X-Forwarded-For (1 salto) devolve o IP
// real do cliente, de que o rate limit do login depende. Só ligar quando houver mesmo um proxy confiável na frente.
if (env.TRUST_PROXY) app.set('trust proxy', 1);

app.use(registrarRequisicao()); // primeiro: todo o resto (inclusive erros) já tem um ID e é registrado
// Cabeçalhos de segurança padrão (X-Content-Type-Options, CSP restritiva, sem X-Powered-By etc.). A API só devolve JSON.
app.use(helmet());
// As respostas têm dados pessoais e dependem da sessão: nenhum cache (do navegador ou intermediário) deve guardá-las.
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// credentials: permite enviar o cookie de sessão; exposedHeaders: deixa o frontend ler o ID da requisição (para mostrá-lo em erros).
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, exposedHeaders: ['X-Request-Id'] }));
app.use(express.json());
app.use(cookieParser());

app.use(healthRoutes);
app.use(authRoutes);
app.use(solicitacaoRoutes);
app.use(dashboardRoutes);
// As demais rotas da aplicação serão registradas aqui.

app.use(naoEncontrado);
app.use(errorHandler); // sempre por último
