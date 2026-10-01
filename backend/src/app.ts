import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, naoEncontrado } from './middlewares/errorHandler';
import { healthRoutes } from './routes/health.routes';

// Separado do server.ts para que os testes possam importar o app sem abrir uma porta.
export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true })); // credentials: permite enviar o cookie de sessão
app.use(express.json());
app.use(cookieParser());

app.use(healthRoutes);
// As demais rotas da aplicação serão registradas aqui.

app.use(naoEncontrado);
app.use(errorHandler); // sempre por último
