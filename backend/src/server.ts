import { app } from './app';
import { env } from './config/env';
import { pool } from './config/database';

const servidor = app.listen(env.PORT, () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});

// Encerramento limpo: para de aceitar requisições e fecha as conexões com o banco.
function encerrar() {
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
